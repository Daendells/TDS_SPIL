package web

type AssessmentUpdateRequest struct {
	AssessmentID uint64 `json:"assessmentId" validate:"required"`
	Role         string `json:"role" validate:"required"`
	UsingTimer   bool   `json:"usingTimer"`
	// TimerLimitMinutes can be null if UsingTimer is false
	TimerLimitMinutes *uint64 `json:"timerLimitMinutes"`
}

type AssessmentDataRequest struct {
	Role       string `json:"role" validate:"required"`
	UsingTimer bool   `json:"usingTimer"`
	// TimerLimitMinutes can be null if UsingTimer is false
	TimerLimitMinutes *uint64 `json:"timerLimitMinutes"`
}