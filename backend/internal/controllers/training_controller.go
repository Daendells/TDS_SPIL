package controllers

import (
	"net/http"

	"backend/internal/models/web"
	"backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type TrainingController struct {
	Log     *logrus.Logger
	Service *services.TrainingService
}

func NewTrainingController(service *services.TrainingService, log *logrus.Logger) *TrainingController {
	return &TrainingController{
		Service: service,
		Log:     log,
	}
}

func (c *TrainingController) FindAll(ctx *gin.Context) {
	resp, err := c.Service.FindAll()
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}
	ctx.JSON(resp.Code, resp)
}

func (c *TrainingController) Update(ctx *gin.Context) {
	no := ctx.Param("no")
	
	var request web.TrainingUpdateRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	resp, err := c.Service.Update(no, &request)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}
	ctx.JSON(resp.Code, resp)
}

func (c *TrainingController) Delete(ctx *gin.Context) {
	no := ctx.Param("no")
	
	resp, err := c.Service.Delete(no)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}
	ctx.JSON(resp.Code, resp)
}