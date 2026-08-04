package services

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"backend/internal/ai"
	"backend/internal/benchmark"
	"backend/internal/models/web"
	"backend/internal/prompt"
	"backend/internal/utils"
	"github.com/sirupsen/logrus"
)

// InterviewQuestionService menangani business logic generate interview questions.
// Generate dilakukan on-demand ketika user menekan tombol — tidak otomatis.
type InterviewQuestionService struct {
	log      *logrus.Logger
	provider ai.AIProvider
	benchLog *benchmark.Logger
}

// NewInterviewQuestionService membuat instance baru InterviewQuestionService.
func NewInterviewQuestionService(log *logrus.Logger, provider ai.AIProvider, benchLog *benchmark.Logger) *InterviewQuestionService {
	return &InterviewQuestionService{
		log:      log,
		provider: provider,
		benchLog: benchLog,
	}
}

// Generate membuat 10 pertanyaan interview on-demand untuk kandidat dan role tertentu.
func (s *InterviewQuestionService) Generate(ctx context.Context, req web.GenerateInterviewQuestionsRequest) (*web.InterviewQuestionsResponse, error) {
	if strings.TrimSpace(req.CVText) == "" {
		return nil, fmt.Errorf("CV text tidak boleh kosong")
	}
	if strings.TrimSpace(req.Role) == "" {
		return nil, fmt.Errorf("role tidak boleh kosong")
	}

	candidateName := req.CandidateName
	if candidateName == "" {
		candidateName = "Kandidat"
	}

	systemPrompt := prompt.BuildInterviewQuestionPrompt(candidateName, req.Role)
	userMessage := prompt.InterviewQuestionUserMessage(req.CVText, req.Role)

	aiResp, err := s.provider.Generate(ctx, ai.AIRequest{
		SystemPrompt: systemPrompt,
		UserPrompt:   userMessage,
		MaxTokens:    3000,
		Temperature:  0.4,
	})

	entry := benchmark.LogEntry{
		Feature:    "interview_question",
		PromptName: "interview_question",
		Provider:   s.provider.ProviderName(),
		Model:      s.provider.ModelName(),
	}
	if err != nil {
		entry.Success = false
		entry.ErrorMessage = err.Error()
		s.benchLog.Record(entry)
		s.log.WithError(err).Error("InterviewQuestionService: AI provider error")
		return nil, fmt.Errorf("gagal generate pertanyaan interview: %w", err)
	}

	entry.Success = true
	entry.InputTokens = aiResp.InputTokens
	entry.OutputTokens = aiResp.OutputTokens
	entry.TotalTokens = aiResp.TotalTokens
	entry.LatencyMs = aiResp.LatencyMs
	s.benchLog.Record(entry)

	cleanJSON := utils.CleanJSONResponse(aiResp.Content)
	var result web.InterviewQuestionsResponse
	if err := json.Unmarshal([]byte(cleanJSON), &result); err != nil {
		s.log.WithError(err).Errorf("InterviewQuestionService: failed to parse AI response: %s", cleanJSON[:min(200, len(cleanJSON))])
		return nil, fmt.Errorf("gagal memproses respons AI: %w", err)
	}

	return &result, nil
}
