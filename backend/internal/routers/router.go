package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

type RouterConfig struct {
	App              *gin.Engine
	ReportController *controllers.ReportController
	UserController   *controllers.UserController
	AuthMiddleware   gin.HandlerFunc
}

func (c *RouterConfig) Setup() {
	c.SetupAuthRouter()
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
		report.GET("/test", c.AuthMiddleware, c.ReportController.TestPanic)
	}
}
