package controllers

import (
	"net/http"

	"backend/internal/models/web"
	"backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/sirupsen/logrus"
)

type ReportController struct {
	Log     *logrus.Logger
	Service *services.ReportService
}

func NewReportController(service *services.ReportService, log *logrus.Logger) *ReportController {
	return &ReportController{
		Log:     log,
		Service: service,
	}
}

func (controller *ReportController) CreateAll(ctx *gin.Context) {
	fileHeader, err := ctx.FormFile("file")
	if err != nil {
		panic(err)
	}

	// TODO: Make request
	reportRequest := &web.ReportRequest{
		File: fileHeader,
	}

	// TODO: Call Service
	response, err := controller.Service.CreateAll(ctx, reportRequest)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, response)
}

func (controller *ReportController) FindAll(ctx *gin.Context) {
	var request web.DashboardRequest

	// TODO: Bind / Validate the request
	if err := ctx.ShouldBindQuery(&request); err != nil {
		//! Parse validation errors
		errs, ok := err.(validator.ValidationErrors)
		if !ok {
			ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
				Code:   http.StatusBadRequest,
				Status: "Bad Request",
				Error:  err.Error(),
			})
			return
		}

		//! Custom error
		errorMessages := request.ParseError(errs)

		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  errorMessages,
		})
		return
	}

	// Success
	response, err := controller.Service.FindAll(ctx, &request)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}
	ctx.JSON(response.Code, response)
}

func (controller *ReportController) IDPCount(ctx *gin.Context) {
	// TODO: Call Service
	response, err := controller.Service.IDPCount(ctx)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
	}

	ctx.JSON(response.Code, response)
}

func (controlelr *ReportController) TestPanic(ctx *gin.Context) {
	panic("Oopps...")
}
