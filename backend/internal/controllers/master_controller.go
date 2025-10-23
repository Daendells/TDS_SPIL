package controllers

import (
	"backend/internal/models/web"
	"backend/internal/services"
	"net/http"

	"github.com/sirupsen/logrus"

	"github.com/gin-gonic/gin"
)

type MasterController struct {
	Service *services.MasterService
	Log     *logrus.Logger
}

func NewMasterController(service *services.MasterService, log *logrus.Logger) *MasterController {
	return &MasterController{Service: service, Log: log}
}

// GET /master-reports
func (c *MasterController) FindAll(ctx *gin.Context) {
	var req web.MasterListRequest

	// Bind query params: anchor_id, page, page_size
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	res, err := c.Service.FindAll(ctx, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(res.Code, res)
}

// POST /master-reports
func (c *MasterController) Create(ctx *gin.Context) {
	var req web.ReportData

	// Bind JSON body
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	res, err := c.Service.Create(ctx, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(res.Code, res)
}

// DELETE /master-reports/:id
func (c *MasterController) Delete(ctx *gin.Context) {
	idParam := ctx.Param("id")
	var req web.DeleteMasterRequest

	// Parse string ke uint
	if err := req.ParseID(idParam); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	// Panggil service
	res, err := c.Service.Delete(ctx, req.ID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(res.Code, res)
}
