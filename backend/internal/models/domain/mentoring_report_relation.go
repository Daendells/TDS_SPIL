package domain

import "time"

type MentoringReportRelation struct {
	ID                int64     `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	MentoringReportID int64     `json:"mentoringReportId" gorm:"column:mentoring_report_id;not null"`
	ReportID          int64     `json:"reportId" gorm:"column:report_id;not null"`
	CreatedAt         time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`

	// Relations
	MentoringReport *MentoringReport `json:"mentoringReport,omitempty" gorm:"foreignKey:MentoringReportID;references:ID"`
	Report          *Report          `json:"report,omitempty" gorm:"foreignKey:ReportID;references:ID"`
}

func (MentoringReportRelation) TableName() string {
	return "mentoring_report_relations"
}
