package routers

import (
	"backend/internal/controllers"
	"backend/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func QuestionRouter(router *gin.Engine, questionController *controllers.QuestionController, authMiddleware gin.HandlerFunc) {
	questionRoutes := router.Group("/api/questions")
	{
		questionRoutes.GET("", questionController.FindAll)
		questionRoutes.GET("/:questionId", questionController.FindById)
		questionRoutes.GET("/role/:role", questionController.FindByRole)
		questionRoutes.GET("/assessment/:assessmentId", questionController.FindByAssessmentId)
	}

	questionAdminRoutes := router.Group("/api/questions").Use(authMiddleware, middlewares.AdminOnly())
	{
		questionAdminRoutes.POST("", questionController.Create)
		questionAdminRoutes.PUT("/:questionId", questionController.Update)
		questionAdminRoutes.PUT("/:questionId/aspect", questionController.UpdateAspect)
		questionAdminRoutes.PUT("/bulk/aspect", questionController.BulkUpdateAspect)
		questionAdminRoutes.DELETE("/:questionId", questionController.Delete)
		questionAdminRoutes.DELETE("/bulk", questionController.BulkDelete)
	}
}
