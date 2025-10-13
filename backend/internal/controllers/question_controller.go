package controllers

import (
	"backend/internal/models/web"
	"backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type QuestionController struct {
	QuestionService services.QuestionService
	DB              *gorm.DB
}

func NewQuestionController(questionService services.QuestionService, db *gorm.DB) *QuestionController {
	return &QuestionController{
		QuestionService: questionService,
		DB:              db,
	}
}

func (controller *QuestionController) Create(ctx *gin.Context) {
	var request web.QuestionCreateRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "BAD REQUEST",
			Error:  err.Error(),
		})
		return
	}

	questionData, err := controller.QuestionService.Create(controller.DB, &request)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "INTERNAL SERVER ERROR",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, web.SuccessResponse{
		Code:   http.StatusCreated,
		Status: "CREATED",
		Data:   questionData,
	})
}

func (controller *QuestionController) FindAll(ctx *gin.Context) {
	questionDataList, err := controller.QuestionService.FindAll(controller.DB)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "INTERNAL SERVER ERROR",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   questionDataList,
	})
}

func (controller *QuestionController) FindById(ctx *gin.Context) {
	questionIdStr := ctx.Param("questionId")
	questionId, err := strconv.Atoi(questionIdStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "BAD REQUEST",
			Error:  "Invalid question ID",
		})
		return
	}

	questionData, err := controller.QuestionService.FindById(controller.DB, questionId)
	if err != nil {
		ctx.JSON(http.StatusNotFound, web.ErrorResponse{
			Code:   http.StatusNotFound,
			Status: "NOT FOUND",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   questionData,
	})
}

func (controller *QuestionController) FindByRole(ctx *gin.Context) {
	role := ctx.Param("role")

	questionDataList, err := controller.QuestionService.FindByRole(controller.DB, role)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "INTERNAL SERVER ERROR",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   questionDataList,
	})
}

func (controller *QuestionController) Update(ctx *gin.Context) {
	var request web.QuestionUpdateRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "BAD REQUEST",
			Error:  err.Error(),
		})
		return
	}

	questionData, err := controller.QuestionService.Update(controller.DB, &request)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "INTERNAL SERVER ERROR",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   questionData,
	})
}

func (controller *QuestionController) Delete(ctx *gin.Context) {
	questionIdStr := ctx.Param("questionId")
	questionId, err := strconv.Atoi(questionIdStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "BAD REQUEST",
			Error:  "Invalid question ID",
		})
		return
	}

	err = controller.QuestionService.Delete(controller.DB, questionId)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "INTERNAL SERVER ERROR",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   "Question deleted successfully",
	})
}