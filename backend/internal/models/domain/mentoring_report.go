package domain

import "time"

type MentoringReport struct {
	ID              int64      `json:"id" gorm:"column:id;primaryKey"`
	MentorName      string     `json:"mentorName" gorm:"column:mentor_name"`
	Period          string     `json:"period" gorm:"column:period"`
	MenteeNames     string     `json:"menteeNames" gorm:"column:mentee_names"` // JSON string of mentee names
	Department      string     `json:"department" gorm:"column:department"`
	Program         string     `json:"program" gorm:"column:program"`
	SessionNumber   string     `json:"sessionNumber" gorm:"column:session_number"`
	Date            string     `json:"date" gorm:"column:date"`
	Duration        string     `json:"duration" gorm:"column:duration"`
	Purpose         string     `json:"purpose" gorm:"column:purpose"`
	Observation     string     `json:"observation" gorm:"column:observation"`
	Reflection      string     `json:"reflection" gorm:"column:reflection"`
	ActionPlan      string     `json:"actionPlan" gorm:"column:action_plan"`
	AdditionalNotes string     `json:"additionalNotes" gorm:"column:additional_notes"`
	ReportIDs       string     `json:"reportIds" gorm:"column:report_ids"` // JSON string of report IDs
	CreatedAt       *time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt       *time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

// TableName specifies the table name for GORM
func (MentoringReport) TableName() string {
	return "mentoring_reports"
}