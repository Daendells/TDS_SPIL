package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func AssessmentResultToAssessmentResultData(assessmentResult *domain.AssessmentResult) web.AssessmentResultData {
	data := web.AssessmentResultData{
		ID:           assessmentResult.ID,
		SeafarerCode: assessmentResult.SeafarerCode,
		AssessmentID: assessmentResult.AssessmentID,
		IsCompleted:  assessmentResult.IsCompleted,
		CompletedAt:  assessmentResult.CompletedAt,
		CreatedAt:    assessmentResult.CreatedAt,
		UpdatedAt:    assessmentResult.UpdatedAt,
	}

	// Convert score results if available
	if len(assessmentResult.ScoreResults) > 0 {
		data.ScoreResults = make([]web.ScoreResultData, len(assessmentResult.ScoreResults))
		for i, sr := range assessmentResult.ScoreResults {
			data.ScoreResults[i] = ScoreResultToScoreResultData(&sr)
		}
	}

	return data
}

func ScoreResultToScoreResultData(scoreResult *domain.ScoreResult) web.ScoreResultData {
	data := web.ScoreResultData{
		ID:                 scoreResult.ID,
		RawScore:           scoreResult.RawScore,
		FinalScore:         scoreResult.FinalScore,
		AssessmentResultID: scoreResult.AssessmentResultID,
		AspectID:           scoreResult.AspectID,
	}

	// Convert aspect if available
	if scoreResult.Aspect != nil {
		aspectData := AspectToAspectData(scoreResult.Aspect)
		data.Aspect = &aspectData
	}

	return data
}
