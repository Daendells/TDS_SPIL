package web

import "time"

type AssignRequest struct {
	UserID       int64     `json:"user_id" validate:"required"`
	AssessmentID uint64    `json:"assessment_id" validate:"required"`
	StartDate    time.Time `json:"start_date" validate:"required"`
	EndDate      time.Time `json:"end_date" validate:"required"`
	Note         *string   `json:"note"`
	Status       string    `json:"status" validate:"required"`
}

type AssignMultiRequest struct {
	UserIDs      []int64   `json:"user_ids" validate:"required,min=1,dive,required"`
	AssessmentID uint64    `json:"assessment_id" validate:"required"`
	StartDate    time.Time `json:"start_date" validate:"required"`
	EndDate      time.Time `json:"end_date" validate:"required"`
	Status       string    `json:"status"`
	Note         *string   `json:"note"` // ubah jadi pointer
}
