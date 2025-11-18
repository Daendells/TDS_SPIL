package domain

import (
	"time"
)

type AssessmentResult struct {
	ID           int64      `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	SeafarerCode string     `json:"seafarerCode" gorm:"column:seafarer_code;size:50;not null"`
	AssessmentID int64      `json:"assessmentId" gorm:"column:assessment_id;not null"`
	IsCompleted  int8       `json:"isCompleted" gorm:"column:is_completed;default:0"`
	CompletedAt  *time.Time `json:"completedAt" gorm:"column:completed_at"`
	CreatedAt    time.Time  `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt    time.Time  `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`

	// Relations - use constraint:false for HasMany to prevent reverse FK constraints
	Assessment   *Assessment   `json:"assessment,omitempty" gorm:"foreignKey:AssessmentID;references:AssessmentID;constraint:false"`
	ScoreResults []ScoreResult `json:"scoreResults,omitempty" gorm:"foreignKey:AssessmentResultID;references:ID;constraint:false"`
}

func (AssessmentResult) TableName() string {
	return "assessment_results"
}

type CategoryScores struct {
	Integrity        float64 `json:"integrity"`
	CustomerOriented float64 `json:"customerOriented"`
	Competitive      float64 `json:"competitive"`
	TeamWork         float64 `json:"teamWork"`
	Visioner         float64 `json:"visioner"`
}
