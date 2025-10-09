package web

type OptionCreateRequest struct {
	QuestionID   int    `json:"question_id" validate:"required"`
	OptionLetter string `json:"option_letter" validate:"required,len=1"`
	OptionText   string `json:"option_text" validate:"required"`
	Score        int    `json:"score"`
	IsImage      int    `json:"is_image"`
}

type OptionUpdateRequest struct {
	OptionID     int    `json:"option_id" validate:"required"`
	QuestionID   int    `json:"question_id" validate:"required"`
	OptionLetter string `json:"option_letter" validate:"required,len=1"`
	OptionText   string `json:"option_text" validate:"required"`
	Score        int    `json:"score"`
	IsImage      int    `json:"is_image"`
}