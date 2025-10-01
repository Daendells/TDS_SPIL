package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

type MentoringReportRouterConfig struct {
	App                       *gin.Engine
	MentoringReportController *controllers.MentoringReportController
	AuthMiddleware            gin.HandlerFunc
}

func (c *MentoringReportRouterConfig) SetupMentoringReportRoutes() {
	// Apply auth middleware
	c.App.Use(c.AuthMiddleware)

	// Setup Mentoring Report Routes
	mentoringReports := c.App.Group("mentoring-reports")
	{
		mentoringReports.POST("", c.MentoringReportController.Create)
		mentoringReports.GET("", c.MentoringReportController.FindAll)
		mentoringReports.GET("/:id", c.MentoringReportController.FindById)
		mentoringReports.PUT("", c.MentoringReportController.Update)
		mentoringReports.DELETE("/:id", c.MentoringReportController.Delete)
		mentoringReports.GET("/by-mentee", c.MentoringReportController.FindByMenteeName)
	}
}