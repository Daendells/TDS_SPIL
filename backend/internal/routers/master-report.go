package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

func SetupMasterRouter(app *gin.Engine, masterController *controllers.MasterController) {
	group := app.Group("/master-reports")
	{
		group.GET("", masterController.FindAll)
		group.POST("", masterController.Create)
	}
}
