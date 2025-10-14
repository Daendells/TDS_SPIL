package web

type OptionCreateRequest struct {
	QuestionID   int    `json:"questionId" validate:"required"`
	OptionLetter string `json:"optionLetter" validate:"required,len=1"`
	OptionText   string `json:"optionText" validate:"required"`
	Score        int    `json:"score"`
	IsImage      int    `json:"isImage"`
}

type OptionUpdateRequest struct {
	OptionID     int    `json:"optionId" validate:"required"`
	QuestionID   int    `json:"questionId" validate:"required"`
	OptionLetter string `json:"optionLetter" validate:"required,len=1"`
	OptionText   string `json:"optionText" validate:"required"`
	Score        int    `json:"score"`
	IsImage      int    `json:"isImage"`
}