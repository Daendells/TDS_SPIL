package web

type AssessmentData struct {
	AssessmentID      uint64  `json:"assessmentId"`
	Role              string  `json:"role"`
	AssessmentName    string  `json:"assessmentName"`
	UsingTimer        bool    `json:"usingTimer"`
	TimerLimitMinutes *uint64 `json:"timerLimitMinutes"`
}

type AssessmentResponse struct {
	AssessmentID      uint64                   `json:"assessmentId"`
	Role              string                   `json:"role"`
	AssessmentName    string                   `json:"assessmentName"`
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
	AspectId     *int64       `json:"aspectId"`
	Options      []OptionData `json:"options"`
}

// Public response untuk assessment public (tanpa questionId)
type QuestionOptionPublicResponse struct {
	QuestionId   int                    `json:"questionId"`
	QuestionText string                 `json:"questionText"`
	Category     string                 `json:"category"`
	IsImage      string                 `json:"isImage"`
	ImageUrl     string                 `json:"imageUrl"`
	Options      []OptionPublicResponse `json:"options"`
}

type AssessmentPublicResponse struct {
	AssessmentID      uint64                         `json:"assessmentId"`
	Role              string                         `json:"role"`
	UsingTimer        bool                           `json:"usingTimer"`
	TimerLimitMinutes *uint64                        `json:"timerLimitMinutes"`
	Questions         []QuestionOptionPublicResponse `json:"questions"`
}
