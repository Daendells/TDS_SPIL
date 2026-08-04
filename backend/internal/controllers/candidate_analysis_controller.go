package controllers

import (
	"net/http"

	"backend/internal/models/web"
	"backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// CandidateAnalysisController menangani HTTP request untuk Fitur 1 (Candidate Analysis).
type CandidateAnalysisController struct {
	log                      *logrus.Logger
	candidateAnalysisService *services.CandidateAnalysisService
	interviewQuestionService *services.InterviewQuestionService
}

// NewCandidateAnalysisController membuat instance baru CandidateAnalysisController.
func NewCandidateAnalysisController(
	log *logrus.Logger,
	candidateAnalysisService *services.CandidateAnalysisService,
	interviewQuestionService *services.InterviewQuestionService,
) *CandidateAnalysisController {
	return &CandidateAnalysisController{
		log:                      log,
		candidateAnalysisService: candidateAnalysisService,
		interviewQuestionService: interviewQuestionService,
	}
}

// Analyze menangani POST /api/candidate-analysis
// Menerima 1 CV dan menganalisisnya terhadap seluruh IT role yang tersedia.
func (c *CandidateAnalysisController) Analyze(ctx *gin.Context) {
	var req web.CandidateAnalysisRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		c.log.Errorf("CandidateAnalysisController.Analyze: invalid request body: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Request tidak valid. Pastikan cv_text terisi."})
		return
	}

	result, err := c.candidateAnalysisService.Analyze(ctx.Request.Context(), req)
	if err != nil {
		c.log.Errorf("CandidateAnalysisController.Analyze: service error: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}

// GenerateInterviewQuestions menangani POST /api/candidate-analysis/interview-questions
// Generate 10 pertanyaan interview on-demand untuk kandidat dan role tertentu.
func (c *CandidateAnalysisController) GenerateInterviewQuestions(ctx *gin.Context) {
	var req web.GenerateInterviewQuestionsRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		c.log.Errorf("CandidateAnalysisController.GenerateInterviewQuestions: invalid request body: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Request tidak valid. Pastikan cv_text dan role terisi."})
		return
	}

	result, err := c.interviewQuestionService.Generate(ctx.Request.Context(), req)
	if err != nil {
		c.log.Errorf("CandidateAnalysisController.GenerateInterviewQuestions: service error: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}
