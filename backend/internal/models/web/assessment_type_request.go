package web

import "time"

type AssessmentTypeCreateRequest struct {
	AssessmentTypeName string     `json:"assessmentTypeName" validate:"required,min=3"`
	StartTime          *time.Time `json:"startTime"`
	EndTime            *time.Time `json:"endTime"`
	MaxAttempts        *int       `json:"maxAttempts"`
}

type AssessmentTypeUpdateRequest struct {
	ID                 uint64     `json:"id" validate:"required"`
	AssessmentTypeName string     `json:"assessmentTypeName" validate:"required,min=3"`
	StartTime          *time.Time `json:"startTime"`
	EndTime            *time.Time `json:"endTime"`
	MaxAttempts        *int       `json:"maxAttempts"`
}
