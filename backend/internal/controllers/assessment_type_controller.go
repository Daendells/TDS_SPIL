package controllers

import (
	"backend/internal/models/web"
	"backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type AssessmentTypeController struct {
	Log                   *logrus.Logger
	DB                    *gorm.DB
	AssessmentTypeService services.AssessmentTypeService
}

func NewAssessmentTypeController(
	log *logrus.Logger,
	db *gorm.DB,
	assessmentTypeService services.AssessmentTypeService,
) *AssessmentTypeController {
	return &AssessmentTypeController{
		Log:                   log,
		DB:                    db,
		AssessmentTypeService: assessmentTypeService,
	}
}

func (controller *AssessmentTypeController) FindAll(ctx *gin.Context) {
	assessmentTypes, err := controller.AssessmentTypeService.FindAll(controller.DB)
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
		Data:   assessmentTypes,
	})
}

func (controller *AssessmentTypeController) FindByID(ctx *gin.Context) {
	id := ctx.Param("id")
	assessmentTypeID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "BAD REQUEST",
			Error:  "Invalid assessment type ID",
		})
		return
	}

	assessmentType, err := controller.AssessmentTypeService.FindByID(controller.DB, assessmentTypeID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			ctx.JSON(http.StatusNotFound, web.ErrorResponse{
				Code:   http.StatusNotFound,
				Status: "NOT FOUND",
				Error:  "Assessment type not found",
			})
			return
		}
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
		Data:   assessmentType,
	})
}

func (controller *AssessmentTypeController) Create(ctx *gin.Context) {
	var request web.AssessmentTypeCreateRequest
	err := ctx.ShouldBindJSON(&request)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "BAD REQUEST",
			Error:  err.Error(),
		})
		return
	}

	assessmentType, err := controller.AssessmentTypeService.Create(controller.DB, &request)
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
		Data:   assessmentType,
	})
}

func (controller *AssessmentTypeController) Update(ctx *gin.Context) {
	id := ctx.Param("id")
	assessmentTypeID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "BAD REQUEST",
			Error:  "Invalid assessment type ID",
		})
		return
	}

	var request web.AssessmentTypeUpdateRequest
	err = ctx.ShouldBindJSON(&request)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "BAD REQUEST",
			Error:  err.Error(),
		})
		return
	}

	request.ID = assessmentTypeID

	assessmentType, err := controller.AssessmentTypeService.Update(controller.DB, &request)
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
		Data:   assessmentType,
	})
}

func (controller *AssessmentTypeController) Delete(ctx *gin.Context) {
	id := ctx.Param("id")
	assessmentTypeID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "BAD REQUEST",
			Error:  "Invalid assessment type ID",
		})
		return
	}

	err = controller.AssessmentTypeService.Delete(controller.DB, assessmentTypeID)
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
		Data:   nil,
	})
}

func (controller *AssessmentTypeController) CheckStatus(ctx *gin.Context) {
	id := ctx.Param("id")
	assessmentTypeID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "BAD REQUEST",
			Error:  "Invalid assessment type ID",
		})
		return
	}

	statusData, err := controller.AssessmentTypeService.CheckStatusByID(controller.DB, assessmentTypeID)
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
		Data:   statusData,
	})
}
