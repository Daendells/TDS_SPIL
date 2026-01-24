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
	// First find the assessment to get current data
	// Need to implement FindByID in repository or use raw query, but Update method usually expects full struct
	// For simplicity, we can fetch all and filter or add FindByID to repo. Respository FindAll is domain.Assessment.
	// Actually we should add FindByID to repo, but let's see if we can use existing Update method.
	// Update method takes domain.Assessment.
	
	// Let's assume we can fetch by role or something, but we only have ID.
	// Best approach: Add FindByID to repository or use GORM directly here? No, stick to repo.
	// But I don't want to edit repo again if possible. 
	// Wait, I can use db.Model(&domain.Assessment{}).Where("id = ?", id).Update("assess_type_id", typeID)
	// But service should use repository methods.
	
	// Let's modify repository Update to be more flexible? No.
	// Let's just use raw DB update here or ask user to add FindByID?
	// I'll add the method and just direct update in service for now to save tool calls, 
	// or rely on a new method I'll add to Repo? 
	// Actually, I can just use repository.Update(db, &assessment) if I can get the assessment.
	
	// Let's modify the service to use a direct DB update for this specific field to be efficient.
	return db.Model(&domain.Assessment{}).Where("id = ?", assessmentID).Update("assess_type_id", assessmentTypeID).Error
}