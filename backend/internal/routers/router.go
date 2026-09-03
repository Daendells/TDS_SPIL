package routers

import (
	"backend/internal/controllers"
	traininggen "backend/internal/controllers/training"
	"backend/internal/middlewares"

	"github.com/gin-gonic/gin"
)

type RouterConfig struct {
	App                          *gin.Engine
	ReportController             *controllers.ReportController
	UserController               *controllers.UserController
	MentoringReportController    *controllers.MentoringReportController
	CoachingReportController     *controllers.CoachingReportController
	TrainingController           *controllers.TrainingController // DB
	TrainingGenController        *traininggen.TrainingController // LLM Generator
	TrainingPlanController       *controllers.TrainingPlanController
	CompetencyMappingController  *controllers.CompetencyMappingController
	CompetencyTypeController     *controllers.CompetencyTypeController
	QuestionController           *controllers.QuestionController
	OptionController             *controllers.OptionController
	AssessmentResultController   *controllers.AssessmentResultController
	QuestionOptionController     *controllers.QuestionOptionController
	AssessmentController         *controllers.AssessmentController
	AssessmentTypeController     *controllers.AssessmentTypeController
	SeafarerAssessmentController *controllers.SeafarerAssessmentController
	MasterController             *controllers.MasterController
	AssignmentController         *controllers.AssignmentController
	AspectController             *controllers.AspectController
	IDPTrackingController        *controllers.IDPTrackingController
	SeamanController             *controllers.SeamanController
	QuizController               *controllers.QuizController
	ScoringConfigController      *controllers.ScoringConfigController
	NewRecruiterController       *controllers.NewRecruiterController
	AuthMiddleware               gin.HandlerFunc
	BatchController              *controllers.BatchController
	CVAnalysisController            *controllers.CVAnalysisController
	CandidateAnalysisController     *controllers.CandidateAnalysisController
	RoleAnalysisController          *controllers.RoleAnalysisController
	PDFController                   *controllers.PDFController
	CVRoleController                *controllers.CVRoleController
	DISCController                  *controllers.DISCController
}

func (c *RouterConfig) Setup() {
	// Health check endpoint (no auth required)
	c.App.GET("/health", controllers.HealthCheck)

	c.App.Static("/files", "./public")
	c.App.Static("/storage", "./storage")
	c.SetupGuestRouter()
	c.SetupAuthRouter()
	c.SetupAssignmentRouter()

	c.SetupMasterRouter()
	c.SetupBatchRouter()
	c.SetupQuizRouter()
	c.SetupScoringConfigRouter()
	c.SetupCVAnalysisRouter()
	c.SetupCandidateAnalysisRouter()
	c.SetupRoleAnalysisRouter()
	c.SetupPDFRouter()
	c.SetupCVRoleRouter()
	c.SetupDISCRouter()
}

func (c *RouterConfig) SetupDISCRouter() {
	disc := c.App.Group("/api/v1/disc-analytics")
	disc.Use(c.AuthMiddleware)
	{
		disc.GET("/summary", c.DISCController.GetSummary)
		disc.GET("/candidates", c.DISCController.GetCandidates)
		disc.GET("/candidates/:id", c.DISCController.GetCandidateByID)
		disc.POST("/upload", c.DISCController.UploadCSV)
		disc.POST("/sync-sheet", c.DISCController.SyncGoogleSheet)
		disc.POST("/reset", c.DISCController.ResetData)
	}
}

