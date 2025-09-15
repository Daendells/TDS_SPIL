package routers

import (
	"backend/internal/controllers"
	"backend/internal/middlewares"

	"github.com/gin-gonic/gin"
	"github.com/spf13/viper"
)

func SetupReportRouter(app *gin.Engine, config *viper.Viper, reportController *controllers.ReportController) {
	report := app.Group("reports")
	{
		report.GET("", reportController.FindAll)
		report.GET("/idp-count", reportController.IDPCount)
		report.POST("/upload", reportController.CreateAll)
		report.GET("/test", middlewares.AuthMiddleware(config.GetString("JWT_SECRET_KEY")), reportController.TestPanic)
	}
}
