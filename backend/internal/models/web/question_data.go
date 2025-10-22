package web

type QuestionData struct {
	QuestionID   int     `json:"questionId"`
	Role         string  `json:"role"`
	AssessmentID *uint64 `json:"assessmentId"`
	QuestionText string  `json:"questionText"`
	Category     *string `json:"category"`
	IsImage      *string `json:"isImage"`
	ImageURL     *string `json:"imageUrl"`
}
