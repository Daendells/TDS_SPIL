package web

type QuestionCreateRequest struct {
	Role              string  `json:"role" validate:"required"`
	AssessmentID      uint64  `json:"assessmentId" validate:"required"`
	QuestionText      string  `json:"questionText" validate:"required"`
	Category          *string `json:"category"`
	IsImage           *string `json:"isImage"`
	ImageURL          *string `json:"imageUrl"`
	AspectID          *int64  `json:"aspectId"`
	QuestionType      string  `json:"questionType"`      // single_choice, multiple_choice, match_choice, short_answer
	AcceptableAnswers *string `json:"acceptableAnswers"` // JSON array for short_answer type
}

type QuestionUpdateRequest struct {
	QuestionID        int     `json:"questionId" validate:"required"`
	Role              string  `json:"role" validate:"required"`
	AssessmentID      uint64  `json:"assessmentId" validate:"required"`
	QuestionText      string  `json:"questionText" validate:"required"`
	Category          *string `json:"category"`
	IsImage           *string `json:"isImage"`
	ImageURL          *string `json:"imageUrl"`
	AspectID          *int64  `json:"aspectId"`
	QuestionType      string  `json:"questionType"`
	AcceptableAnswers *string `json:"acceptableAnswers"`
}

type QuestionUpdateAspectRequest struct {
	AspectID *int64 `json:"aspectId"`
}

type QuestionBulkUpdateAspectRequest struct {
	QuestionIds []int  `json:"questionIds" binding:"required"`
	AspectID    *int64 `json:"aspectId"`
}
