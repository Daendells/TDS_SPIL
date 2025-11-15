package web

type AssignmentData struct {
	ID               uint64 `json:"id"`
	SeafarerCode     string `json:"seafarerCode"`
	Nama             string `json:"nama"`
	AssessmentTypeID uint64 `json:"assessmentTypeId"`
	AssessmentType   string `json:"assessmentType"` // ← nama dari assessment_types
	Attempts         int    `json:"attempts"`
	Status           string `json:"status"`
}

type AssignmentCreateRequest struct {
	SeafarerCode     string `json:"seafarerCode" validate:"required"`
	AssessmentTypeID uint64 `json:"assessmentTypeId" validate:"required"`
	CreatedBy        string `json:"createdBy" validate:"required"`
}

type AssignmentUpdateRequest struct {
	ID               uint64 `json:"id" validate:"required"`
	AssessmentTypeID uint64 `json:"assessmentTypeId" validate:"required"`
	Status           string `json:"status" validate:"omitempty,oneof=ASSIGNED IN_PROGRESS COMPLETED assigned in_progress completed"`
}

type BulkAssignmentRequest struct {
	Assignments []AssignmentCreateRequest `json:"assignments" validate:"required,min=1,dive"`
}
