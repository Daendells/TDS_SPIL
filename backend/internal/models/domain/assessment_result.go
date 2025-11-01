package domain

import (
	"time"
)

type AssessmentResult struct {
	ID                int        `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	SeafarerCode string   `json:"seafarerCode" gorm:"column:seafarer_code;not null"`
	VA1RawScore       int        `json:"va1RawScore" gorm:"column:va_1_raw_score;default:0"`
	VA2RawScore       int        `json:"va2RawScore" gorm:"column:va_2_raw_score;default:0"`
	VA3RawScore       int        `json:"va3RawScore" gorm:"column:va_3_raw_score;default:0"`
	VA1CategoryScores string     `json:"va1CategoryScores" gorm:"column:va_1_category_scores;type:json"`
	CorevaOcai        float64    `json:"corevaOcai" gorm:"column:coreva_ocai;type:decimal(5,2);default:0"`
	AwareConverted    float64    `json:"awareConverted" gorm:"column:aware_converted;type:decimal(5,2);default:0"`
	GritConverted     float64    `json:"gritConverted" gorm:"column:grit_converted;type:decimal(5,2);default:0"`
	CorevaFinal       float64    `json:"corevaFinal" gorm:"column:coreva_final;type:decimal(5,2);default:0"`
	AwareFinal        float64    `json:"awareFinal" gorm:"column:aware_final;type:decimal(5,2);default:0"`
	GritFinal         float64    `json:"gritFinal" gorm:"column:grit_final;type:decimal(5,2);default:0"`
	TotalFinalScore   float64    `json:"totalFinalScore" gorm:"column:total_final_score;type:decimal(5,2);default:0"`
	IsCompleted       bool       `json:"isCompleted" gorm:"column:is_completed;default:0"`
	CompletedAt       *time.Time `json:"completedAt" gorm:"column:completed_at"`
	CreatedAt         time.Time  `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt         time.Time  `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
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
