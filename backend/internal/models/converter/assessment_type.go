package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func AssessmentTypeToAssessmentTypeData(assessmentType *domain.AssessmentType) web.AssessmentTypeData {
	var assignedAssessments []string
	if assessmentType.Assessments != nil {
		for _, assessment := range assessmentType.Assessments {
			assignedAssessments = append(assignedAssessments, assessment.AssessmentName)
		}
	}

	return web.AssessmentTypeData{
		ID:                 assessmentType.ID,
		AssessmentTypeName: assessmentType.AssessmentTypeName,
		StartTime:          assessmentType.StartTime,
		EndTime:            assessmentType.EndTime,
		MaxAttempts:        assessmentType.MaxAttempts,
		AssignedAssessments: assignedAssessments,
	}
}

func AssessmentTypeCreateRequestToAssessmentType(request *web.AssessmentTypeCreateRequest) domain.AssessmentType {
	return domain.AssessmentType{
		AssessmentTypeName: request.AssessmentTypeName,
		StartTime:          request.StartTime,
		EndTime:            request.EndTime,
		MaxAttempts:        request.MaxAttempts,
	}
}

func AssessmentTypeUpdateRequestToAssessmentType(request *web.AssessmentTypeUpdateRequest) domain.AssessmentType {
	return domain.AssessmentType{
		ID:                 request.ID,
		AssessmentTypeName: request.AssessmentTypeName,
		StartTime:          request.StartTime,
		EndTime:            request.EndTime,
		MaxAttempts:        request.MaxAttempts,
	}
}