func (c *RouterConfig) SetupGuestRouter() {
	// Authentication & SSO
	auth := c.App.Group("auth")
	{
		auth.POST("/login", c.UserController.Login)
	}

	sso := c.App.Group("api/auth/sso")
	{
		sso.GET("/initiate", c.UserController.InitiateSSO)
		sso.GET("/callback", c.UserController.SSOCallback)
	}

	// Reports (Read operations)
	report := c.App.Group("reports")
	{
		report.GET("", c.ReportController.FindAll)
		report.GET("/idp-count", c.ReportController.IDPCount)
		report.GET("/seaman-code/:seamanCode", c.ReportController.FindBySeamanCode)
		report.GET("/seafarer-code/:seafarerCode", c.ReportController.FindBySeafarerCode)
		report.GET("/seafarer-code/:seafarerCode/training-data", c.ReportController.GetTrainingData)
		report.GET("/seafarer-code/:seafarerCode/training-summary", c.ReportController.GetTrainingSummary)
		report.GET("/test", c.ReportController.TestPanic)
	}

	// Trainings (Read operations)
	trainings := c.App.Group("trainings")
	{
		trainings.GET("", c.TrainingGenController.FindAll)
	}

	// Training Plan (Read operations)
	trainingPlan := c.App.Group("api/training-plan")
	{
		trainingPlan.GET("", c.TrainingPlanController.GetTrainingPlan)
		trainingPlan.GET("/competency-mapping", c.TrainingPlanController.GetCompetencyMapping)
		trainingPlan.GET("/programs", c.TrainingPlanController.GetAvailablePrograms)
		trainingPlan.GET("/export-excel", c.TrainingPlanController.ExportTrainingPlanExcel)
		trainingPlan.GET("/overdue-count", c.TrainingPlanController.GetOverdueCount)
	}

	// Competency Mapping (Read operations)
	competencyMapping := c.App.Group("api/competency-mappings")
	{
		competencyMapping.GET("", c.CompetencyMappingController.GetMappingsByProgram)
		competencyMapping.GET("/all", c.CompetencyMappingController.GetAllMappings)
	}

	// Competency Types (Read only)
	competencyTypes := c.App.Group("api/competency-types")
	{
		competencyTypes.GET("", c.CompetencyTypeController.GetAll)
		competencyTypes.GET("/active", c.CompetencyTypeController.GetActive)
		competencyTypes.GET("/:id", c.CompetencyTypeController.GetByID)
		competencyTypes.GET("/code/:code", c.CompetencyTypeController.GetByCode)
	}

	// All trainings endpoint for dropdowns
	c.App.GET("api/trainings", c.CompetencyMappingController.GetAllTrainings)

	// Mentoring Reports (Read operations)
	mentoringReports := c.App.Group("mentoring-reports")
	{
		mentoringReports.GET("", c.MentoringReportController.FindAll)
		mentoringReports.GET("/:id", c.MentoringReportController.FindById)
		mentoringReports.GET("/by-mentee", c.MentoringReportController.FindByMenteeName)
		mentoringReports.GET("/reports/:reportId", c.MentoringReportController.FindByReportID)
	}

	// Coaching Reports (Read operations)
	coachingReports := c.App.Group("coaching-reports")
	{
		coachingReports.GET("", c.CoachingReportController.GetAll)
		coachingReports.GET("/:id", c.CoachingReportController.GetByID)
		coachingReports.GET("/reports/:reportId", c.CoachingReportController.GetByReportID)
	}

	// Questions & Options (Read operations)
	questions := c.App.Group("questions")
	{
		questions.GET("", c.QuestionController.FindAll)
		questions.GET("/:questionId", c.QuestionController.FindById)
	}

	options := c.App.Group("options")
	{
		options.GET("", c.OptionController.FindAll)
		options.GET("/:optionId", c.OptionController.FindById)
		options.GET("/question/:questionId", c.OptionController.FindByQuestionId)
	}

	questionsWithOptions := c.App.Group("api/questions-with-options")
	{
		questionsWithOptions.GET("", c.QuestionOptionController.FindAllQuestionsWithOptions)
	}

	// Assessments (Read operations)
	assessment := c.App.Group("api/assessments")
	{
		assessment.GET("/public/:role", c.AssessmentController.FindByRolePublic)
		assessment.GET("", c.AssessmentController.FindAllAssessments)
	}

	// Assessment Types (Read operations)
	assessmentTypes := c.App.Group("api/assessment-types")
	{
		assessmentTypes.GET("", c.AssessmentTypeController.FindAll)
		assessmentTypes.GET("/check-status/:id", c.AssessmentTypeController.CheckStatus)
		assessmentTypes.GET("/:id", c.AssessmentTypeController.FindByID)
	}

	// Seafarer Assessments (Read operations + Candidate attempt increment)
	seafarerAssessments := c.App.Group("api/seafarer-assessments")
	{
		seafarerAssessments.GET("", c.SeafarerAssessmentController.FindAll)
		seafarerAssessments.GET("/check-assignment/:seafarerCode/:assessmentTypeId", c.SeafarerAssessmentController.CheckAssignment)
		seafarerAssessments.GET("/check-assignment/:seafarerCode/:assessmentTypeId/:role", c.SeafarerAssessmentController.CheckAssignmentWithRole)
		seafarerAssessments.POST("/increment-attempts/:seafarerCode/:assessmentTypeId", c.SeafarerAssessmentController.IncrementAttempts)
		seafarerAssessments.GET("/:id", c.SeafarerAssessmentController.FindByID)
		seafarerAssessments.GET("/by-seafarer/:seafarerCode", c.SeafarerAssessmentController.FindBySeafarerCode)
		seafarerAssessments.GET("/by-assessment-type/:assessmentTypeId", c.SeafarerAssessmentController.FindByAssessmentTypeID)
	}

	// New Recruiters Public Quiz/Assessment
	newRecruitersPublic := c.App.Group("api/new-recruiters")
	{
		newRecruitersPublic.GET("/check-assignment/:token/:assessmentTypeId", c.NewRecruiterController.CheckAssignment)
		newRecruitersPublic.GET("/check-assignment/:token/:assessmentTypeId/:role", c.NewRecruiterController.CheckAssignmentWithRole)
		newRecruitersPublic.POST("/increment-attempts/:token/:assessmentTypeId", c.NewRecruiterController.IncrementAttempts)
		newRecruitersPublic.POST("/assessment-results/submit", c.NewRecruiterController.SubmitAssessment)
		newRecruitersPublic.POST("/quiz/submit", c.NewRecruiterController.SubmitQuiz)
	}

	// Assessment Results Submit
	assessmentResults := c.App.Group("assessment-results")
	{
		assessmentResults.POST("/submit", c.AssessmentResultController.Submit)
	}

	// Seamen (Read operations)
	seamen := c.App.Group("api/seamen")
	{
		seamen.GET("/available", c.SeamanController.SearchAvailableSeamen)
	}

	// Register Question, Option, Aspect routes
	QuestionRouter(c.App, c.QuestionController, c.AuthMiddleware)
	OptionRouter(c.App, c.OptionController, c.AuthMiddleware)
	AspectRouter(c.App, c.AspectController, c.AuthMiddleware)
}

