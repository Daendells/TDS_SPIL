package domain

import "time"

type QuizAttempt struct {
	ID               int       `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	SeamanCode       string    `json:"seamanCode" gorm:"column:seaman_code;size:50;not null"`
	AssessmentTypeID uint64    `json:"assessmentTypeId" gorm:"column:assessment_type_id;not null"`
	TotalScore       float64   `json:"totalScore" gorm:"column:total_score;default:0"`
	MaxScore         float64   `json:"maxScore" gorm:"column:max_score;default:0"`
	CompletedAt      time.Time `json:"completedAt" gorm:"column:completed_at;autoCreateTime"`

	// Relations
	AssessmentType *AssessmentType `json:"assessmentType,omitempty" gorm:"foreignKey:AssessmentTypeID;references:ID"`
	Answers        []UserAnswer    `json:"answers,omitempty" gorm:"foreignKey:AttemptID;references:ID"`
}

func (QuizAttempt) TableName() string {
	return "quiz_attempts"
}
