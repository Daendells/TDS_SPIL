package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func AssessmentResultToAssessmentResultData(assessmentResult *domain.AssessmentResult) web.AssessmentResultData {
	return web.AssessmentResultData{
		ID:                  assessmentResult.ID,
		SeamanCode:          assessmentResult.SeamanCode,
		VA1RawScore:         assessmentResult.VA1RawScore,
		VA2RawScore:         assessmentResult.VA2RawScore,
		VA3RawScore:         assessmentResult.VA3RawScore,
		VA1CategoryScores:   assessmentResult.VA1CategoryScores,
		CorevaOcai:          assessmentResult.CorevaOcai,
		AwareConverted:      assessmentResult.AwareConverted,
		GritConverted:       assessmentResult.GritConverted,
		CorevaFinal:         assessmentResult.CorevaFinal,
		AwareFinal:          assessmentResult.AwareFinal,
		GritFinal:           assessmentResult.GritFinal,
		TotalFinalScore:     assessmentResult.TotalFinalScore,
		IsCompleted:         assessmentResult.IsCompleted,
		CompletedAt:         assessmentResult.CompletedAt,
		CreatedAt:           assessmentResult.CreatedAt,
		UpdatedAt:           assessmentResult.UpdatedAt,
	}
}