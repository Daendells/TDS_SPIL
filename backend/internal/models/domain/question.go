package domain

type Question struct {
	QuestionID   int    `json:"questionId" gorm:"column:question_id;primaryKey"`
	Role         string `json:"role" gorm:"column:role"`
	QuestionText string `json:"questionText" gorm:"column:question_text"`
}

// TableName specifies the table name for GORM
func (Question) TableName() string {
	return "questions"
}