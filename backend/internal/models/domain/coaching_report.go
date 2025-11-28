package domain

import "time"

type CoachingReport struct {
	ID              int64      `json:"id" gorm:"column:id;primaryKey"`
	CoachName       string     `json:"coachName" gorm:"column:coach_name"`
	Period          string     `json:"period" gorm:"column:period"`
	CoacheeNames    string     `json:"coacheeNames" gorm:"column:coachee_names"`
	Department      string     `json:"department" gorm:"column:department"`
	Program         string     `json:"program" gorm:"column:program"`
	ProgramTitle    string     `json:"programTitle" gorm:"column:program_title"`
	SessionNumber   string     `json:"sessionNumber" gorm:"column:session_number"`
	Date            string     `json:"date" gorm:"column:date"`
	Duration        string     `json:"duration" gorm:"column:duration"`
	Purpose         string     `json:"purpose" gorm:"column:purpose"`
	Observation     string     `json:"observation" gorm:"column:observation"`
	Reflection      string     `json:"reflection" gorm:"column:reflection"`
	ActionPlan      string     `json:"actionPlan" gorm:"column:action_plan"`
	AdditionalNotes string     `json:"additionalNotes" gorm:"column:additional_notes"`
	ReportIDs       string     `json:"reportIds" gorm:"column:report_ids"`
	CreatedAt       *time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt       *time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

func (CoachingReport) TableName() string {
	return "coaching_reports"
}
