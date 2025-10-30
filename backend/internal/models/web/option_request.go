package web

type OptionCreateRequest struct {
	QuestionID   int    `json:"questionId" validate:"required"`
	OptionLetter string `json:"optionLetter" validate:"required,len=1"`
	OptionText   string `json:"optionText" validate:"required"`
	Score        int    `json:"score"`
	IsImage      int    `json:"isImage"`
	ImageURL     string `json:"imageUrl"`
}

type OptionUpdateRequest struct {
	OptionID     int    `json:"optionId" validate:"required"`
	QuestionID   int    `json:"questionId" validate:"required"`
	OptionLetter string `json:"optionLetter" validate:"required,len=1"`
	OptionText   string `json:"optionText" validate:"required"`
	Score        int    `json:"score"`
	IsImage      int    `json:"isImage"`
	ImageURL     string `json:"imageUrl"`
}