package web

import "time"

type CreateBatchRequest struct {
	Type      string    `json:"type" validate:"required,oneof=crew new_recruiter"`
	BatchName string    `json:"batchName" validate:"required"`
	StartDate time.Time `json:"startDate" validate:"required"`
	EndDate   time.Time `json:"endDate" validate:"required,gtfield=StartDate"`
}

type UpdateBatchRequest struct {
	Type      string    `json:"type" validate:"required,oneof=crew new_recruiter"`
	BatchName string    `json:"batchName" validate:"required"`
	StartDate time.Time `json:"startDate" validate:"required"`
	EndDate   time.Time `json:"endDate" validate:"required,gtfield=StartDate"`
}

type BatchResponse struct {
	ID          int        `json:"id"`
	BatchNo     int        `json:"batchNo"`
	BatchName   string     `json:"batchName"`
	Type        string     `json:"type"`
	StartDate   time.Time  `json:"startDate"`
	EndDate     time.Time  `json:"endDate"`
	Status      string     `json:"status"`
	SnapshotAt  *time.Time `json:"snapshotAt,omitempty"`
	ReportCount int        `json:"reportCount"`
}
