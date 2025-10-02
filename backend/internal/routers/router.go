package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

type RouterConfig struct {
	App                       *gin.Engine
	ReportController          *controllers.ReportController
	UserController            *controllers.UserController
	MentoringReportController *controllers.MentoringReportController
	AuthMiddleware            gin.HandlerFunc
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
}

func (c *RouterConfig) SetupAuthRouter() {
	// TODO: Declare the Authmiddleware
	c.App.Use(c.AuthMiddleware)

	// TODO: Setup Report Routes
	report := c.App.Group("reports")
	{
		report.GET("", c.ReportController.FindAll)
		report.GET("/idp-count", c.ReportController.IDPCount)
		report.POST("/upload", c.ReportController.CreateAll)
		report.GET("/test", c.ReportController.TestPanic)
	}

	// TODO: Setup Mentoring Report Routes
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

	// TODO: Setup Auth Routes
	auth := c.App.Group("auth")
	{
		auth.POST("/logout", c.UserController.Logout)
	}
}
