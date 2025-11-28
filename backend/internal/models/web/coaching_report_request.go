package web

type CoachingReportRequest struct {
	CoachName       string   `json:"coachName" binding:"required"`
	Period          string   `json:"period" binding:"required"`
	CoacheeNames    []string `json:"coacheeNames" binding:"required"`
	Department      string   `json:"department" binding:"required"`
	Program         string   `json:"program" binding:"required"`
	ProgramTitle    string   `json:"programTitle" binding:"required"`
	SessionNumber   int      `json:"sessionNumber" binding:"required,min=1"`
	Date            string   `json:"date" binding:"required"`
	Duration        int      `json:"duration" binding:"required,min=1"`
	Purpose         string   `json:"purpose" binding:"required"`
	Observation     string   `json:"observation" binding:"required"`
	Reflection      string   `json:"reflection" binding:"required"`
	ActionPlan      string   `json:"actionPlan" binding:"required"`
	AdditionalNotes string   `json:"additionalNotes"`
	ReportIDs       []int64  `json:"reportIds" binding:"required,min=1"`
}

type CoachingReportData struct {
	ID              int64    `json:"id"`
	CoachName       string   `json:"coachName"`
	Period          string   `json:"period"`
	CoacheeNames    []string `json:"coacheeNames"`
	Department      string   `json:"department"`
	Program         string   `json:"program"`
	ProgramTitle    string   `json:"programTitle"`
	SessionNumber   string   `json:"sessionNumber"`
	Date            string   `json:"date"`
	Duration        string   `json:"duration"`
	Purpose         string   `json:"purpose"`
	Observation     string   `json:"observation"`
	Reflection      string   `json:"reflection"`
	ActionPlan      string   `json:"actionPlan"`
	AdditionalNotes string   `json:"additionalNotes"`
	ReportIDs       []int    `json:"reportIds"`
	CreatedAt       string   `json:"createdAt"`
	UpdatedAt       string   `json:"updatedAt"`
}

type CoachingReportListResponse struct {
	Data []CoachingReportData `json:"data"`
}
