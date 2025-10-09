package web

type QuestionData struct {
	QuestionID   int    `json:"questionId"`
	Role         string `json:"role"`
	QuestionText string `json:"questionText"`
}