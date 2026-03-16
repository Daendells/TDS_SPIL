package domain

import "time"

type NewRecruiterQuizAttempt struct {
	ID                       uint64    `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	NewRecruiterID           uint64    `json:"newRecruiterId" gorm:"column:new_recruiter_id;not null;index"`
	NewRecruiterAssignmentID uint64    `json:"newRecruiterAssignmentId" gorm:"column:new_recruiter_assignment_id;not null;index"`
	AssessmentTypeID         uint64    `json:"assessmentTypeId" gorm:"column:assessment_type_id;not null;index"`
	AnswersJSON              string    `json:"answersJson" gorm:"column:answers_json;type:json;not null"`
	TotalScore               float64   `json:"totalScore" gorm:"column:total_score;default:0"`
	MaxScore                 float64   `json:"maxScore" gorm:"column:max_score;default:0"`
	CompletedAt              time.Time `json:"completedAt" gorm:"column:completed_at;autoCreateTime"`
	CreatedAt                time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt                time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

func (NewRecruiterQuizAttempt) TableName() string {
	return "new_recruiter_quiz_attempts"
}
