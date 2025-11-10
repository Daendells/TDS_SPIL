package web

type AssignmentCheckResponse struct {
	IsAssigned       bool        `json:"isAssigned"`
	Message          string      `json:"message"`
	SeafarerCode     string      `json:"seafarerCode"`
	AssessmentTypeID uint64      `json:"assessmentTypeId"`
	PersonalData     *ReportData `json:"personalData,omitempty"`
	AttemptsCount    uint64      `json:"attemptsCount"`
	MaxAttempts      *int        `json:"maxAttempts"`
}
