package domain

import "time"

type UserAnswer struct {
	ID              int       `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	SeamanCode      string    `json:"seamanCode" gorm:"column:seaman_code;size:50;not null"`
	QuestionID      int       `json:"questionId" gorm:"column:question_id;not null"`
	AttemptID       *int      `json:"attemptId" gorm:"column:attempt_id"`
	SelectedOptions *string   `json:"selectedOptions" gorm:"column:selected_options;type:json"` // JSON array of option IDs for single/multiple/match choice
	TextAnswer      *string   `json:"textAnswer" gorm:"column:text_answer;type:text"`           // For short_answer type
	ScoreEarned     float64   `json:"scoreEarned" gorm:"column:score_earned;not null;default:0"`
	IsCorrect       bool      `json:"isCorrect" gorm:"column:is_correct;default:false"`
	AnsweredAt      time.Time `json:"answeredAt" gorm:"column:answered_at;autoCreateTime"`

	// Relations
	Question *Question `json:"question,omitempty" gorm:"foreignKey:QuestionID;references:QuestionID"`
}

func (UserAnswer) TableName() string {
	return "user_answers"
}
