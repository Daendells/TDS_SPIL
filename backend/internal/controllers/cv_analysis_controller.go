package controllers

import (
	"backend/internal/models/web"
	"backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type CVAnalysisController struct {
	Log               *logrus.Logger
	CVAnalysisService *services.CVAnalysisService
}

func NewCVAnalysisController(log *logrus.Logger, cvAnalysisService *services.CVAnalysisService) *CVAnalysisController {
	return &CVAnalysisController{
		Log:               log,
		CVAnalysisService: cvAnalysisService,
	}
}

func (c *CVAnalysisController) AnalyzeCV(ctx *gin.Context) {
	var req web.CVAnalysisRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		c.Log.Errorf("Failed to bind CV analysis request: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	result, err := c.CVAnalysisService.AnalyzeCV(ctx.Request.Context(), req.CVText, req.Role)
	if err != nil {
		c.Log.Errorf("Failed to analyze CV: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}

func (c *CVAnalysisController) RankCandidates(ctx *gin.Context) {
	var req web.RankCandidatesRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		c.Log.Errorf("Failed to bind rank candidates request: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body for candidate ranking"})
		return
	}

	result, err := c.CVAnalysisService.RankCandidates(ctx.Request.Context(), req)
	if err != nil {
		c.Log.Errorf("Failed to rank candidates: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}

func (c *CVAnalysisController) RecommendRoles(ctx *gin.Context) {
	var req web.RecommendRolesRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		c.Log.Errorf("Failed to bind recommend roles request: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body for role recommendation"})
		return
	}

	result, err := c.CVAnalysisService.RecommendRoles(ctx.Request.Context(), req)
	if err != nil {
		c.Log.Errorf("Failed to recommend roles: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}

func (c *CVAnalysisController) AnalyzeUnifiedCVs(ctx *gin.Context) {
	var req web.UnifiedCVAnalysisRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		c.Log.Errorf("Failed to bind unified CV analysis request: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body for unified analysis"})
		return
	}

	result, err := c.CVAnalysisService.AnalyzeUnifiedCVs(ctx.Request.Context(), req)
	if err != nil {
		c.Log.Errorf("Failed to analyze unified CVs: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}