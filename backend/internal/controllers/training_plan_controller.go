package controllers

import (
	"backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type TrainingPlanController struct {
	trainingPlanService services.TrainingPlanService
	log                 *logrus.Logger
}

func NewTrainingPlanController(trainingPlanService services.TrainingPlanService, log *logrus.Logger) *TrainingPlanController {
	return &TrainingPlanController{
		trainingPlanService: trainingPlanService,
		log:                 log,
	}
}

// GetTrainingPlan handles GET /api/training-plan?program=SDP
func (c *TrainingPlanController) GetTrainingPlan(ctx *gin.Context) {
	program := ctx.Query("program")
	if program == "" {
		program = "SDP" // Default to SDP if not specified
	}

	// Validate program
	validPrograms := map[string]bool{"SDP": true, "MDP": true, "FDP": true}
	if !validPrograms[program] {
		c.log.WithField("program", program).Warn("Invalid program requested")
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid program. Must be one of: SDP, MDP, FDP",
		})
		return
	}

	trainingPlan, err := c.trainingPlanService.GetTrainingPlan(program)
	if err != nil {
		c.log.WithError(err).WithField("program", program).Error("Failed to get training plan")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve training plan",
		})
		return
	}

	c.log.WithFields(logrus.Fields{
		"program":            program,
		"participants_count": len(trainingPlan.Participants),
	}).Info("Successfully retrieved training plan")

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    trainingPlan,
	})
}

// GenerateSchedules handles POST /api/training-plan/generate-schedules
func (c *TrainingPlanController) GenerateSchedules(ctx *gin.Context) {
	var request struct {
		Program string `json:"program" binding:"required"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		c.log.WithError(err).Error("Invalid request body for generate schedules")
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request body",
		})
		return
	}

	// Validate program
	validPrograms := map[string]bool{"SDP": true, "MDP": true, "FDP": true}
	if !validPrograms[request.Program] {
		c.log.WithField("program", request.Program).Warn("Invalid program for schedule generation")
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid program. Must be one of: SDP, MDP, FDP",
		})
		return
	}

	err := c.trainingPlanService.GenerateSchedules(request.Program)
	if err != nil {
		c.log.WithError(err).WithField("program", request.Program).Error("Failed to generate schedules")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate training schedules",
		})
		return
	}

	c.log.WithField("program", request.Program).Info("Successfully generated training schedules")

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Training schedules generated successfully",
	})
}

// GetCompetencyMapping handles GET /api/training-plan/competency-mapping?program=SDP
func (c *TrainingPlanController) GetCompetencyMapping(ctx *gin.Context) {
	program := ctx.Query("program")
	if program == "" {
		program = "SDP" // Default to SDP if not specified
	}

	// Validate program
	validPrograms := map[string]bool{"SDP": true, "MDP": true, "FDP": true}
	if !validPrograms[program] {
		c.log.WithField("program", program).Warn("Invalid program for competency mapping")
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid program. Must be one of: SDP, MDP, FDP",
		})
		return
	}

	mapping := c.trainingPlanService.GetCompetencyMapping(program)

	c.log.WithField("program", program).Info("Successfully retrieved competency mapping")

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data": gin.H{
			"program": program,
			"mapping": mapping,
		},
	})
}

// GetAvailablePrograms handles GET /api/training-plan/programs
func (c *TrainingPlanController) GetAvailablePrograms(ctx *gin.Context) {
	programs := []gin.H{
		{"code": "SDP", "name": "Senior Development Program"},
		{"code": "MDP", "name": "Management Development Program"},
		{"code": "FDP", "name": "Future Development Program"},
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    programs,
	})
}
