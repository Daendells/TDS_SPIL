package routers

import (
	"backend/internal/controllers"
	"backend/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func OptionRouter(router *gin.Engine, optionController *controllers.OptionController, authMiddleware gin.HandlerFunc) {
	optionRoutes := router.Group("/api/options")
	{
		optionRoutes.GET("", optionController.FindAll)
		optionRoutes.GET("/:optionId", optionController.FindById)
		optionRoutes.GET("/question/:questionId", optionController.FindByQuestionId)
	}

	optionAdminRoutes := router.Group("/api/options").Use(authMiddleware, middlewares.AdminOnly())
	{
		optionAdminRoutes.POST("", optionController.Create)
		optionAdminRoutes.PUT("/:optionId", optionController.Update)
		optionAdminRoutes.DELETE("/:optionId", optionController.Delete)
	}
}
