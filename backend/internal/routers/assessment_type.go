package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

func AssessmentTypeRouter(app *gin.Engine, assessmentTypeController *controllers.AssessmentTypeController) {
	assessmentTypes := app.Group("api/assessment-types")
	{
		assessmentTypes.GET("", assessmentTypeController.FindAll)
		assessmentTypes.GET("/:id", assessmentTypeController.FindByID)
		assessmentTypes.POST("", assessmentTypeController.Create)
		assessmentTypes.PUT("/:id", assessmentTypeController.Update)
		assessmentTypes.DELETE("/:id", assessmentTypeController.Delete)
	}
}

func SeafarerAssessmentRouter(app *gin.Engine, seafarerAssessmentController *controllers.SeafarerAssessmentController) {
	seafarerAssessments := app.Group("api/seafarer-assessments")
	{
		seafarerAssessments.GET("", seafarerAssessmentController.FindAll)
		seafarerAssessments.GET("/:id", seafarerAssessmentController.FindByID)
		seafarerAssessments.GET("/by-seafarer/:seafarerCode", seafarerAssessmentController.FindBySeafarerCode)
		seafarerAssessments.GET("/by-assessment-type/:assessmentTypeId", seafarerAssessmentController.FindByAssessmentTypeID)
		seafarerAssessments.POST("", seafarerAssessmentController.Assign)
		seafarerAssessments.PUT("/:id/status", seafarerAssessmentController.UpdateStatus)
		seafarerAssessments.DELETE("/:id", seafarerAssessmentController.Delete)
	}
}
