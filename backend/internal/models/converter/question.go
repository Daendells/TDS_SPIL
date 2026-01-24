package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func QuestionToQuestionData(question *domain.Question) web.QuestionData {
	return web.QuestionData{
		QuestionID:        question.QuestionID,
		Role:              question.Role,
		AssessmentID:      question.AssessmentID,
		QuestionText:      question.QuestionText,
		Category:          question.Category,
		IsImage:           question.IsImage,
		ImageURL:          question.ImageURL,
		AspectID:          question.AspectID,
		QuestionType:      question.QuestionType,
		AcceptableAnswers: question.AcceptableAnswers,
	}
}

func QuestionCreateRequestToQuestion(request *web.QuestionCreateRequest) domain.Question {
	questionType := request.QuestionType
	if questionType == "" {
		questionType = "single_choice"
	}
	return domain.Question{
		Role:              request.Role,
		AssessmentID:      &request.AssessmentID,
		QuestionText:      request.QuestionText,
		Category:          request.Category,
		IsImage:           request.IsImage,
		ImageURL:          request.ImageURL,
		AspectID:          request.AspectID,
		QuestionType:      questionType,
		AcceptableAnswers: request.AcceptableAnswers,
	}
}

func QuestionUpdateRequestToQuestion(request *web.QuestionUpdateRequest) domain.Question {
	questionType := request.QuestionType
	if questionType == "" {
		questionType = "single_choice"
	}
	return domain.Question{
		QuestionID:        request.QuestionID,
		Role:              request.Role,
		AssessmentID:      &request.AssessmentID,
		QuestionText:      request.QuestionText,
		Category:          request.Category,
		IsImage:           request.IsImage,
		ImageURL:          request.ImageURL,
		AspectID:          request.AspectID,
		QuestionType:      questionType,
		AcceptableAnswers: request.AcceptableAnswers,
	}
}