func (c *RouterConfig) SetupAuthRouter() {
	// Authenticated General Routes
	auth := c.App.Group("auth").Use(c.AuthMiddleware)
	{
		auth.POST("/logout", c.UserController.Logout)
	}

	assessmentResultsAuth := c.App.Group("assessment-results").Use(c.AuthMiddleware)
	{
		assessmentResultsAuth.GET("/seafarer/:seafarerCode", c.AssessmentResultController.FindBySeafarerCode)
		assessmentResultsAuth.GET("/report/:seafarerCode", c.AssessmentResultController.GetValueAssessmentReportBySeafarerCode)
	}

	newRecruitersAuth := c.App.Group("api/new-recruiters").Use(c.AuthMiddleware)
	{
		newRecruitersAuth.GET("", c.NewRecruiterController.FindAll)
		newRecruitersAuth.GET("/search", c.NewRecruiterController.Search)
		newRecruitersAuth.GET("/assignments", c.NewRecruiterController.FindAssignments)
	}

	assessmentAuth := c.App.Group("api/assessments").Use(c.AuthMiddleware)
	{
		assessmentAuth.GET("/unassigned-list", c.AssessmentController.FindUnassigned)
		assessmentAuth.GET("/:role", c.AssessmentController.FindByRole)
	}

	// ── ADMIN ONLY MUTATING ROUTES ──────────────────────────────────────────

	// User Management Routes (admin only)
	userMgmt := c.App.Group("api/users").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		userMgmt.POST("", c.UserController.CreateUser)
		userMgmt.GET("", c.UserController.GetAllUsers)
		userMgmt.GET("/:id", c.UserController.GetUserByID)
		userMgmt.PUT("/:id", c.UserController.UpdateUser)
		userMgmt.DELETE("/:id", c.UserController.DeleteUser)
	}

	// Reports Admin Mutations
	reportsAdmin := c.App.Group("reports").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		reportsAdmin.POST("/refresh-personal-data", c.ReportController.RefreshPersonalData)
		reportsAdmin.POST("/upload", c.ReportController.CreateAll)
	}

	// Trainings Admin Mutations
	trainingsAdmin := c.App.Group("trainings").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		trainingsAdmin.POST("", c.TrainingController.Create)
		trainingsAdmin.POST("/generate", c.TrainingGenController.Generate)
		trainingsAdmin.POST("/generate-quiz", c.TrainingGenController.GenerateQuiz)
		trainingsAdmin.PUT("/:no", c.TrainingController.Update)
		trainingsAdmin.PUT("/:no/referensi", c.TrainingController.UpdateReferensi)
		trainingsAdmin.DELETE("/:no", c.TrainingController.Delete)
	}

	// Training Plan Admin Mutations
	trainingPlanAdmin := c.App.Group("api/training-plan").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		trainingPlanAdmin.POST("/generate-schedules", c.TrainingPlanController.GenerateSchedules)
		trainingPlanAdmin.PUT("/swap-schedules", c.TrainingPlanController.SwapSchedules)
		trainingPlanAdmin.PUT("/toggle-started/:id", c.TrainingPlanController.ToggleTrainingStarted)
	}

	// IDP Tracking Admin Mutations
	idpTrackingAdmin := c.App.Group("api/idp-tracking").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		idpTrackingAdmin.POST("/refresh/:reportId", c.IDPTrackingController.RefreshReadiness)
		idpTrackingAdmin.POST("/refresh-all", c.IDPTrackingController.RefreshAllReadiness)
	}

	// Competency Mappings Admin Mutations
	competencyMappingAdmin := c.App.Group("api/competency-mappings").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		competencyMappingAdmin.POST("", c.CompetencyMappingController.CreateMapping)
		competencyMappingAdmin.PUT("/:id", c.CompetencyMappingController.UpdateMapping)
		competencyMappingAdmin.DELETE("/:id", c.CompetencyMappingController.DeleteMapping)
	}

	// Mentoring Reports Admin Mutations
	mentoringReportsAdmin := c.App.Group("mentoring-reports").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		mentoringReportsAdmin.POST("", c.MentoringReportController.Create)
		mentoringReportsAdmin.PUT("", c.MentoringReportController.Update)
		mentoringReportsAdmin.DELETE("/:id", c.MentoringReportController.Delete)
	}

	// Coaching Reports Admin Mutations
	coachingReportsAdmin := c.App.Group("coaching-reports").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		coachingReportsAdmin.POST("", c.CoachingReportController.Create)
		coachingReportsAdmin.PUT("/:id", c.CoachingReportController.Update)
		coachingReportsAdmin.DELETE("/:id", c.CoachingReportController.Delete)
	}

	// Assessment Admin Mutations
	assessmentAdmin := c.App.Group("api/assessments").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		assessmentAdmin.POST("/assign", c.AssessmentController.AssignToType)
		assessmentAdmin.PUT("/:assessmentId", c.AssessmentController.UpdateAssessment)
		assessmentAdmin.PATCH("/:assessmentId/tutorial", c.AssessmentController.UpdateTutorial)
		assessmentAdmin.POST("", c.AssessmentController.CreateAssessment)
		assessmentAdmin.DELETE("/:assessmentId", c.AssessmentController.DeleteAssessment)
		assessmentAdmin.POST("/upload-image", c.AssessmentController.UploadAssessmentImage)
	}

	// Assessment Types Admin Mutations
	assessmentTypesAdmin := c.App.Group("api/assessment-types").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		assessmentTypesAdmin.POST("", c.AssessmentTypeController.Create)
		assessmentTypesAdmin.PUT("/:id", c.AssessmentTypeController.Update)
		assessmentTypesAdmin.DELETE("/:id", c.AssessmentTypeController.Delete)
	}

	// Seafarer Assessments Admin Mutations
	seafarerAssessmentsAdmin := c.App.Group("api/seafarer-assessments").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		seafarerAssessmentsAdmin.POST("", c.SeafarerAssessmentController.Assign)
		seafarerAssessmentsAdmin.PUT("/:id/status", c.SeafarerAssessmentController.UpdateStatus)
		seafarerAssessmentsAdmin.DELETE("/:id", c.SeafarerAssessmentController.Delete)
	}

	// Questions with Options Admin Mutations
	questionsWithOptionsAdmin := c.App.Group("api/questions-with-options").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		questionsWithOptionsAdmin.POST("", c.QuestionOptionController.CreateQuestionWithOptions)
		questionsWithOptionsAdmin.PUT("/:questionId", c.QuestionOptionController.UpdateQuestionWithOptions)
		questionsWithOptionsAdmin.DELETE("/:questionId", c.QuestionOptionController.DeleteQuestionWithOptions)
		questionsWithOptionsAdmin.DELETE("/bulk-delete", c.QuestionOptionController.BulkDelete)
	}

	// New Recruiters Admin Mutations
	newRecruitersAdmin := c.App.Group("api/new-recruiters").Use(c.AuthMiddleware, middlewares.AdminOnly())
	{
		newRecruitersAdmin.POST("", c.NewRecruiterController.Create)
		newRecruitersAdmin.PUT("/:id", c.NewRecruiterController.Update)
		newRecruitersAdmin.POST("/bulk-assign-batch", c.NewRecruiterController.BulkAssignBatch)
		newRecruitersAdmin.DELETE("/:id", c.NewRecruiterController.Delete)
		newRecruitersAdmin.POST("/assignments", c.NewRecruiterController.CreateAssignment)
		newRecruitersAdmin.DELETE("/assignments/:id", c.NewRecruiterController.DeleteAssignment)
	}
}

