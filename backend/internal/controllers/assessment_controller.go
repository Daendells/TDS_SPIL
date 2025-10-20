package controllers

import (
	"backend/internal/helpers"
	"backend/internal/models/web"
	"backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)


type AssessmentController struct {
	Log *logrus.Logger
	DB *gorm.DB
	AssessmentService services.AssessmentService
	QuestionService services.QuestionService
	OptionService services.OptionService
}

func NewAssessmentController(
	log *logrus.Logger,
	db *gorm.DB,
	assessmentService services.AssessmentService,
	questionService services.QuestionService,
	optionService services.OptionService,
) *AssessmentController {
	return &AssessmentController{
		Log: log,
		DB: db,
		AssessmentService: assessmentService,
		QuestionService: questionService,
		OptionService: optionService,
	}
}

func (controller *AssessmentController) FindByRole (ctx *gin.Context) {
	role := ctx.Param("role")

	assessment, err := controller.AssessmentService.FindByRole(controller.DB, role)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code: http.StatusInternalServerError,
			Status: "INTERNAL SERVER ERROR",
			Error: err.Error(),
		})
		return
	}

	questionData, err := controller.QuestionService.FindByRole(controller.DB, role)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code: http.StatusInternalServerError,
			Status: "INTERNAL SERVER ERROR",
			Error: err.Error(),
		})
		return
	}

	var questionsWithOptions []web.QuestionOptionResponse
	for _, question := range questionData {
		options, err := controller.OptionService.FindByQuestionId(controller.DB, question.QuestionID)
		if err != nil {
			options = []web.OptionData{}
		}

		questionWithOptions := web.QuestionOptionResponse{
			QuestionId: question.QuestionID,
			QuestionText: question.QuestionText,
			Category: helpers.PtrToString(question.Category),
			IsImage: helpers.PtrToString(question.IsImage),
			ImageUrl: helpers.PtrToString(question.ImageURL),
			Options: options,
		}
		questionsWithOptions = append(questionsWithOptions, questionWithOptions)
	}

	assessmentResponse := web.AssessmentResponse{
		AssessmentID: assessment.AssessmentID,
		Role: assessment.Role,
		AssessmentName: assessment.AssessmentName,
		UsingTimer: assessment.UsingTimer,
		TimerLimitMinutes: assessment.TimerLimitMinutes,
		Questions: questionsWithOptions,
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse {
		Code: http.StatusOK,
		Status: "Fetch assessment successfully",
		Data: assessmentResponse,
	})
}

func (controller *AssessmentController) UpdateAssessment(ctx *gin.Context) {
	assessmentId, _ := strconv.Atoi(ctx.Param("assessmentId"))
	var request web.AssessmentDataRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code: http.StatusBadRequest,
			Status: "Bad Request",
			Error: err.Error(),
		})
		return
	}

	assessmentRequest := web.AssessmentUpdateRequest{
		AssessmentID:      uint64(assessmentId),
		Role:              request.Role,
		AssessmentName:    request.AssessmentName,
		UsingTimer:        request.UsingTimer,
		TimerLimitMinutes: request.TimerLimitMinutes,
	}

	assessmentData, err := controller.AssessmentService.Update(controller.DB, &assessmentRequest)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code: http.StatusInternalServerError,
			Status: "INTERNAL SERVER ERROR",
			Error: err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code: http.StatusOK,
		Status: "Update assessment successfully",
		Data: assessmentData,
	})
}

func (controller *AssessmentController) CreateAssessment(ctx *gin.Context) {
	var request web.AssessmentCreateRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code: http.StatusBadRequest,
			Status: "Bad Request",
			Error: err.Error(),
		})
		return
	}

	assessmentData, err := controller.AssessmentService.Create(controller.DB, &request)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code: http.StatusInternalServerError,
			Status: "INTERNAL SERVER ERROR",
			Error: err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, web.SuccessResponse{
		Code: http.StatusCreated,
		Status: "Create assessment successfully",
		Data: assessmentData,
	})
}

func (controller *AssessmentController) FindAllAssessments(ctx *gin.Context) {
	assessments, err := controller.AssessmentService.FindAll(controller.DB)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code: http.StatusInternalServerError,
			Status: "INTERNAL SERVER ERROR",
			Error: err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code: http.StatusOK,
		Status: "Fetch all assessments successfully",
		Data: assessments,
	})
}

func (controller *AssessmentController) DeleteAssessment(ctx *gin.Context) {
	assessmentId, err := strconv.ParseUint(ctx.Param("assessmentId"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code: http.StatusBadRequest,
			Status: "Bad Request",
			Error: "Invalid assessment ID",
		})
		return
	}

	err = controller.AssessmentService.Delete(controller.DB, assessmentId)

	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code: http.StatusInternalServerError,
			Status: "INTERNAL SERVER ERROR",
			Error: err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code: http.StatusOK,
		Status: "Delete assessment successfully",
		Data: nil,
	})
}
