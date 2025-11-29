package web

type QuestionWithOptionsData struct {
	QuestionId   int          `json:"questionId"`
	Role         string       `json:"role"`
	QuestionText string       `json:"questionText"`
	Category     string       `json:"category"`
	IsImage      string       `json:"isImage"`
	ImageUrl     string       `json:"imageUrl"`
	Options      []OptionData `json:"options"`
}

type QuestionWithOptionsListResponse struct {
	Data []QuestionWithOptionsData `json:"data"`
}

type UpdateQuestionWithOptionsRequest struct {
	Role         string                   `json:"role"`
	AssessmentID uint64                   `json:"assessmentId" validate:"required"`
	QuestionText string                   `json:"questionText" validate:"required"`
	Category     *string                  `json:"category"`
	IsImage      *string                  `json:"isImage"`
	ImageURL     *string                  `json:"imageUrl"`
	AspectID     *int                     `json:"aspectId"`
	Options      []OptionOperationRequest `json:"options" validate:"required,min=1"`
}

type OptionOperationRequest struct {
	OptionID     *int   `json:"optionId"` // nil = create new, non-nil = update existing
	OptionLetter string `json:"optionLetter" validate:"required"`
	OptionText   string `json:"optionText" validate:"required"`
	Score        int    `json:"score"`
	IsImage      *int   `json:"isImage"`
	ImageURL     *string `json:"imageUrl"`
	Action       string `json:"action"` // "create", "update", "delete"
}
