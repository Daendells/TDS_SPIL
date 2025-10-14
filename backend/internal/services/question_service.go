package services

import (
	"backend/internal/models/converter"
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type QuestionService interface {
	Create(db *gorm.DB, request *web.QuestionCreateRequest) (web.QuestionData, error)
	FindAll(db *gorm.DB) ([]web.QuestionData, error)
	FindById(db *gorm.DB, questionId int) (web.QuestionData, error)
	FindByRole(db *gorm.DB, role string) ([]web.QuestionData, error)
	Update(db *gorm.DB, request *web.QuestionUpdateRequest) (web.QuestionData, error)
	Delete(db *gorm.DB, questionId int) error
	BulkDelete(db *gorm.DB, questionIds []int) error
}

type questionServiceImpl struct {
	QuestionRepository repositories.QuestionRepository
	Validate           *validator.Validate
}

func NewQuestionService(questionRepository repositories.QuestionRepository, validate *validator.Validate) QuestionService {
	return &questionServiceImpl{
		QuestionRepository: questionRepository,
		Validate:           validate,
	}
}

// Helper function to convert slice of questions to slice of question data
func (service *questionServiceImpl) convertQuestionsToData(questions []domain.Question) []web.QuestionData {
	questionDataList := make([]web.QuestionData, len(questions))
	for i, question := range questions {
		questionDataList[i] = converter.QuestionToQuestionData(&question)
	}
	return questionDataList
}

func (service *questionServiceImpl) Create(db *gorm.DB, request *web.QuestionCreateRequest) (web.QuestionData, error) {
	err := service.Validate.Struct(request)
	if err != nil {
		return web.QuestionData{}, err
	}

	question := converter.QuestionCreateRequestToQuestion(request)
	err = service.QuestionRepository.Create(db, &question)
	if err != nil {
		return web.QuestionData{}, err
	}

	return converter.QuestionToQuestionData(&question), nil
}

func (service *questionServiceImpl) FindAll(db *gorm.DB) ([]web.QuestionData, error) {
	questions, err := service.QuestionRepository.FindAll(db)
	if err != nil {
		return []web.QuestionData{}, err
	}

	return service.convertQuestionsToData(questions), nil
}

func (service *questionServiceImpl) FindById(db *gorm.DB, questionId int) (web.QuestionData, error) {
	question, err := service.QuestionRepository.FindById(db, questionId)
	if err != nil {
		return web.QuestionData{}, err
	}

	return converter.QuestionToQuestionData(&question), nil
}

func (service *questionServiceImpl) FindByRole(db *gorm.DB, role string) ([]web.QuestionData, error) {
	questions, err := service.QuestionRepository.FindByRole(db, role)
	if err != nil {
		return []web.QuestionData{}, err
	}

	return service.convertQuestionsToData(questions), nil
}

func (service *questionServiceImpl) Update(db *gorm.DB, request *web.QuestionUpdateRequest) (web.QuestionData, error) {
	err := service.Validate.Struct(request)
	if err != nil {
		return web.QuestionData{}, err
	}

	question := converter.QuestionUpdateRequestToQuestion(request)
	err = service.QuestionRepository.Update(db, &question)
	if err != nil {
		return web.QuestionData{}, err
	}

	return converter.QuestionToQuestionData(&question), nil
}

func (service *questionServiceImpl) Delete(db *gorm.DB, questionId int) error {
	return service.QuestionRepository.Delete(db, questionId)
}

func (service *questionServiceImpl) BulkDelete(db *gorm.DB, questionIds []int) error {
	return service.QuestionRepository.BulkDelete(db, questionIds)
}
