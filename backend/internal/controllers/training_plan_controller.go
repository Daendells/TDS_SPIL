package controllers

import (
	"backend/internal/services"
	"fmt"
	"net/http"
	"strconv"
	"time"

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
		Program   string `json:"program" binding:"required"`
		StartDate string `json:"startDate"`
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

	var startDate time.Time
	if request.StartDate != "" {
		parsedDate, err := time.Parse("2006-01-02", request.StartDate)
		if err != nil {
			c.log.WithError(err).Error("Invalid start date format")
			ctx.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid start date format. Use YYYY-MM-DD",
			})
			return
		}
		startDate = parsedDate
	} else {
		startDate = time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)
	}

	err := c.trainingPlanService.GenerateSchedulesWithStartDate(request.Program, startDate)
	if err != nil {
		c.log.WithError(err).WithField("program", request.Program).Error("Failed to generate schedules")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate training schedules",
		})
		return
	}

	c.log.WithFields(logrus.Fields{
		"program":    request.Program,
		"start_date": startDate.Format("2006-01-02"),
	}).Info("Successfully generated training schedules")

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
func (c *TrainingPlanController) SwapSchedules(ctx *gin.Context) {
	var request struct {
		Swaps []struct {
			ID            int    `json:"id" binding:"required"`
			ScheduledDate string `json:"scheduledDate" binding:"required"`
		} `json:"swaps" binding:"required,min=1"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   err.Error(),
		})
		return
	}

	c.log.WithFields(logrus.Fields{
		"swaps_count": len(request.Swaps),
	}).Info("Starting to swap schedules")

	for _, swap := range request.Swaps {
		parsedDate, err := time.Parse(time.RFC3339, swap.ScheduledDate)
		if err != nil {
			c.log.WithError(err).Error("Failed to parse scheduled date")
			ctx.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "Invalid date format",
			})
			return
		}

		err = c.trainingPlanService.UpdateScheduledDate(swap.ID, parsedDate)
		if err != nil {
			c.log.WithError(err).Error("Failed to update scheduled date")
			ctx.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Failed to update schedule",
			})
			return
		}
	}

	c.log.Info("Successfully swapped schedules")

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Schedules updated successfully",
	})
}

func (c *TrainingPlanController) GetAvailablePrograms(ctx *gin.Context) {
	programs := []gin.H{
		{"code": "SDP", "name": "Strategic Development Program"},
		{"code": "MDP", "name": "Management Development Program"},
		{"code": "FDP", "name": "Foundational Development Program"},
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    programs,
	})
}

func (c *TrainingPlanController) ExportTrainingPlanExcel(ctx *gin.Context) {
	program := ctx.Query("program")
	if program == "" {
		program = "SDP"
	}

	validPrograms := map[string]bool{"SDP": true, "MDP": true, "FDP": true}
	if !validPrograms[program] {
		c.log.WithField("program", program).Warn("Invalid program for Excel export")
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid program. Must be one of: SDP, MDP, FDP",
		})
		return
	}

	excelBuffer, err := c.trainingPlanService.GenerateTrainingPlanExcel(program)
	if err != nil {
		c.log.WithError(err).WithField("program", program).Error("Failed to generate Excel")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate Excel file",
		})
		return
	}

	filename := fmt.Sprintf("Training_Plan_%s_%s.xlsx", program, time.Now().Format("20060102_150405"))

	ctx.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	ctx.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	ctx.Header("Content-Length", fmt.Sprintf("%d", excelBuffer.Len()))

	ctx.Data(http.StatusOK, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", excelBuffer.Bytes())

	c.log.WithFields(logrus.Fields{
		"program":  program,
		"filename": filename,
	}).Info("Successfully exported training plan to Excel")
}

// ToggleTrainingStarted toggles the is_started flag for a training schedule
// PUT /api/training-plan/toggle-started/:id
func (c *TrainingPlanController) ToggleTrainingStarted(ctx *gin.Context) {
	idStr := ctx.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"code":    http.StatusBadRequest,
			"status":  "Bad Request",
			"error":   "Invalid schedule ID",
		})
		return
	}

	var request struct {
		IsStarted        bool   `json:"isStarted"`
		ApolloCourseName string `json:"apolloCourseName"`
	}

	if err := ctx.ShouldBindJSON(&request); err != nil {
		c.log.WithError(err).Errorf("Failed to bind request body for schedule ID %d", id)
		ctx.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"code":    http.StatusBadRequest,
			"status":  "Bad Request",
			"error":   fmt.Sprintf("Invalid request body: %v", err.Error()),
		})
		return
	}

	c.log.Infof("Toggling training schedule ID %d to is_started=%v with course name: %s", id, request.IsStarted, request.ApolloCourseName)

	err = c.trainingPlanService.ToggleTrainingStarted(id, request.IsStarted, request.ApolloCourseName)
	if err != nil {
		c.log.WithError(err).Error("Failed to toggle training started")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"success": false,
			"code":    http.StatusInternalServerError,
			"status":  "Internal Server Error",
			"error":   err.Error(),
		})
		return
	}

	c.log.Infof("✅ Training schedule ID %d is_started updated to %v", id, request.IsStarted)
	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"code":    http.StatusOK,
		"status":  "OK",
		"message": fmt.Sprintf("Training schedule is_started flag updated to %v", request.IsStarted),
		"data": gin.H{
			"id":         id,
			"is_started": request.IsStarted,
		},
	})
}
