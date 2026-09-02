package routers

import (
	"backend/internal/controllers"
	"backend/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func AspectRouter(router *gin.Engine, aspectController *controllers.AspectController, authMiddleware gin.HandlerFunc) {
	aspectRoutes := router.Group("/api/aspects")
	{
		aspectRoutes.GET("", aspectController.FindAll)
		aspectRoutes.GET("/:id", aspectController.FindByID)
		aspectRoutes.GET("/assessment/:assessmentId", aspectController.FindByAssessmentID)
	}

	aspectAdminRoutes := router.Group("/api/aspects").Use(authMiddleware, middlewares.AdminOnly())
	{
		aspectAdminRoutes.POST("", aspectController.Create)
		aspectAdminRoutes.PUT("/:id", aspectController.Update)
		aspectAdminRoutes.DELETE("/:id", aspectController.Delete)
		aspectAdminRoutes.POST("/:id/assign-question", aspectController.AssignQuestionToAspect)
	}
}
