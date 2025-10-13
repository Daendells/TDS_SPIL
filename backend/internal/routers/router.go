package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

type RouterConfig struct {
	App                        *gin.Engine
	ReportController           *controllers.ReportController
	UserController             *controllers.UserController
	MentoringReportController  *controllers.MentoringReportController
	QuestionController         *controllers.QuestionController
	OptionController           *controllers.OptionController
	AssessmentResultController *controllers.AssessmentResultController
	AuthMiddleware             gin.HandlerFunc
}

func (c *RouterConfig) Setup() {
	c.SetupGuestRouter()
	c.SetupAuthRouter()
}

func (c *RouterConfig) SetupGuestRouter() {
	// TODO: Setup Login

	auth := c.App.Group("auth")
	{
		auth.POST("/login", c.UserController.Login)
	}

	report := c.App.Group("reports")
	{
		report.GET("", c.ReportController.FindAll)
		report.GET("/idp-count", c.ReportController.IDPCount)
		report.GET("/seaman-code/:seamanCode", c.ReportController.FindBySeamanCode)
		report.POST("/upload", c.ReportController.CreateAll)
		report.GET("/test", c.ReportController.TestPanic)
	}

	mentoringReports := c.App.Group("mentoring-reports")
	{
		mentoringReports.POST("", c.MentoringReportController.Create)
		mentoringReports.GET("", c.MentoringReportController.FindAll)
		mentoringReports.GET("/:id", c.MentoringReportController.FindById)
		mentoringReports.PUT("", c.MentoringReportController.Update)
		mentoringReports.DELETE("/:id", c.MentoringReportController.Delete)
		mentoringReports.GET("/by-mentee", c.MentoringReportController.FindByMenteeName)
		mentoringReports.GET("/reports/:reportId", c.MentoringReportController.FindByReportID)
	}

	questions := c.App.Group("questions")
	{
		questions.POST("", c.QuestionController.Create)
		questions.GET("", c.QuestionController.FindAll)
		questions.GET("/:questionId", c.QuestionController.FindById)
	}

	options := c.App.Group("options")
	{
		options.POST("", c.OptionController.Create)
		options.GET("", c.OptionController.FindAll)
		options.GET("/:optionId", c.OptionController.FindById)
		options.GET("/question/:questionId", c.OptionController.FindByQuestionId)
	}

	assessmentResults := c.App.Group("assessment-results")
	{
		assessmentResults.POST("/submit", c.AssessmentResultController.Submit)
		assessmentResults.GET("/seaman/:seamanCode", c.AssessmentResultController.FindBySeamanCode)
	}
}

func (c *RouterConfig) SetupAuthRouter() {
	// TODO: Declare the Authmiddleware
	c.App.Use(c.AuthMiddleware)

	// Protected Auth Routes only

	// TODO: Setup Auth Routes
	auth := c.App.Group("auth")
	{
		auth.POST("/logout", c.UserController.Logout)
	}
}
