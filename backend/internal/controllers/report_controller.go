package controllers

import (
	"net/http"

	"backend/internal/helpers"
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
	// var request web.ReportRequest

	// // Binding
	// if err := ctx.ShouldBind(&request); err != nil {
	// 	panic(err)
	// }

	fileHeader, err := ctx.FormFile("file")
	if err != nil {
		panic(err)
	}

	// file, err := fileHeader.Open()
	// if err != nil {
	// 	panic(err)
	// }

	// defer file.Close()

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
				Status: "Bad Request 1",
				Error:  err.Error(),
			})
			return
		}

		//! Custom error
		errorMessages := make(map[string]string)

		for _, e := range errs {
			// field := strings.ToLower(e.Field()) // Struct Field name (e.g. "Page", etc)

			field := helpers.GetFieldTagName(web.DashboardRequest{}, e.Field())
			switch e.Tag() {
			case "required":
				errorMessages[field] = "is required"
			case "oneof":
				errorMessages[field] = "must be one of: " + e.Param()
			case "gte":
				errorMessages[field] = "must be greater or equal to " + e.Param()
			case "lte":
				errorMessages[field] = "must be less or equal to " + e.Param()
			case "min":
				errorMessages[field] = "must be at least " + e.Param()
			default:
				errorMessages[field] = "is invalid"
			}
		}

		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  errorMessages,
		})
		return
	}

	// Success
	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "Ok",
		Data:   "OK",
	})
	return
}

func (controlelr *ReportController) TestPanic(ctx *gin.Context) {
	panic("Oopps...")
}
