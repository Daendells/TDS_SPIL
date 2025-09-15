package config

import (
	"backend/internal/controllers"
	"backend/internal/repositories"
	"backend/internal/routers"
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
	routers.SetupReportRouter(config.App, config.Config, reportController)

	// fmt.Println(report)
}
