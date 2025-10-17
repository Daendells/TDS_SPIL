package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func AssessmentToAssessmentData(assessment *domain.Assessment) web.AssessmentData {
	return web.AssessmentData{
		AssessmentID:      assessment.AssessmentID,
		Role:              assessment.Role,
		UsingTimer:        assessment.UsingTimer,
		TimerLimitMinutes: assessment.TimerLimitMinutes,
	}
}

func AssessmentUpdateRequestToAssessment(request *web.AssessmentUpdateRequest) domain.Assessment {
	return domain.Assessment{
		AssessmentID:     request.AssessmentID,
		Role:             request.Role,
		UsingTimer:       request.UsingTimer,
		TimerLimitMinutes: request.TimerLimitMinutes,
	}
}