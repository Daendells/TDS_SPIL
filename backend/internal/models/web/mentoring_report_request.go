package web

type MentoringReportRequest struct {
	MentorName      string   `json:"mentorName" binding:"required"`
	Period          string   `json:"period" binding:"required"`
	MenteeNames     []string `json:"menteeNames" binding:"required"` // Array of mentee names
	Department      string   `json:"department" binding:"required"`
	Program         string   `json:"program" binding:"required"`
	SessionNumber   string   `json:"sessionNumber" binding:"required"`
	Date            string   `json:"date" binding:"required"`
	Duration        string   `json:"duration" binding:"required"`
	Purpose         string   `json:"purpose" binding:"required"`
	Observation     string   `json:"observation"`
	Reflection      string   `json:"reflection"`
	ActionPlan      string   `json:"actionPlan"`
	AdditionalNotes string   `json:"additionalNotes"`
	ReportIDs       []int    `json:"reportIds" binding:"required"` // Array of report IDs
}

type MentoringReportUpdateRequest struct {
	ID              int64    `json:"id" binding:"required"`
	MentorName      string   `json:"mentorName" binding:"required"`
	Period          string   `json:"period" binding:"required"`
	MenteeNames     []string `json:"menteeNames" binding:"required"` // Array of mentee names
	Department      string   `json:"department" binding:"required"`
	Program         string   `json:"program" binding:"required"`
	SessionNumber   string   `json:"sessionNumber" binding:"required"`
	Date            string   `json:"date" binding:"required"`
	Duration        string   `json:"duration" binding:"required"`
	Purpose         string   `json:"purpose" binding:"required"`
	Observation     string   `json:"observation"`
	Reflection      string   `json:"reflection"`
	ActionPlan      string   `json:"actionPlan"`
	AdditionalNotes string   `json:"additionalNotes"`
	ReportIDs       []int    `json:"reportIds" binding:"required"`
}
