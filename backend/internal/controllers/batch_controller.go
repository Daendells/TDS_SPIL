package controllers

import (
	"backend/internal/models/web"
	"backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type BatchController struct {
	BatchService         *services.BatchService
	BatchSnapshotService *services.BatchSnapshotService
}

func NewBatchController(service *services.BatchService, snapshotService *services.BatchSnapshotService) *BatchController {
	return &BatchController{
		BatchService:         service,
		BatchSnapshotService: snapshotService,
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

func (c *BatchController) FindByID(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "invalid batch id",
		})
		return
	}

	response, err := c.BatchService.FindByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, web.ErrorResponse{
			Code:   http.StatusNotFound,
			Status: "Not Found",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

func (c *BatchController) Update(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "invalid batch id",
		})
		return
	}

	var req web.UpdateBatchRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	response, err := c.BatchService.Update(id, req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, response)
}

// GetSnapshots returns the snapshot rows for a completed batch.
func (c *BatchController) GetSnapshots(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "invalid batch id",
		})
		return
	}

	snapshots, err := c.BatchSnapshotService.GetSnapshotsForBatch(id)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   snapshots,
	})
}
