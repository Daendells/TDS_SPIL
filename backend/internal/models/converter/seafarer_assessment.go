package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"time"
)

func SeafarerAssessmentToSeafarerAssessmentData(seafarerAssessment *domain.SeafarerAssessment) web.SeafarerAssessmentData {
	return web.SeafarerAssessmentData{
		ID:               seafarerAssessment.ID,
		SeafarerCode:     seafarerAssessment.SeafarerCode,
		AssessmentTypeID: seafarerAssessment.AssessmentTypeID,
		AssignedAt:       seafarerAssessment.AssignedAt,
		Status:           seafarerAssessment.Status,
		AttemptsCount:    seafarerAssessment.AttemptsCount,
	}
}

func SeafarerAssessmentCreateRequestToSeafarerAssessment(request *web.SeafarerAssessmentCreateRequest) domain.SeafarerAssessment {
	now := time.Now()
	return domain.SeafarerAssessment{
		SeafarerCode:     request.SeafarerCode,
		AssessmentTypeID: request.AssessmentTypeID,
		AssignedAt:       &now,
		Status:           "assigned",
		AttemptsCount:    0,
	}
}
