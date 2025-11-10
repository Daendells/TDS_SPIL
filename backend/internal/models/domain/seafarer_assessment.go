package domain

import "time"

type SeafarerAssessment struct {
	ID               uint64     `gorm:"column:id;primaryKey" json:"id"`
	SeafarerCode     string     `gorm:"column:seafarer_code;size:50;not null;index" json:"seafarerCode"`
	AssessmentTypeID uint64     `gorm:"column:assessment_type_id;not null;index" json:"assessmentTypeId"`
	AssignedAt       *time.Time `gorm:"column:assigned_at;default:CURRENT_TIMESTAMP" json:"assignedAt"`
	Status           string     `gorm:"column:status;type:enum('assigned','in_progress','completed');default:'assigned'" json:"status"`
	AttemptsCount    uint64     `gorm:"column:attempts_count;not null;default:0" json:"attemptsCount"`
}

func (SeafarerAssessment) TableName() string {
	return "seafarer_assessments"
}
