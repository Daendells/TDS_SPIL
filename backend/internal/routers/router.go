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
	QuestionOptionController   *controllers.QuestionOptionController
	AssessmentController       *controllers.AssessmentController
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
		report.GET("/seafarer-code/:seafarerCode", c.ReportController.FindBySeafarerCode)
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
		assessmentResults.GET("/seafarer/:seafarerCode", c.AssessmentResultController.FindBySeafarerCode)
	}

	// Combined question-option routes (Public access - only read operations)
	questionsWithOptions := c.App.Group("api/questions-with-options")
	{
		questionsWithOptions.GET("", c.QuestionOptionController.FindAllQuestionsWithOptions)
	}

	assessment := c.App.Group("api/assessments")
	{
		assessment.GET("/public/:role", c.AssessmentController.FindByRolePublic)
		assessment.GET("", c.AssessmentController.FindAllAssessments)
		assessment.GET("/:role", c.AssessmentController.FindByRole)
		assessment.POST("", c.AssessmentController.CreateAssessment)
		assessment.PUT("/:assessmentId", c.AssessmentController.UpdateAssessment)
		assessment.DELETE("/:assessmentId", c.AssessmentController.DeleteAssessment)
	}

	// Register Question and Option routes
	QuestionRouter(c.App, c.QuestionController)
	OptionRouter(c.App, c.OptionController)
}

func (c *RouterConfig) SetupAuthRouter() {
	// Protected Auth Routes
	auth := c.App.Group("auth").Use(c.AuthMiddleware)
	{
		auth.POST("/logout", c.UserController.Logout)
	}

	assessmentAuth := c.App.Group("api/assessments")
	{
		assessmentAuth.GET("/:role", c.AssessmentController.FindByRole)
		assessmentAuth.PUT("/:assessmentId", c.AssessmentController.UpdateAssessment)
	}


	// Protected Combined question-option routes
	questionsWithOptionsAuth := c.App.Group("api/questions-with-options").Use(c.AuthMiddleware)
	{
		questionsWithOptionsAuth.POST("", c.QuestionOptionController.CreateQuestionWithOptions)
		questionsWithOptionsAuth.PUT("/:questionId", c.QuestionOptionController.UpdateQuestionWithOptions)
		questionsWithOptionsAuth.DELETE("/:questionId", c.QuestionOptionController.DeleteQuestionWithOptions)
		questionsWithOptionsAuth.DELETE("/bulk-delete", c.QuestionOptionController.BulkDelete)
	}
}
