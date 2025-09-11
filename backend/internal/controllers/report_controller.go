package controllers

import (
	"net/http"

	"backend/internal/models/web"
	"backend/internal/services"

	"github.com/gin-gonic/gin"
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

func (controlelr *ReportController) TestPanic(ctx *gin.Context) {
	panic("Oopps...")
}
