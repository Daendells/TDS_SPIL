package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

func SetupAdminRouter(app *gin.Engine, adminController *controllers.AdminController) {
	admin := app.Group("admin")
	{
		admin.GET("/statistics", adminController.GetStatistics)
		admin.DELETE("/reports", adminController.DeleteAllReports)
		admin.DELETE("/idp-tracking", adminController.DeleteAllIDPTracking)
		admin.DELETE("/assessment-results", adminController.DeleteAllAssessmentResults)
	}
}
