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
	questionRepository := repositories.NewQuestionRepository()
	optionRepository := repositories.NewOptionRepository()

	// Setup Services
	reportService := services.NewReportService(config.DB, config.Log, config.Validate, reportRepository)
	userService := services.NewUserService(config.DB, config.Log, config.Validate, config.Config, userRepository)
	mentoringReportService := services.NewMentoringReportService(config.DB, config.Log, config.Validate, mentoringReportRepository)
	questionService := services.NewQuestionService(questionRepository, config.Validate)
	optionService := services.NewOptionService(optionRepository, config.Validate)

	// Setup Controllers
	reportController := controllers.NewReportController(reportService, config.Log)
	userController := controllers.NewUserController(userService, config.Log)
	mentoringReportController := controllers.NewMentoringReportController(mentoringReportService, config.Log)
	questionController := controllers.NewQuestionController(questionService, config.DB)
	optionController := controllers.NewOptionController(optionService, config.DB)

	// Setup Routes and Middlewares
	authMiddleware := middlewares.AuthMiddleware(config.Config.GetString("JWT_SECRET_KEY"))

	routerConfig := &routers.RouterConfig{
		App:                       config.App,
		ReportController:          reportController,
		UserController:            userController,
		MentoringReportController: mentoringReportController,
		QuestionController:        questionController,
		OptionController:          optionController,
		AuthMiddleware:            authMiddleware,
	}

	routerConfig.Setup()

	// fmt.Println(report)
}
