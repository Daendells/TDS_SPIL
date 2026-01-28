package controllers

import (
	"net/http"

	"backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type AdminController struct {
	Log     *logrus.Logger
	Service *services.AdminService
}

func NewAdminController(service *services.AdminService, log *logrus.Logger) *AdminController {
	return &AdminController{
		Log:     log,
		Service: service,
	}
}

func (c *AdminController) GetStatistics(ctx *gin.Context) {
	response, err := c.Service.GetDataStatistics()
	if err != nil {
		c.Log.Errorf("Failed to get statistics: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve statistics",
		})
		return
	}

	ctx.JSON(response.Code, response)
}

func (c *AdminController) DeleteAllReports(ctx *gin.Context) {
	response, err := c.Service.DeleteAllReports()
	if err != nil {
		c.Log.Errorf("Failed to delete all reports: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete reports",
		})
		return
	}

	ctx.JSON(response.Code, response)
}

func (c *AdminController) DeleteAllIDPTracking(ctx *gin.Context) {
	response, err := c.Service.DeleteAllIDPTracking()
	if err != nil {
		c.Log.Errorf("Failed to delete IDP tracking: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete IDP tracking",
		})
		return
	}

	ctx.JSON(response.Code, response)
}

func (c *AdminController) DeleteAllAssessmentResults(ctx *gin.Context) {
	response, err := c.Service.DeleteAllAssessmentResults()
	if err != nil {
		c.Log.Errorf("Failed to delete assessment results: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete assessment results",
		})
		return
	}

	ctx.JSON(response.Code, response)
}
