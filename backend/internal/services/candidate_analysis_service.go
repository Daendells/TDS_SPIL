package services

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"

	"backend/internal/ai"
	"backend/internal/benchmark"
	"backend/internal/models/web"
	"backend/internal/prompt"
	"backend/internal/utils"
	"github.com/sirupsen/logrus"
)

// CandidateAnalysisService menangani business logic Fitur 1:
// Analisis 1 CV terhadap seluruh IT role yang dipilih (Goroutine Workers + Concurrency Semaphore + Retry).
type CandidateAnalysisService struct {
	log      *logrus.Logger
	provider ai.AIProvider
	benchLog *benchmark.Logger
}

// NewCandidateAnalysisService membuat instance baru CandidateAnalysisService.
func NewCandidateAnalysisService(log *logrus.Logger, provider ai.AIProvider, benchLog *benchmark.Logger) *CandidateAnalysisService {
	return &CandidateAnalysisService{
		log:      log,
		provider: provider,
		benchLog: benchLog,
	}
}

// callBatchWithRetry memanggil AI provider dengan mekanisme retry otomatis jika terjadi rate-limit atau empty response.
func (s *CandidateAnalysisService) callBatchWithRetry(ctx context.Context, systemPrompt, userMessage string, maxRetries int) (*ai.AIResponse, error) {
	var lastErr error
	for attempt := 1; attempt <= maxRetries; attempt++ {
		aiResp, err := s.provider.Generate(ctx, ai.AIRequest{
			SystemPrompt: systemPrompt,
			UserPrompt:   userMessage,
			MaxTokens:    2048,
			Temperature:  0.3,
		})
		if err == nil && aiResp != nil && strings.TrimSpace(aiResp.Content) != "" {
			return aiResp, nil
		}
		if err != nil {
			lastErr = err
		} else {
			lastErr = fmt.Errorf("empty AI response")
		}
		s.log.Warnf("CandidateAnalysisService: batch attempt %d/%d failed (%v), retrying in 500ms...", attempt, maxRetries, lastErr)
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-time.After(500 * time.Millisecond):
		}
	}
	return nil, lastErr
}

// Analyze menganalisis satu CV terhadap role IT yang dipilih.
func (s *CandidateAnalysisService) Analyze(ctx context.Context, req web.CandidateAnalysisRequest) (*web.CandidateAnalysisResponse, error) {
	if strings.TrimSpace(req.CVText) == "" {
		return nil, fmt.Errorf("CV text tidak boleh kosong")
	}

	roles := req.TargetRoles
	if len(roles) == 0 {
		roles = prompt.DefaultITRoles
	}

	// Bagi daftar role menjadi batch-batch (max 3 role per batch)
	batchSize := 3
	var batches [][]web.TargetRoleItem
	for i := 0; i < len(roles); i += batchSize {
		end := i + batchSize
		if end > len(roles) {
			end = len(roles)
		}
		batches = append(batches, roles[i:end])
	}

	startAll := time.Now()
	var wg sync.WaitGroup
	var mu sync.Mutex

	// Semaphore untuk membatasi max 2 request simultan ke OpenRouter free tier
	// agar tidak terbentur rate-limit "empty response from AI provider"
	sem := make(chan struct{}, 2)

	var combinedRoleFits []web.RoleFitItem
	var profileSummary string
	var candidateName string = req.CandidateName
	var firstError error

	totalInputTokens := 0
	totalOutputTokens := 0
	totalTokens := 0

	for batchIdx, roleBatch := range batches {
		wg.Add(1)
		go func(bIdx int, batch []web.TargetRoleItem) {
			defer wg.Done()

			// Acquire semaphore slot
			sem <- struct{}{}
			defer func() { <-sem }()

			systemPrompt := prompt.BuildCandidateAnalysisPrompt(req.CandidateName, batch)
			userMessage := prompt.CandidateAnalysisUserMessage(req.CVText)

			aiResp, err := s.callBatchWithRetry(ctx, systemPrompt, userMessage, 3)

			mu.Lock()
			defer mu.Unlock()

			if err != nil {
				s.log.WithError(err).Errorf("CandidateAnalysisService: batch %d failed after retries", bIdx)
				if firstError == nil {
					firstError = err
				}
				return
			}

			totalInputTokens += aiResp.InputTokens
			totalOutputTokens += aiResp.OutputTokens
			totalTokens += aiResp.TotalTokens

			cleanJSON := utils.CleanJSONResponse(aiResp.Content)
			var subResult web.CandidateAnalysisResponse
			if err := json.Unmarshal([]byte(cleanJSON), &subResult); err != nil {
				s.log.WithError(err).Errorf("CandidateAnalysisService: failed to parse batch %d JSON. Raw: %s | Clean: %s", bIdx, aiResp.Content, cleanJSON)
				if firstError == nil {
					firstError = fmt.Errorf("gagal memproses respons AI batch %d", bIdx)
				}
				return
			}

			combinedRoleFits = append(combinedRoleFits, subResult.RoleFits...)

			if subResult.ProfileSummary != "" && profileSummary == "" {
				profileSummary = subResult.ProfileSummary
			}
			// Ekstrak nama asli kandidat jika didapatkan dari AI
			if subResult.CandidateName != "" && subResult.CandidateName != "Kandidat" && (candidateName == "" || candidateName == "Kandidat") {
				candidateName = subResult.CandidateName
			}
		}(batchIdx, roleBatch)
	}

	wg.Wait()
	latencyMs := time.Since(startAll).Milliseconds()

	// Catat log benchmark
	entry := benchmark.LogEntry{
		Feature:      "candidate_analysis_parallel",
		PromptName:   "candidate_analysis",
		Provider:     s.provider.ProviderName(),
		Model:        s.provider.ModelName(),
		InputTokens:  totalInputTokens,
		OutputTokens: totalOutputTokens,
		TotalTokens:  totalTokens,
		LatencyMs:    latencyMs,
		Success:      len(combinedRoleFits) > 0,
	}
	if firstError != nil && len(combinedRoleFits) == 0 {
		entry.ErrorMessage = firstError.Error()
		s.benchLog.Record(entry)
		return nil, fmt.Errorf("gagal melakukan analisis kandidat: %w", firstError)
	}
	s.benchLog.Record(entry)

	// Deduplikasi dan Sort role_fits dari skor tertinggi ke terendah
	roleFitsMap := make(map[string]web.RoleFitItem)
	var finalFits []web.RoleFitItem
	for _, rf := range combinedRoleFits {
		if _, exists := roleFitsMap[rf.Role]; !exists && rf.Role != "" {
			roleFitsMap[rf.Role] = rf
			finalFits = append(finalFits, rf)
		}
	}

	sort.Slice(finalFits, func(i, j int) bool {
		return finalFits[i].FitScore > finalFits[j].FitScore
	})

	var bestFitRole string
	var bestFitScore int
	if len(finalFits) > 0 {
		bestFitRole = finalFits[0].Role
		bestFitScore = finalFits[0].FitScore
	}

	if candidateName == "" {
		candidateName = "Kandidat"
	}
	if profileSummary == "" {
		profileSummary = fmt.Sprintf("Analisis kandidat %s terhadap %d role IT.", candidateName, len(finalFits))
	}

	return &web.CandidateAnalysisResponse{
		CandidateName:  candidateName,
		ProfileSummary: profileSummary,
		BestFitRole:    bestFitRole,
		BestFitScore:   bestFitScore,
		RoleFits:       finalFits,
	}, nil
}
