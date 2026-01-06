package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

func SetupMasterRouter(app *gin.Engine, masterController *controllers.MasterController) {
	group := app.Group("/master-reports")
	{
		group.GET("", masterController.FindAll)
		group.GET("/:id", masterController.FindById)
		group.POST("", masterController.Create)
		group.PUT("/:id", masterController.Update)
		group.DELETE("/:id", masterController.Delete)
	}
}
