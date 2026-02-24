package controllers

import (
	"backend/internal/models/web"
	"backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type MasterController struct {
	Log     *logrus.Logger
	Service *services.MasterService
}

func NewMasterController(service *services.MasterService, log *logrus.Logger) *MasterController {
	return &MasterController{Service: service, Log: log}
}

func (c *MasterController) FindAll(ctx *gin.Context) {
	var req web.MasterListRequest

	// bind query params like ?anchor_id=10&page=next&page_size=20&query=ASEP
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	// call service with req
	response, err := c.Service.FindAll(req)
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

func (c *MasterController) FindById(ctx *gin.Context) {
	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code: http.StatusBadRequest, Status: "Bad Request", Error: "Invalid ID parameter",
		})
		return
	}

	response, err := c.Service.FindById(uint(id))
	if err != nil {
		if err.Error() == "master report not found" {
			ctx.JSON(http.StatusNotFound, web.ErrorResponse{
				Code: http.StatusNotFound, Status: "Not Found", Error: err.Error(),
			})
		} else {
			ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
				Code: http.StatusInternalServerError, Status: "Internal Server Error", Error: err.Error(),
			})
		}
		return
	}

	ctx.JSON(response.Code, response)
}

func (c *MasterController) Create(ctx *gin.Context) {
	var request web.MasterReportData
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code: http.StatusBadRequest, Status: "Bad Request", Error: err.Error(),
		})
		return
	}

	response, err := c.Service.Create(&request)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code: http.StatusInternalServerError, Status: "Internal Server Error", Error: err.Error(),
		})
		return
	}

	ctx.JSON(response.Code, response)
}

func (c *MasterController) Update(ctx *gin.Context) {
	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code: http.StatusBadRequest, Status: "Bad Request", Error: "Invalid ID parameter",
		})
		return
	}

	var request web.UpdateMasterRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code: http.StatusBadRequest, Status: "Bad Request", Error: err.Error(),
		})
		return
	}

	response, err := c.Service.Update(uint(id), &request)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code: http.StatusInternalServerError, Status: "Internal Server Error", Error: err.Error(),
		})
		return
	}

	ctx.JSON(response.Code, response)
}

func (c *MasterController) Delete(ctx *gin.Context) {
	idParam := ctx.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code: http.StatusBadRequest, Status: "Bad Request", Error: "Invalid ID parameter",
		})
		return
	}

	response, err := c.Service.Delete(uint(id))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code: http.StatusInternalServerError, Status: "Internal Server Error", Error: err.Error(),
		})
		return
	}

	ctx.JSON(response.Code, response)
}

func (c *MasterController) GetMentoringPrograms(ctx *gin.Context) {
	personName := ctx.Query("personName")
	if personName == "" {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "personName query parameter is required",
		})
		return
	}

	response, err := c.Service.GetMentoringProgramsByPersonName(personName)
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

func (c *MasterController) BulkAssignBatch(ctx *gin.Context) {
	var request web.BulkAssignBatchRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	response, err := c.Service.BulkAssignBatch(ctx.Request.Context(), &request)
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
