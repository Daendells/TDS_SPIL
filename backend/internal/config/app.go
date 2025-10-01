package config

import (
	"backend/internal/controllers"
	"backend/internal/middlewares"
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
	userRepository := repositories.NewUserReposiotry(config.Log)
	mentoringReportRepository := repositories.NewMentoringReportRepository(config.Log)

	// Setup Services
	reportService := services.NewReportService(config.DB, config.Log, config.Validate, reportRepository)
	userService := services.NewUserService(config.DB, config.Log, config.Validate, config.Config, userRepository)
	mentoringReportService := services.NewMentoringReportService(config.DB, config.Log, config.Validate, mentoringReportRepository)

	// Setup Controllers
	reportController := controllers.NewReportController(reportService, config.Log)
	userController := controllers.NewUserController(userService, config.Log)
	mentoringReportController := controllers.NewMentoringReportController(mentoringReportService, config.Log)

	// Setup Routes and Middlewares
	authMiddleware := middlewares.AuthMiddleware(config.Config.GetString("JWT_SECRET_KEY"))

	routerConfig := &routers.RouterConfig{
		App:                       config.App,
		ReportController:          reportController,
		UserController:            userController,
		MentoringReportController: mentoringReportController,
		AuthMiddleware:            authMiddleware,
	}

	routerConfig.Setup()

	// fmt.Println(report)
}
