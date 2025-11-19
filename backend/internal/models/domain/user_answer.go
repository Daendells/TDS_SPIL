package domain

import "time"

type UserAnswer struct {
	ID           int       `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	SeamanCode   string    `json:"seamanCode" gorm:"column:seaman_code;size:50;not null"`
	QuestionID   int       `json:"questionId" gorm:"column:question_id;not null"`
	OptionLetter string    `json:"optionLetter" gorm:"column:option_letter;size:1;not null"`
	ScoreEarned  int       `json:"scoreEarned" gorm:"column:score_earned;not null"`
	AnsweredAt   time.Time `json:"answeredAt" gorm:"column:answered_at;autoCreateTime"`

	// Relations
	Question *Question `json:"question,omitempty" gorm:"foreignKey:QuestionID;references:QuestionID"`
}

func (UserAnswer) TableName() string {
	return "user_answers"
}
