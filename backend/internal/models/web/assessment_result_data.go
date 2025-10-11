package web

import "time"

type AssessmentResultData struct {
	ID                  int       `json:"id"`
	SeamanCode          string    `json:"seamanCode"`
	VA1RawScore         int       `json:"va1RawScore"`
	VA2RawScore         int       `json:"va2RawScore"`
	VA3RawScore         int       `json:"va3RawScore"`
	VA1CategoryScores   string    `json:"va1CategoryScores"`
	CorevaOcai          float64   `json:"corevaOcai"`
	AwareConverted      float64   `json:"awareConverted"`
	GritConverted       float64   `json:"gritConverted"`
	CorevaFinal         float64   `json:"corevaFinal"`
	AwareFinal          float64   `json:"awareFinal"`
	GritFinal           float64   `json:"gritFinal"`
	TotalFinalScore     float64   `json:"totalFinalScore"`
	IsCompleted         bool      `json:"isCompleted"`
	CompletedAt         *time.Time `json:"completedAt"`
	CreatedAt           time.Time `json:"createdAt"`
	UpdatedAt           time.Time `json:"updatedAt"`
}