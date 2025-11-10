package web

import "time"

type AssessmentTypeStatusResponse struct {
	ID                   uint64     `json:"id"`
	AssessmentTypeName   string     `json:"assessmentTypeName"`
	StartTime            *time.Time `json:"startTime"`
	EndTime              *time.Time `json:"endTime"`
	MaxAttempts          *int       `json:"maxAttempts"`
	IsOpen               bool       `json:"isOpen"`
	OpenMessage          string     `json:"openMessage"`
	StartTimeFormatted   string     `json:"startTimeFormatted"`
	EndTimeFormatted     string     `json:"endTimeFormatted"`
}
