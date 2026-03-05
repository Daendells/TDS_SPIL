package domain

import "time"

type GapCompetency struct {
	ID               int    `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	ReportID         int    `json:"reportId" gorm:"column:report_id;not null;uniqueIndex:idx_report_competency"`
	CompetencyTypeID int    `json:"competencyTypeId" gorm:"column:competency_type_id;not null;uniqueIndex:idx_report_competency"`
	GapLevel         string `json:"gapLevel" gorm:"column:gap_level;type:enum('LOW','MEDIUM','HIGH');default:'MEDIUM'"`
	Priority         int    `json:"priority" gorm:"column:priority;default:1"`

	CreatedAt time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	Report         *Report         `json:"report,omitempty" gorm:"foreignKey:ReportID;references:ID"`
	CompetencyType *CompetencyType `json:"competencyType,omitempty" gorm:"foreignKey:CompetencyTypeID;references:ID"`
}

func (GapCompetency) TableName() string {
	return "gap_competencies"
}

// Helper method to check if gap is high priority
func (gc *GapCompetency) IsHighPriority() bool {
	return gc.Priority >= 3 || gc.GapLevel == "HIGH"
}

// Helper method to check if gap is critical (high level and high priority)
func (gc *GapCompetency) IsCritical() bool {
	return gc.GapLevel == "HIGH" && gc.Priority >= 3
}

// Helper method to get gap severity score (for sorting/prioritization)
func (gc *GapCompetency) GetSeverityScore() int {
	levelScore := 0
	switch gc.GapLevel {
	case "LOW":
		levelScore = 1
	case "MEDIUM":
		levelScore = 2
	case "HIGH":
		levelScore = 3
	}
	return levelScore * gc.Priority
}
