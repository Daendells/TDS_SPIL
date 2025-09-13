package config

import (
	"fmt"

	"backend/internal/controllers"
	"backend/internal/repositories"
	"backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)

type BootstrapConfig struct {
	DB       *gorm.DB
	App      *gin.Engine
	Log      *logrus.Logger
	Validate *validator.Validate
	Config   *viper.Viper
}

func Bootstrap(config *BootstrapConfig) {
	// Setup Repositories
	reportRepository := repositories.NewReportRepository(config.Log)

	// Setup Service
	reportService := services.NewReportService(config.DB, config.Log, config.Validate, reportRepository)

	// Setup Controller
	reportController := controllers.NewReportController(reportService, config.Log)

	// Setup Routes and Middlewares
	report := config.App.Group("reports")
	{
		report.GET("", reportController.FindAll)
		report.POST("/upload", reportController.CreateAll)
		report.GET("/test", reportController.TestPanic)
	}
	fmt.Println(report)
}
