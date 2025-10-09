package domain

type Option struct {
	OptionID     int    `json:"optionId" gorm:"column:option_id;primaryKey"`
	QuestionID   int    `json:"questionId" gorm:"column:question_id"`
	OptionLetter string `json:"optionLetter" gorm:"column:option_letter"`
	OptionText   string `json:"optionText" gorm:"column:option_text"`
	Score        int    `json:"score" gorm:"column:score;default:0"`
	IsImage      int    `json:"isImage" gorm:"column:is_image;default:0"`
}

// TableName specifies the table name for GORM
func (Option) TableName() string {
	return "options"
}