package web

import "time"

type SeafarerAssessmentData struct {
	ID               uint64     `json:"id"`
	SeafarerCode     string     `json:"seafarerCode"`
	AssessmentTypeID uint64     `json:"assessmentTypeId"`
	AssignedAt       *time.Time `json:"assignedAt"`
	Status           string     `json:"status"`
	AttemptsCount    uint64     `json:"attemptsCount"`
}
