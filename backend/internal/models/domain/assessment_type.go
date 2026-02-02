package domain

import "time"

type AssessmentType struct {
	ID                   uint64     `gorm:"column:id;primaryKey" json:"id"`
	AssessmentTypeName   string     `gorm:"column:assessment_type_name;size:255;not null" json:"assessmentTypeName"`
	StartTime            *time.Time `gorm:"column:start_time" json:"startTime"`
	EndTime              *time.Time `gorm:"column:end_time" json:"endTime"`
	MaxAttempts          *int       `gorm:"column:max_attempts" json:"maxAttempts"`
	
	// Scoring Configuration
	ScoringType          string     `gorm:"column:scoring_type;default:'default';not null" json:"scoringType"` // 'default' or 'custom'
	ScoringFormula       *string    `gorm:"column:scoring_formula;type:text" json:"scoringFormula"` // Formula untuk custom scoring
	UsePercentage        bool       `gorm:"column:use_percentage;default:true" json:"usePercentage"` // Output sebagai persentase

	// Relations
	Assessments []Assessment `gorm:"foreignKey:AssessTypeID" json:"assessments,omitempty"`
}

func (AssessmentType) TableName() string {
	return "assessment_types"
}
