package web

type SeafarerAssessmentCreateRequest struct {
	SeafarerCode     string `json:"seafarerCode" validate:"required,min=3"`
	AssessmentTypeID uint64 `json:"assessmentTypeId" validate:"required"`
}

type SeafarerAssessmentUpdateStatusRequest struct {
	ID     uint64 `json:"id" validate:"required"`
	Status string `json:"status" validate:"required"`
}
