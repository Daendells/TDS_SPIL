package domain

import "time"

type NewRecruiterAssessmentSubmission struct {
	ID                       uint64     `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	NewRecruiterID           uint64     `json:"newRecruiterId" gorm:"column:new_recruiter_id;not null;index"`
	NewRecruiterAssignmentID uint64     `json:"newRecruiterAssignmentId" gorm:"column:new_recruiter_assignment_id;not null;index"`
	AssessmentID             uint64     `json:"assessmentId" gorm:"column:assessment_id;not null;index"`
	AssessmentTypeID         uint64     `json:"assessmentTypeId" gorm:"column:assessment_type_id;not null;index"`
	Role                     string     `json:"role" gorm:"column:role;type:varchar(100);not null"`
	AnswersJSON              string     `json:"answersJson" gorm:"column:answers_json;type:json;not null"`
	SubmittedAt              time.Time  `json:"submittedAt" gorm:"column:submitted_at;autoCreateTime"`
	CreatedAt                time.Time  `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt                time.Time  `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
	CompletedAt              *time.Time `json:"completedAt,omitempty" gorm:"column:completed_at"`
}

func (NewRecruiterAssessmentSubmission) TableName() string {
	return "new_recruiter_assessment_submissions"
}