func (r *RouterConfig) SetupMasterRouter() {
	group := r.App.Group("/api/master-reports")
	{
		group.GET("", r.MasterController.FindAll)
		group.GET("/mentoring-programs", r.MasterController.GetMentoringPrograms)
		group.GET("/:id", r.MasterController.FindById)
	}

	adminGroup := r.App.Group("/api/master-reports").Use(r.AuthMiddleware, middlewares.AdminOnly())
	{
		adminGroup.POST("", r.MasterController.Create)
		adminGroup.PUT("/:id", r.MasterController.Update)
		adminGroup.DELETE("/:id", r.MasterController.Delete)
		adminGroup.POST("/bulk-assign-batch", r.MasterController.BulkAssignBatch)
	}
}

func (r *RouterConfig) SetupAssignmentRouter() {
	group := r.App.Group("/api/assignments")
	{
		group.GET("", r.AssignmentController.ListPaged)
	}

	adminGroup := r.App.Group("/api/assignments").Use(r.AuthMiddleware, middlewares.AdminOnly())
	{
		adminGroup.POST("", r.AssignmentController.Create)
		adminGroup.POST("/bulk", r.AssignmentController.BulkCreate)
		adminGroup.PUT("/:id", r.AssignmentController.Update)
		adminGroup.DELETE("/:id", r.AssignmentController.Delete)
	}
}

