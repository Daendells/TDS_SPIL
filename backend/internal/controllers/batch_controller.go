package controllers

import (
	"backend/internal/models/web"
	"backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type BatchController struct {
	BatchService *services.BatchService
}

func NewBatchController(service *services.BatchService) *BatchController {
	return &BatchController{
		BatchService: service,
	}
}

func (c *BatchController) Create(ctx *gin.Context) {
	var req web.CreateBatchRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	response, err := c.BatchService.Create(req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, response)
}

func (c *BatchController) FindAll(ctx *gin.Context) {
	response, err := c.BatchService.FindAll()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, response)
}
