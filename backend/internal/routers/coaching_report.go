package routers

import (
	"backend/internal/controllers"
	"github.com/gin-gonic/gin"
)

func SetupCoachingReportRoutes(router *gin.Engine, coachingReportController *controllers.CoachingReportController) {
	routes := router.Group("/coaching-reports")
	{
		routes.POST("", coachingReportController.Create)
		routes.GET("", coachingReportController.GetAll)
		routes.GET("/:id", coachingReportController.GetByID)
		routes.PUT("/:id", coachingReportController.Update)
		routes.DELETE("/:id", coachingReportController.Delete)
		routes.GET("/by-report", coachingReportController.GetByReportID)
	}
}
