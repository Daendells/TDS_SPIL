package web

import "time"

type CreateBatchRequest struct {
	StartDate time.Time `json:"startDate" validate:"required"`
	EndDate   time.Time `json:"endDate" validate:"required,gtfield=StartDate"`
}

type BatchResponse struct {
	ID        int       `json:"id"`
	BatchNo   int       `json:"batchNo"`
	StartDate time.Time `json:"startDate"`
	EndDate   time.Time `json:"endDate"`
}
