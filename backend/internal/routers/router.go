package routers

import (
	"backend/internal/controllers"
	traininggen "backend/internal/controllers/training"

	"github.com/gin-gonic/gin"
)

type RouterConfig struct {
	App                       *gin.Engine
	ReportController          *controllers.ReportController
	UserController            *controllers.UserController
	MentoringReportController *controllers.MentoringReportController
	TrainingController        *controllers.TrainingController   // DB
	TrainingGenController     *traininggen.TrainingController    // LLM Generator
	AuthMiddleware            gin.HandlerFunc
}

func (c *RouterConfig) Setup() {
	c.App.Static("/files", "./public")
	c.SetupGuestRouter()
	c.SetupAuthRouter()
}

func (c *RouterConfig) SetupGuestRouter() {
	auth := c.App.Group("auth")
	{
		auth.POST("/login", c.UserController.Login)
	}

	report := c.App.Group("reports")
	{
		report.GET("", c.ReportController.FindAll)
		report.GET("/idp-count", c.ReportController.IDPCount)
		report.POST("/upload", c.ReportController.CreateAll)
		report.GET("/test", c.ReportController.TestPanic)
	}

	mentoring := c.App.Group("mentoring-reports")
	{
		mentoring.POST("", c.MentoringReportController.Create)
		mentoring.GET("", c.MentoringReportController.FindAll)
		mentoring.GET("/:id", c.MentoringReportController.FindById)
		mentoring.PUT("", c.MentoringReportController.Update)
		mentoring.DELETE("/:id", c.MentoringReportController.Delete)
	}

    trainings := c.App.Group("trainings")
    {
        trainings.GET("", c.TrainingGenController.FindAll)       // dari DB
        trainings.POST("/generate", c.TrainingGenController.Generate) // dari LLM
    }    
}

func (c *RouterConfig) SetupAuthRouter() {
	c.App.Use(c.AuthMiddleware)

	auth := c.App.Group("auth")
	{
		auth.POST("/logout", c.UserController.Logout)
	}
}