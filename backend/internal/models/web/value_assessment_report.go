package web

import "time"

type ValueAssessmentReportResponse struct {
	SeafarerCode          string                 `json:"seafarerCode"`
	CompletedAt           *time.Time             `json:"completedAt"`
	TotalScore            float64                `json:"totalScore"`
	ValueAssessment       int                    `json:"valueAssessment"`
	ValueAssessmentScore  int                    `json:"valueAssessmentScore"`
	Interpretasi          string                 `json:"interpretasi"`
	Coreva                CorevaReportData       `json:"coreva"`
	Aware                 AssessmentReportData   `json:"aware"`
	Grit                  AssessmentReportData   `json:"grit"`
}

type CorevaReportData struct {
	RawScore      int                    `json:"rawScore"`
	FinalScore    int                    `json:"finalScore"`
	KonversiScore float64                `json:"konversiScore"`
	ScoreResult   []AspectScoreResult    `json:"scoreResult"`
}

type AssessmentReportData struct {
	RawScore      int     `json:"rawScore"`
	FinalScore    int     `json:"finalScore"`
	KonversiScore float64 `json:"konversiScore"`
}

type AspectScoreResult struct {
	AspectID   int    `json:"aspectId"`
	AspectName string `json:"aspectName"`
	RawScore   int    `json:"rawScore"`
	FinalScore int    `json:"finalScore"`
}
