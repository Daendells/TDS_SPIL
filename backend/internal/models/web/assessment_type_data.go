package web

import "time"

type AssessmentTypeData struct {
	ID                 uint64     `json:"id"`
	AssessmentTypeName string     `json:"assessmentTypeName"`
	StartTime          *time.Time `json:"startTime"`
	EndTime            *time.Time `json:"endTime"`
	MaxAttempts        *int       `json:"maxAttempts"`
}
