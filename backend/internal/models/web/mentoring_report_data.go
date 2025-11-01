package web

type MentoringReportData struct {
	ID              int64    `json:"id"`
	MentorName      string   `json:"mentorName"`
	Period          string   `json:"period"`
	MenteeNames     []string `json:"menteeNames"` // Array of mentee names
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

type MentoringReportListResponse struct {
	Data []MentoringReportData `json:"data"`
}
