package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

func OptionRouter(router *gin.Engine, optionController *controllers.OptionController) {
	optionRoutes := router.Group("/api/options")
	{
		optionRoutes.POST("", optionController.Create)
		optionRoutes.GET("", optionController.FindAll)
		optionRoutes.GET("/:optionId", optionController.FindById)
		optionRoutes.GET("/question/:questionId", optionController.FindByQuestionId)
		optionRoutes.PUT("/:optionId", optionController.Update)
		optionRoutes.DELETE("/:optionId", optionController.Delete)
	}
}
