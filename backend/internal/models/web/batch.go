package web

import "time"

type CreateBatchRequest struct {
	StartDate time.Time `json:"startDate" validate:"required"`
	EndDate   time.Time `json:"endDate" validate:"required,gtfield=StartDate"`
}

type UpdateBatchRequest struct {
	StartDate time.Time `json:"startDate" validate:"required"`
	EndDate   time.Time `json:"endDate" validate:"required,gtfield=StartDate"`
}

type BatchResponse struct {
	ID          int        `json:"id"`
	BatchNo     int        `json:"batchNo"`
	StartDate   time.Time  `json:"startDate"`
	EndDate     time.Time  `json:"endDate"`
	Status      string     `json:"status"`
	SnapshotAt  *time.Time `json:"snapshotAt,omitempty"`
	ReportCount int        `json:"reportCount"`
}
