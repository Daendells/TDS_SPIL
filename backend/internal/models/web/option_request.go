package web

type OptionCreateRequest struct {
	QuestionID      int     `json:"questionId" validate:"required"`
	OptionLetter    string  `json:"optionLetter" validate:"required,len=1"`
	OptionText      string  `json:"optionText" validate:"required"`
	Score           int     `json:"score"`
	ScorePercentage float64 `json:"scorePercentage"` // Moodle-style: +100 for correct, negative for wrong
	IsImage         int     `json:"isImage"`
	ImageURL        string  `json:"imageUrl"`
}

type OptionUpdateRequest struct {
	OptionID        int     `json:"optionId" validate:"required"`
	QuestionID      int     `json:"questionId" validate:"required"`
	OptionLetter    string  `json:"optionLetter" validate:"required,len=1"`
	OptionText      string  `json:"optionText" validate:"required"`
	Score           int     `json:"score"`
	ScorePercentage float64 `json:"scorePercentage"`
	IsImage         int     `json:"isImage"`
	ImageURL        string  `json:"imageUrl"`
}
