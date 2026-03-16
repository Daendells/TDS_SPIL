package domain

import "time"

type NewRecruiterReportScore struct {
	ID               uint64          `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	NewRecruiterID   uint64          `json:"newRecruiterId" gorm:"column:new_recruiter_id;not null;index;uniqueIndex:idx_new_recruiter_score"`
	AssessmentTypeID uint64          `json:"assessmentTypeId" gorm:"column:assessment_type_id;not null;index;uniqueIndex:idx_new_recruiter_score"`
	Score            int             `json:"score" gorm:"column:score;not null;default:0"`
	CreatedAt        time.Time       `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time       `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
	AssessmentType   *AssessmentType `json:"assessmentType,omitempty" gorm:"foreignKey:AssessmentTypeID;references:ID"`
}

func (NewRecruiterReportScore) TableName() string {
	return "new_recruiter_report_scores"
}
