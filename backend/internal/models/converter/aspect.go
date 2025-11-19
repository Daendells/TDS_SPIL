package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func AspectToAspectData(aspect *domain.Aspect) web.AspectData {
	return web.AspectData{
		ID:           aspect.ID,
		Name:         aspect.Name,
		Weight:       aspect.Weight,
		AssessmentID: aspect.AssessmentID,
		QuestionID:   aspect.QuestionID,
	}
}

func AspectCreateRequestToAspect(request *web.AspectCreateRequest) domain.Aspect {
	return domain.Aspect{
		Name:         request.Name,
		Weight:       request.Weight,
		AssessmentID: request.AssessmentID,
		QuestionID:   request.QuestionID,
	}
}

func AspectUpdateRequestToAspect(request *web.AspectUpdateRequest, existing *domain.Aspect) domain.Aspect {
	aspect := *existing

	if request.Name != "" {
		aspect.Name = request.Name
	}
	if request.Weight > 0 {
		aspect.Weight = request.Weight
	}
	if request.AssessmentID > 0 {
		aspect.AssessmentID = request.AssessmentID
	}
	// QuestionID can be set to nil explicitly
	aspect.QuestionID = request.QuestionID

	return aspect
}
