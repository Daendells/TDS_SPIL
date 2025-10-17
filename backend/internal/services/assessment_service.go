package services

import (
	"backend/internal/models/converter"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type AssessmentService interface {
	FindByRole(db *gorm.DB, role string) (web.AssessmentData, error)
	Update(db *gorm.DB, request *web.AssessmentUpdateRequest) (web.AssessmentData, error)
}

type assessmentServiceImpl struct {
	AssessmentRepository repositories.AssessmentRepository
	Validate *validator.Validate
}

func NewAssessmentService (assessmentRepository repositories.AssessmentRepository, validate *validator.Validate) AssessmentService {
	return &assessmentServiceImpl{
		AssessmentRepository: assessmentRepository,
		Validate: validate,
	}
}

func (service *assessmentServiceImpl) FindByRole(db *gorm.DB, role string) (web.AssessmentData, error) {
	assessment, err := service.AssessmentRepository.FindByRole(db, role)
	if err != nil {
		return web.AssessmentData{}, err
	}

	return converter.AssessmentToAssessmentData(&assessment), nil
}

func (service *assessmentServiceImpl) Update(db *gorm.DB, request *web.AssessmentUpdateRequest) (web.AssessmentData, error) {
	err := service.Validate.Struct(request)
	if err != nil {
		return web.AssessmentData{}, err
	}

	assessment := converter.AssessmentUpdateRequestToAssessment(request)
	err = service.AssessmentRepository.Update(db, &assessment)
	if err != nil {
		return web.AssessmentData{}, err
	}

	return converter.AssessmentToAssessmentData(&assessment), nil
}