package web

type AssessmentSubmitRequest struct {
	SeafarerCode string      `json:"seafarerCode" validate:"required"`
	Role         string      `json:"role" validate:"required,oneof=va_1 va_2 va_3"`
	Answers      map[int]int `json:"answers" validate:"required"`
}

type AssessmentAnswer struct {
	QuestionID int `json:"questionId" validate:"required"`
	OptionID   int `json:"optionId" validate:"required"`
}