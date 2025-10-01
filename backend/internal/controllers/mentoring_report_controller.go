package controllers

import (
	"net/http"
	"strconv"

	"backend/internal/models/web"
	"backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type MentoringReportController struct {
	Log     *logrus.Logger
	Service *services.MentoringReportService
}

func NewMentoringReportController(service *services.MentoringReportService, log *logrus.Logger) *MentoringReportController {
	return &MentoringReportController{
		Log:     log,
		Service: service,
	}
}

func (c *MentoringReportController) Create(ctx *gin.Context) {
	// Validate the Request
	var request web.MentoringReportRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		ctx.Abort()
		return
	}

	// Create mentoring report
	response, err := c.Service.Create(&request)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		ctx.Abort()
		return
	}

	ctx.JSON(response.Code, response)
}

func (c *MentoringReportController) FindAll(ctx *gin.Context) {
	// Get all mentoring reports
	response, err := c.Service.FindAll()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		ctx.Abort()
		return
	}

	ctx.JSON(response.Code, response)
}

func (c *MentoringReportController) FindById(ctx *gin.Context) {
	// Get ID from URL parameter
	idParam := ctx.Param("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "Invalid ID parameter",
		})
		ctx.Abort()
		return
	}

	// Find mentoring report by ID
	response, err := c.Service.FindById(id)
	if err != nil {
		if err.Error() == "mentoring report not found" {
			ctx.JSON(http.StatusNotFound, web.ErrorResponse{
				Code:   http.StatusNotFound,
				Status: "Not Found",
				Error:  err.Error(),
			})
		} else {
			ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
				Code:   http.StatusInternalServerError,
				Status: "Internal Server Error",
				Error:  err.Error(),
			})
		}
		ctx.Abort()
		return
	}

	ctx.JSON(response.Code, response)
}

func (c *MentoringReportController) Update(ctx *gin.Context) {
	// Validate the Request
	var request web.MentoringReportUpdateRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		ctx.Abort()
		return
	}

	// Update mentoring report
	response, err := c.Service.Update(&request)
	if err != nil {
		if err.Error() == "mentoring report not found" {
			ctx.JSON(http.StatusNotFound, web.ErrorResponse{
				Code:   http.StatusNotFound,
				Status: "Not Found",
				Error:  err.Error(),
			})
		} else {
			ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
				Code:   http.StatusInternalServerError,
				Status: "Internal Server Error",
				Error:  err.Error(),
			})
		}
		ctx.Abort()
		return
	}

	ctx.JSON(response.Code, response)
}

func (c *MentoringReportController) Delete(ctx *gin.Context) {
	// Get ID from URL parameter
	idParam := ctx.Param("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "Invalid ID parameter",
		})
		ctx.Abort()
		return
	}

	// Delete mentoring report
	response, err := c.Service.Delete(id)
	if err != nil {
		if err.Error() == "mentoring report not found" {
			ctx.JSON(http.StatusNotFound, web.ErrorResponse{
				Code:   http.StatusNotFound,
				Status: "Not Found",
				Error:  err.Error(),
			})
		} else {
			ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
				Code:   http.StatusInternalServerError,
				Status: "Internal Server Error",
				Error:  err.Error(),
			})
		}
		ctx.Abort()
		return
	}

	ctx.JSON(response.Code, response)
}

func (c *MentoringReportController) FindByMenteeName(ctx *gin.Context) {
	// Get mentee name from query parameter
	menteeName := ctx.Query("menteeName")
	if menteeName == "" {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "menteeName query parameter is required",
		})
		ctx.Abort()
		return
	}

	// Find mentoring reports by mentee name
	response, err := c.Service.FindByMenteeName(menteeName)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		ctx.Abort()
		return
	}

	ctx.JSON(response.Code, response)
}