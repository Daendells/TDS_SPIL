package domain

type Question struct {
	QuestionID   int     `json:"questionId" gorm:"column:question_id;primaryKey"`
	Role         string  `json:"role" gorm:"column:role"`
	QuestionText string  `json:"questionText" gorm:"column:question_text"`
	Category     *string `json:"category" gorm:"column:category"`
	IsImage      *string `json:"isImage" gorm:"column:is_image"`
	ImageURL     *string `json:"imageUrl" gorm:"column:image_url"`
}

func (Question) TableName() string {
	return "questions"
}