func (r *RouterConfig) SetupQuizRouter() {
	group := r.App.Group("/api/quiz")
	{
		group.GET("/history", r.QuizController.GetQuizHistory)
		group.GET("/history/:attemptId", r.QuizController.GetQuizAttempt)
		group.GET("/:assessmentTypeId", r.QuizController.GetQuizData)
		group.POST("/submit", r.QuizController.SubmitQuiz)
	}
}

func (r *RouterConfig) SetupScoringConfigRouter() {
	group := r.App.Group("/api/scoring-config")
	{
		group.GET("/:assessmentTypeId", r.ScoringConfigController.GetScoringConfig)
	}

	adminGroup := r.App.Group("/api/scoring-config").Use(r.AuthMiddleware, middlewares.AdminOnly())
	{
		adminGroup.PUT("/:assessmentTypeId", r.ScoringConfigController.UpdateScoringConfig)
		adminGroup.POST("/validate-formula", r.ScoringConfigController.ValidateFormula)
	}
}

func (r *RouterConfig) SetupBatchRouter() {
	group := r.App.Group("/api/batches")
	{
		group.GET("", r.BatchController.FindAll)
		group.GET("/:id", r.BatchController.FindByID)
		group.GET("/:id/snapshots", r.BatchController.GetSnapshots)
	}

	adminGroup := r.App.Group("/api/batches").Use(r.AuthMiddleware, middlewares.AdminOnly())
	{
		adminGroup.POST("", r.BatchController.Create)
		adminGroup.PUT("/:id", r.BatchController.Update)
	}
}

