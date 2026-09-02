package routers

import (
	"backend/internal/controllers"
	"backend/internal/middlewares"

	"github.com/gin-gonic/gin"
)

func SetupAdminRouter(app *gin.Engine, adminController *controllers.AdminController, authMiddleware gin.HandlerFunc) {
	admin := app.Group("admin").Use(authMiddleware, middlewares.AdminOnly())
	{
		admin.GET("/statistics", adminController.GetStatistics)
		admin.DELETE("/reports", adminController.DeleteAllReports)
		admin.DELETE("/idp-tracking", adminController.DeleteAllIDPTracking)
		admin.DELETE("/assessment-results", adminController.DeleteAllAssessmentResults)
	}
}
