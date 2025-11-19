package web

type AspectCreateRequest struct {
	Name         string `json:"name" binding:"required"`
	Weight       int    `json:"weight" binding:"required,min=1,max=100"`
	AssessmentID int    `json:"assessmentId" binding:"required"`
	QuestionID   *int   `json:"questionId"`
}

type AspectUpdateRequest struct {
	Name         string `json:"name"`
	Weight       int    `json:"weight" binding:"min=0,max=100"`
	AssessmentID int    `json:"assessmentId"`
	QuestionID   *int   `json:"questionId"`
}
