package web

type QuestionWithOptionsRequest struct {
	Role string `form:"role" binding:"required"`
}

type CreateQuestionWithOptionsRequest struct {
	Role         string                `json:"role" binding:"required"`
	AssessmentID uint64                `json:"assessmentId" binding:"required"`
	QuestionText string                `json:"questionText" binding:"required"`
	Category     string                `json:"category"`
	IsImage      string                `json:"isImage"`
	ImageUrl     string                `json:"imageUrl"`
	Options      []CreateOptionRequest `json:"options" binding:"required,min=1"`
}

type CreateOptionRequest struct {
	OptionLetter string `json:"optionLetter" binding:"required"`
	OptionText   string `json:"optionText" binding:"required"`
	Score        int    `json:"score" binding:"required"`
	IsImage      int    `json:"isImage"`
	ImageURL     string `json:"imageUrl"`
}

