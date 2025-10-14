package web

type QuestionCreateRequest struct {
	Role         string  `json:"role" validate:"required"`
	QuestionText string  `json:"questionText" validate:"required"`
	Category     *string `json:"category"`
	IsImage      *string `json:"isImage"`
	ImageURL     *string `json:"imageUrl"`
}

type QuestionUpdateRequest struct {
	QuestionID   int     `json:"questionId" validate:"required"`
	Role         string  `json:"role" validate:"required"`
	QuestionText string  `json:"questionText" validate:"required"`
	Category     *string `json:"category"`
	IsImage      *string `json:"isImage"`
	ImageURL     *string `json:"imageUrl"`
}
