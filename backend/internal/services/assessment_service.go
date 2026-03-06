package services

import (
	"backend/internal/models/converter"
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type AssessmentService interface {
	FindByRole(db *gorm.DB, role string) (web.AssessmentData, error)
	Update(db *gorm.DB, request *web.AssessmentUpdateRequest) (web.AssessmentData, error)
	Create(db *gorm.DB, request *web.AssessmentCreateRequest) (web.AssessmentData, error)
	FindAll(db *gorm.DB) ([]web.AssessmentData, error)
	Delete(db *gorm.DB, id uint64) error
	FindUnassigned(db *gorm.DB) ([]web.AssessmentData, error)
	AssignAssessment(db *gorm.DB, assessmentID uint64, assessmentTypeID *uint64) error
	UpdateTutorial(db *gorm.DB, assessmentID uint64, request *web.AssessmentTutorialRequest) (web.AssessmentData, error)
}

type assessmentServiceImpl struct {
	AssessmentRepository     repositories.AssessmentRepository
	AssessmentTypeRepository repositories.AssessmentTypeRepository
	Validate                 *validator.Validate
}

func NewAssessmentService(assessmentRepository repositories.AssessmentRepository, assessmentTypeRepository repositories.AssessmentTypeRepository, validate *validator.Validate) AssessmentService {
	return &assessmentServiceImpl{
		AssessmentRepository:     assessmentRepository,
		AssessmentTypeRepository: assessmentTypeRepository,
		Validate:                 validate,
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

func (service *assessmentServiceImpl) Create(db *gorm.DB, request *web.AssessmentCreateRequest) (web.AssessmentData, error) {
	err := service.Validate.Struct(request)
	if err != nil {
		return web.AssessmentData{}, err
	}

	// Create assessment with no assessment type initially
	assessment := converter.AssessmentCreateRequestToAssessment(request)


	err = service.AssessmentRepository.Create(db, &assessment)
	if err != nil {
		return web.AssessmentData{}, err
	}

	return converter.AssessmentToAssessmentData(&assessment), nil
}

func (service *assessmentServiceImpl) FindAll(db *gorm.DB) ([]web.AssessmentData, error) {
	assessments, err := service.AssessmentRepository.FindAll(db)
	if err != nil {
		return []web.AssessmentData{}, err
	}

	var assessmentDataList []web.AssessmentData
	for _, assessment := range assessments {
		assessmentDataList = append(assessmentDataList, converter.AssessmentToAssessmentData(&assessment))
	}

	return assessmentDataList, nil
}

func (service *assessmentServiceImpl) Delete(db *gorm.DB, id uint64) error {
	return service.AssessmentRepository.Delete(db, id)
}

func (service *assessmentServiceImpl) FindUnassigned(db *gorm.DB) ([]web.AssessmentData, error) {
	assessments, err := service.AssessmentRepository.FindUnassigned(db)
	if err != nil {
		return []web.AssessmentData{}, err
	}

	var assessmentDataList []web.AssessmentData
	for _, assessment := range assessments {
		assessmentDataList = append(assessmentDataList, converter.AssessmentToAssessmentData(&assessment))
	}

	return assessmentDataList, nil
}

func (service *assessmentServiceImpl) AssignAssessment(db *gorm.DB, assessmentID uint64, assessmentTypeID *uint64) error {
	return db.Model(&domain.Assessment{}).Where("id = ?", assessmentID).Update("assess_type_id", assessmentTypeID).Error
}

func (service *assessmentServiceImpl) UpdateTutorial(db *gorm.DB, assessmentID uint64, request *web.AssessmentTutorialRequest) (web.AssessmentData, error) {
	err := db.Model(&domain.Assessment{}).Where("id = ?", assessmentID).Updates(map[string]interface{}{
		"tutorial_content":       request.TutorialContent,
		"tutorial_timer_minutes": request.TutorialTimerMinutes,
	}).Error
	if err != nil {
		return web.AssessmentData{}, err
	}

	assessment, err := service.AssessmentRepository.FindByID(db, assessmentID)
	if err != nil {
		return web.AssessmentData{}, err
	}

	return converter.AssessmentToAssessmentData(&assessment), nil
}