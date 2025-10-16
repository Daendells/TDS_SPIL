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