package services

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"backend/internal/ai"
	"backend/internal/benchmark"
	"backend/internal/models/web"
	"backend/internal/prompt"
	"backend/internal/utils"
	"github.com/sirupsen/logrus"
)

// RoleAnalysisService menangani business logic Fitur 2:
// Ranking banyak kandidat terhadap SATU role yang dipilih.
type RoleAnalysisService struct {
	log      *logrus.Logger
	provider ai.AIProvider
	benchLog *benchmark.Logger
}

// NewRoleAnalysisService membuat instance baru RoleAnalysisService.
func NewRoleAnalysisService(log *logrus.Logger, provider ai.AIProvider, benchLog *benchmark.Logger) *RoleAnalysisService {
	return &RoleAnalysisService{
		log:      log,
		provider: provider,
		benchLog: benchLog,
	}
}

// candidateInput adalah helper internal untuk goroutine.
type candidateInput struct {
	idx       int
	candidate web.CandidateItem
}

// Analyze melakukan ranking banyak kandidat terhadap satu role.
// Menggunakan satu AI call dengan seluruh data kandidat untuk efisiensi.
func (s *RoleAnalysisService) Analyze(ctx context.Context, req web.RoleAnalysisRequest) (*web.RoleAnalysisResponse, error) {
	if strings.TrimSpace(req.Role) == "" {
		return nil, fmt.Errorf("role tidak boleh kosong")
	}
	if len(req.Candidates) == 0 {
		return nil, fmt.Errorf("minimal 1 kandidat harus diupload")
	}

	// Serialisasi kandidat sebagai JSON untuk dikirim ke AI
	candidatesJSON, err := json.Marshal(req.Candidates)
	if err != nil {
		return nil, fmt.Errorf("gagal serialisasi data kandidat: %w", err)
	}

	systemPrompt := prompt.BuildRoleAnalysisPrompt(req.Role, req.JobDescription, len(req.Candidates))
	userMessage := prompt.RoleAnalysisUserMessage(req.Role, req.JobDescription, string(candidatesJSON))

	aiResp, err := s.provider.Generate(ctx, ai.AIRequest{
		SystemPrompt: systemPrompt,
		UserPrompt:   userMessage,
		MaxTokens:    4096,
		Temperature:  0.2,
	})

	entry := benchmark.LogEntry{
		Feature:    "role_analysis",
		PromptName: "role_analysis",
		Provider:   s.provider.ProviderName(),
		Model:      s.provider.ModelName(),
	}
	if err != nil {
		entry.Success = false
		entry.ErrorMessage = err.Error()
		s.benchLog.Record(entry)
		s.log.WithError(err).Error("RoleAnalysisService: AI provider error")
		return nil, fmt.Errorf("gagal melakukan analisis role: %w", err)
	}

	entry.Success = true
	entry.InputTokens = aiResp.InputTokens
	entry.OutputTokens = aiResp.OutputTokens
	entry.TotalTokens = aiResp.TotalTokens
	entry.LatencyMs = aiResp.LatencyMs
	s.benchLog.Record(entry)

	cleanJSON := utils.CleanJSONResponse(aiResp.Content)
	var result web.RoleAnalysisResponse
	if err := json.Unmarshal([]byte(cleanJSON), &result); err != nil {
		s.log.WithError(err).Errorf("RoleAnalysisService: failed to parse AI response: %s", cleanJSON[:min(200, len(cleanJSON))])
		return nil, fmt.Errorf("gagal memproses respons AI: %w", err)
	}

	// Sort rankings dari skor tertinggi ke terendah dan assign rank yang benar
	sort.Slice(result.Rankings, func(i, j int) bool {
		return result.Rankings[i].FitScore > result.Rankings[j].FitScore
	})
	for i := range result.Rankings {
		result.Rankings[i].Rank = i + 1
	}

	result.TotalCandidates = len(result.Rankings)

	return &result, nil
}
