package web

type QuestionCreateRequest struct {
	Role         string  `json:"role" validate:"required"`
	QuestionText string  `json:"question_text" validate:"required"`
	Category     *string `json:"category"`
	IsImage      *string `json:"is_image"`
	ImageURL     *string `json:"image_url"`
}

type QuestionUpdateRequest struct {
	QuestionID   int     `json:"question_id" validate:"required"`
	Role         string  `json:"role" validate:"required"`
	QuestionText string  `json:"question_text" validate:"required"`
	Category     *string `json:"category"`
	IsImage      *string `json:"is_image"`
	ImageURL     *string `json:"image_url"`
}
