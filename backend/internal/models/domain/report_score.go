package domain

type ReportScore struct {
	ID               int    `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	ReportID         int64  `json:"reportId" gorm:"column:report_id;not null"`
	AssessmentTypeID uint64 `json:"assessmentTypeId" gorm:"column:assessment_type_id;not null"`
	Score            int    `json:"score" gorm:"column:score;not null"`

	// Relations - use constraint:false to prevent reverse FK constraints during migration
	Report         *Report         `json:"report,omitempty" gorm:"foreignKey:ReportID;references:ID;constraint:false"`
	AssessmentType *AssessmentType `json:"assessmentType,omitempty" gorm:"foreignKey:AssessmentTypeID;references:ID;constraint:false"`
}

func (ReportScore) TableName() string {
	return "report_scores"
}