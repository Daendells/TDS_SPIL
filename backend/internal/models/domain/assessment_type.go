package domain

import "time"

type AssessmentType struct {
	ID                   uint64     `gorm:"column:id;primaryKey" json:"id"`
	AssessmentTypeName   string     `gorm:"column:assessment_type_name;size:255;not null" json:"assessmentTypeName"`
	StartTime            *time.Time `gorm:"column:start_time" json:"startTime"`
	EndTime              *time.Time `gorm:"column:end_time" json:"endTime"`
	MaxAttempts          *int       `gorm:"column:max_attempts" json:"maxAttempts"`
}

func (AssessmentType) TableName() string {
	return "assessment_types"
}
