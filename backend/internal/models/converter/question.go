package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func QuestionToQuestionData(question *domain.Question) web.QuestionData {
	return web.QuestionData{
		QuestionID:   question.QuestionID,
		Role:         question.Role,
		QuestionText: question.QuestionText,
	}
}

func QuestionCreateRequestToQuestion(request *web.QuestionCreateRequest) domain.Question {
	return domain.Question{
		Role:         request.Role,
		QuestionText: request.QuestionText,
	}
}

func QuestionUpdateRequestToQuestion(request *web.QuestionUpdateRequest) domain.Question {
	return domain.Question{
		QuestionID:   request.QuestionID,
		Role:         request.Role,
		QuestionText: request.QuestionText,
	}
}
