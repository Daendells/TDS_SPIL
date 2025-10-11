package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

func AssessmentResultRouter(router *gin.Engine, assessmentResultController *controllers.AssessmentResultController) {
	assessmentRoutes := router.Group("/assessment-results")
	{
		assessmentRoutes.POST("/submit", assessmentResultController.Submit)
		assessmentRoutes.GET("/seaman/:seamanCode", assessmentResultController.FindBySeamanCode)
	}
}