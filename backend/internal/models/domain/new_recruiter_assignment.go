package domain

import "time"

type NewRecruiterAssignment struct {
	ID               uint64          `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	NewRecruiterID   uint64          `json:"newRecruiterId" gorm:"column:new_recruiter_id;not null;index;uniqueIndex:idx_new_recruiter_assignment"`
	AssessmentTypeID uint64          `json:"assessmentTypeId" gorm:"column:assessment_type_id;not null;index;uniqueIndex:idx_new_recruiter_assignment"`
	BatchID          *uint64         `json:"batchId,omitempty" gorm:"column:batch_id;index"`
	Token            string          `json:"token" gorm:"column:token;type:varchar(120);not null;uniqueIndex"`
	Status           string          `json:"status" gorm:"column:status;type:enum('assigned','in_progress','completed');default:'assigned'"`
	AttemptsCount    uint64          `json:"attemptsCount" gorm:"column:attempts_count;not null;default:0"`
	AssignedAt       time.Time       `json:"assignedAt" gorm:"column:assigned_at;autoCreateTime"`
	CompletedAt      *time.Time      `json:"completedAt,omitempty" gorm:"column:completed_at"`
	CreatedAt        time.Time       `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time       `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
	NewRecruiter     *NewRecruiter   `json:"newRecruiter,omitempty" gorm:"foreignKey:NewRecruiterID;references:ID"`
	AssessmentType   *AssessmentType `json:"assessmentType,omitempty" gorm:"foreignKey:AssessmentTypeID;references:ID"`
	Batch            *Batch          `json:"batch,omitempty" gorm:"foreignKey:BatchID;references:ID"`
}

func (NewRecruiterAssignment) TableName() string {
	return "new_recruiter_assignments"
}
