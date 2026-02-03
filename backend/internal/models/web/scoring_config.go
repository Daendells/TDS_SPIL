package web

type UpdateScoringConfigRequest struct {
	AssessmentTypeID uint64  `json:"assessmentTypeId" validate:"required"`
	ScoringType      string  `json:"scoringType" validate:"required,oneof=default custom"`
	ScoringFormula   *string `json:"scoringFormula"`
	UsePercentage    *bool   `json:"usePercentage"`
}

type ScoringConfigResponse struct {
	AssessmentTypeID   uint64  `json:"assessmentTypeId"`
	AssessmentTypeName string  `json:"assessmentTypeName"`
	ScoringType        string  `json:"scoringType"`
	ScoringFormula     *string `json:"scoringFormula"`
	UsePercentage      bool    `json:"usePercentage"`
}

type FormulaValidationRequest struct {
	Formula      string  `json:"formula" validate:"required"`
	TestScore    float64 `json:"testScore"`
	TestMaxScore float64 `json:"testMaxScore"`
}

type FormulaValidationResponse struct {
	IsValid bool     `json:"isValid"`
	Result  *float64 `json:"result,omitempty"`
	Error   *string  `json:"error,omitempty"`
}