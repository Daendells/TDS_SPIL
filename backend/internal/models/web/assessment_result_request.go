package web

type AssessmentSubmitRequest struct {
	SeafarerCode string      `json:"seafarerCode" validate:"required"`
	Role         string      `json:"role" validate:"required"`
	Answers      map[int]int `json:"answers" validate:"required"`
}

type AssessmentAnswer struct {
	QuestionID int `json:"questionId" validate:"required"`
	OptionID   int `json:"optionId" validate:"required"`
}