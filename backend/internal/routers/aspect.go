package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

func AspectRouter(router *gin.Engine, aspectController *controllers.AspectController) {
	aspectRoutes := router.Group("/api/aspects")
	{
		aspectRoutes.POST("", aspectController.Create)
		aspectRoutes.GET("", aspectController.FindAll)
		aspectRoutes.GET("/:id", aspectController.FindByID)
		aspectRoutes.PUT("/:id", aspectController.Update)
		aspectRoutes.DELETE("/:id", aspectController.Delete)
		aspectRoutes.GET("/assessment/:assessmentId", aspectController.FindByAssessmentID)
		aspectRoutes.POST("/:id/assign-question", aspectController.AssignQuestionToAspect)
	}
}
