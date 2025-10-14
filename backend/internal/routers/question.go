package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

func QuestionRouter(router *gin.Engine, questionController *controllers.QuestionController) {
	questionRoutes := router.Group("/api/questions")
	{
		questionRoutes.POST("", questionController.Create)
		questionRoutes.GET("", questionController.FindAll)
		questionRoutes.GET("/:questionId", questionController.FindById)
		questionRoutes.GET("/role/:role", questionController.FindByRole)
		questionRoutes.PUT("/:questionId", questionController.Update)
		questionRoutes.DELETE("/:questionId", questionController.Delete)
		questionRoutes.DELETE("/bulk", questionController.BulkDelete)
	}
}
