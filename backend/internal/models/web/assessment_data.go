package web

type AssessmentData struct {
	AssessmentID      uint64  `json:"assessmentId"`
	Role              string  `json:"role"`
	UsingTimer        bool    `json:"usingTimer"`
	TimerLimitMinutes *uint64 `json:"timerLimitMinutes"`
}

type AssessmentResponse struct {
	AssessmentID      uint64                   `json:"assessmentId"`
	Role              string                   `json:"role"`
	UsingTimer        bool                     `json:"usingTimer"`
	TimerLimitMinutes *uint64                  `json:"timerLimitMinutes"`
	Questions         []QuestionOptionResponse `json:"questions"`
}

type QuestionOptionResponse struct {
	QuestionId   int          `json:"questionId"`
	QuestionText string       `json:"questionText"`
	Category     string       `json:"category"`
	IsImage      string       `json:"isImage"`
	ImageUrl     string       `json:"imageUrl"`
	Options      []OptionData `json:"options"`
}
