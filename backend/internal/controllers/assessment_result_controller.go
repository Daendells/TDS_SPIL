package controllers

import (
	"backend/internal/models/web"
	"backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type AssessmentResultController struct {
	AssessmentResultService services.AssessmentResultService
	Log                     *logrus.Logger
	DB                      *gorm.DB
}

func NewAssessmentResultController(assessmentResultService services.AssessmentResultService, log *logrus.Logger, db *gorm.DB) *AssessmentResultController {
	return &AssessmentResultController{
		AssessmentResultService: assessmentResultService,
		Log:                     log,
		DB:                      db,
	}
}

func (controller *AssessmentResultController) Submit(ctx *gin.Context) {
	var request web.AssessmentSubmitRequest
	err := ctx.ShouldBindJSON(&request)
	if err != nil {
		controller.Log.WithError(err).Error("Error binding assessment submit request")
		webResponse := web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "BAD REQUEST",
			Error:  err.Error(),
		}
		ctx.JSON(http.StatusBadRequest, webResponse)
		return
	}

	assessmentResult, err := controller.AssessmentResultService.SubmitAssessment(controller.DB, &request)
	if err != nil {
		controller.Log.WithError(err).Error("Error submitting assessment")
		webResponse := web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "INTERNAL SERVER ERROR",
			Error:  err.Error(),
		}
		ctx.JSON(http.StatusInternalServerError, webResponse)
		return
	}

	webResponse := web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   assessmentResult,
	}
	ctx.JSON(http.StatusOK, webResponse)
}

func (controller *AssessmentResultController) FindBySeamanCode(ctx *gin.Context) {
	seamanCode := ctx.Param("seamanCode")
	if seamanCode == "" {
		controller.Log.Error("Seaman code is required")
		webResponse := web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "BAD REQUEST",
			Error:  "Seaman code is required",
		}
		ctx.JSON(http.StatusBadRequest, webResponse)
		return
	}

	assessmentResult, err := controller.AssessmentResultService.FindBySeamanCode(controller.DB, seamanCode)
	if err != nil {
		controller.Log.WithError(err).Error("Error finding assessment result by seaman code")
		webResponse := web.ErrorResponse{
			Code:   http.StatusNotFound,
			Status: "NOT FOUND",
			Error:  "Assessment result not found",
		}
		ctx.JSON(http.StatusNotFound, webResponse)
		return
	}

	webResponse := web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   assessmentResult,
	}
	ctx.JSON(http.StatusOK, webResponse)
}