func (r *RouterConfig) SetupCVAnalysisRouter() {
	group := r.App.Group("/api/cv-analysis")
	{
		group.POST("/analyze", r.CVAnalysisController.AnalyzeCV)
		group.POST("/rank-candidates", r.CVAnalysisController.RankCandidates)
		group.POST("/recommend-roles", r.CVAnalysisController.RecommendRoles)
		group.POST("/unified-analysis", r.CVAnalysisController.AnalyzeUnifiedCVs)
	}
}

// SetupCandidateAnalysisRouter mendaftarkan endpoint Fitur 1 (Candidate Analysis).
func (r *RouterConfig) SetupCandidateAnalysisRouter() {
	group := r.App.Group("/api/candidate-analysis")
	{
		// POST /api/candidate-analysis — Analisis 1 CV terhadap seluruh role IT
		group.POST("", r.CandidateAnalysisController.Analyze)
		// POST /api/candidate-analysis/interview-questions — Generate interview questions on-demand
		group.POST("/interview-questions", r.CandidateAnalysisController.GenerateInterviewQuestions)
	}
}

// SetupPDFRouter mendaftarkan endpoint untuk ekstraksi teks dari PDF.
func (r *RouterConfig) SetupPDFRouter() {
	group := r.App.Group("/api/pdf")
	{
		group.POST("/extract", r.PDFController.ExtractText)
	}
}

// SetupRoleAnalysisRouter mendaftarkan endpoint Fitur 2 (Role Analysis).
func (r *RouterConfig) SetupRoleAnalysisRouter() {
	group := r.App.Group("/api/role-analysis")
	{
		// POST /api/role-analysis — Ranking banyak kandidat untuk 1 role
		group.POST("", r.RoleAnalysisController.Analyze)
	}
}

// SetupCVRoleRouter mendaftarkan endpoint untuk manajemen CV Roles (CRUD Roles & Descriptions)
func (r *RouterConfig) SetupCVRoleRouter() {
	publicGroup := r.App.Group("/api/cv-roles")
	{
		publicGroup.GET("", r.CVRoleController.GetAll)
		publicGroup.GET("/:id", r.CVRoleController.GetByID)
	}

	adminGroup := r.App.Group("/api/cv-roles").Use(r.AuthMiddleware, middlewares.AdminOnly())
	{
		adminGroup.POST("", r.CVRoleController.Create)
		adminGroup.PUT("/:id", r.CVRoleController.Update)
		adminGroup.DELETE("/:id", r.CVRoleController.Delete)
	}
}
