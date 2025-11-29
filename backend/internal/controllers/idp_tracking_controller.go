package controllers

import (
	"backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type IDPTrackingController struct {
	Log                   *logrus.Logger
	IDPCalculationService *services.IDPCalculationService
}

func NewIDPTrackingController(
	log *logrus.Logger,
	idpCalculationService *services.IDPCalculationService,
) *IDPTrackingController {
	return &IDPTrackingController{
		Log:                   log,
		IDPCalculationService: idpCalculationService,
	}
}

// RefreshReadiness manually refreshes readiness for a specific report
// POST /api/idp-tracking/refresh/:reportId
func (c *IDPTrackingController) RefreshReadiness(ctx *gin.Context) {
	reportIDStr := ctx.Param("reportId")
	reportID, err := strconv.Atoi(reportIDStr)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"code":    http.StatusBadRequest,
			"status":  "Bad Request",
			"message": "Invalid report ID",
		})
		return
	}

	c.Log.Infof("Manual refresh requested for report ID: %d", reportID)

	if err := c.IDPCalculationService.RefreshReadinessForReport(reportID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"code":    http.StatusInternalServerError,
			"status":  "Internal Server Error",
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"status":  "OK",
		"message": "Readiness refreshed successfully",
	})
}

// RefreshAllReadiness manually refreshes readiness for all active reports
// POST /api/idp-tracking/refresh-all
func (c *IDPTrackingController) RefreshAllReadiness(ctx *gin.Context) {
	c.Log.Info("Manual refresh requested for all active reports")

	if err := c.IDPCalculationService.CalculateReadinessForAllReports(); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"code":    http.StatusInternalServerError,
			"status":  "Internal Server Error",
			"message": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"status":  "OK",
		"message": "Readiness refreshed successfully for all active reports",
	})
}
