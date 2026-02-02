package controllers

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type ScoringConfigController struct {
	Log         *logrus.Logger
	DB          *gorm.DB
	QuizService services.QuizService
}

func NewScoringConfigController(log *logrus.Logger, db *gorm.DB, quizService services.QuizService) *ScoringConfigController {
	return &ScoringConfigController{
		Log:         log,
		DB:          db,
		QuizService: quizService,
	}
}

func (controller *ScoringConfigController) GetScoringConfig(ctx *gin.Context) {
	assessmentTypeIdParam := ctx.Param("assessmentTypeId")
	assessmentTypeId, err := strconv.ParseUint(assessmentTypeIdParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "Invalid assessment type ID",
		})
		return
	}

	var assessmentType domain.AssessmentType
	if err := controller.DB.Where("id = ?", assessmentTypeId).First(&assessmentType).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, web.ErrorResponse{
				Code:   http.StatusNotFound,
				Status: "Not Found",
				Error:  "Assessment type not found",
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	response := web.ScoringConfigResponse{
		AssessmentTypeID:   assessmentType.ID,
		AssessmentTypeName: assessmentType.AssessmentTypeName,
		ScoringType:        assessmentType.ScoringType,
		ScoringFormula:     assessmentType.ScoringFormula,
		UsePercentage:      assessmentType.UsePercentage,
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "Success",
		Data:   response,
	})
}

func (controller *ScoringConfigController) UpdateScoringConfig(ctx *gin.Context) {
	var request web.UpdateScoringConfigRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	// Validate that assessment type exists
	var assessmentType domain.AssessmentType
	if err := controller.DB.Where("id = ?", request.AssessmentTypeID).First(&assessmentType).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, web.ErrorResponse{
				Code:   http.StatusNotFound,
				Status: "Not Found",
				Error:  "Assessment type not found",
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	// Validate formula if custom scoring
	if request.ScoringType == "custom" {
		if request.ScoringFormula == nil || *request.ScoringFormula == "" {
			ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
				Code:   http.StatusBadRequest,
				Status: "Bad Request",
				Error:  "Scoring formula is required for custom scoring type",
			})
			return
		}

		// Test formula validation
		_, err := controller.QuizService.ValidateFormula(*request.ScoringFormula, 80.0, 100.0)
		if err != nil {
			ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
				Code:   http.StatusBadRequest,
				Status: "Bad Request",
				Error:  "Invalid formula: " + err.Error(),
			})
			return
		}
	}

	// Update assessment type
	assessmentType.ScoringType = request.ScoringType
	assessmentType.ScoringFormula = request.ScoringFormula
	if request.UsePercentage != nil {
		assessmentType.UsePercentage = *request.UsePercentage
	}

	if err := controller.DB.Save(&assessmentType).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	response := web.ScoringConfigResponse{
		AssessmentTypeID:   assessmentType.ID,
		AssessmentTypeName: assessmentType.AssessmentTypeName,
		ScoringType:        assessmentType.ScoringType,
		ScoringFormula:     assessmentType.ScoringFormula,
		UsePercentage:      assessmentType.UsePercentage,
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "Scoring configuration updated successfully",
		Data:   response,
	})
}

func (controller *ScoringConfigController) ValidateFormula(ctx *gin.Context) {
	var request web.FormulaValidationRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	result, err := controller.QuizService.ValidateFormula(request.Formula, request.TestScore, request.TestMaxScore)
	
	response := web.FormulaValidationResponse{
		IsValid: err == nil,
	}
	
	if err == nil {
		response.Result = &result
	} else {
		errorMsg := err.Error()
		response.Error = &errorMsg
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "Formula validation completed",
		Data:   response,
	})
}