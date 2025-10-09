package web

type QuestionCreateRequest struct {
	Role         string `json:"role" validate:"required"`
	QuestionText string `json:"question_text" validate:"required"`
}

type QuestionUpdateRequest struct {
	QuestionID   int    `json:"question_id" validate:"required"`
	Role         string `json:"role" validate:"required"`
	QuestionText string `json:"question_text" validate:"required"`
}