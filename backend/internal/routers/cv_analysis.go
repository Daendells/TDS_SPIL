package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

func CVAnalysisRouter(router *gin.Engine, cvAnalysisController *controllers.CVAnalysisController) {
	cv := router.Group("api/cv-analysis")
	{
		cv.POST("/analyze", cvAnalysisController.AnalyzeCV)
	}
}