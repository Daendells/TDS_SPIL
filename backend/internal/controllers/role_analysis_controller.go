package controllers

import (
	"net/http"

	"backend/internal/models/web"
	"backend/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// RoleAnalysisController menangani HTTP request untuk Fitur 2 (Role Analysis).
type RoleAnalysisController struct {
	log                 *logrus.Logger
	roleAnalysisService *services.RoleAnalysisService
}

// NewRoleAnalysisController membuat instance baru RoleAnalysisController.
func NewRoleAnalysisController(log *logrus.Logger, roleAnalysisService *services.RoleAnalysisService) *RoleAnalysisController {
	return &RoleAnalysisController{
		log:                 log,
		roleAnalysisService: roleAnalysisService,
	}
}

// Analyze menangani POST /api/role-analysis
// Menerima 1 role dan banyak CV, lalu meranking kandidat berdasarkan kesesuaian.
func (c *RoleAnalysisController) Analyze(ctx *gin.Context) {
	var req web.RoleAnalysisRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		c.log.Errorf("RoleAnalysisController.Analyze: invalid request body: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Request tidak valid. Pastikan role dan candidates terisi."})
		return
	}

	result, err := c.roleAnalysisService.Analyze(ctx.Request.Context(), req)
	if err != nil {
		c.log.Errorf("RoleAnalysisController.Analyze: service error: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}
