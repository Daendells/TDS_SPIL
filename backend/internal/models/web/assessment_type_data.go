package web

import "time"

type AssessmentTypeData struct {
	ID                 uint64     `json:"id"`
	AssessmentTypeName string     `json:"assessmentTypeName"`
	StartTime          *time.Time `json:"startTime"`
	EndTime            *time.Time `json:"endTime"`
	MaxAttempts        *int       `json:"maxAttempts"`
	AssignedAssessments []string `json:"assignedAssessments"`
	
	// Scoring Configuration
	ScoringType    string  `json:"scoringType"`    // 'default' or 'custom'
	ScoringFormula *string `json:"scoringFormula"` // Formula untuk custom scoring
	UsePercentage  bool    `json:"usePercentage"`  // Output sebagai persentase
}