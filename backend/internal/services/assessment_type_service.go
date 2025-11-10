package services

import (
	"backend/internal/models/converter"
	"backend/internal/models/web"
	"backend/internal/repositories"
	"time"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type AssessmentTypeService interface {
	FindAll(db *gorm.DB) ([]web.AssessmentTypeData, error)
	FindByID(db *gorm.DB, id uint64) (web.AssessmentTypeData, error)
	Create(db *gorm.DB, request *web.AssessmentTypeCreateRequest) (web.AssessmentTypeData, error)
	Update(db *gorm.DB, request *web.AssessmentTypeUpdateRequest) (web.AssessmentTypeData, error)
	Delete(db *gorm.DB, id uint64) error
	CheckStatus(db *gorm.DB, name string) (web.AssessmentTypeStatusResponse, error)
	CheckStatusByID(db *gorm.DB, id uint64) (web.AssessmentTypeStatusResponse, error)
}

type assessmentTypeServiceImpl struct {
	AssessmentTypeRepository repositories.AssessmentTypeRepository
	Validate                 *validator.Validate
}

func NewAssessmentTypeService(assessmentTypeRepository repositories.AssessmentTypeRepository, validate *validator.Validate) AssessmentTypeService {
	return &assessmentTypeServiceImpl{
		AssessmentTypeRepository: assessmentTypeRepository,
		Validate:                 validate,
	}
}

func (service *assessmentTypeServiceImpl) FindAll(db *gorm.DB) ([]web.AssessmentTypeData, error) {
	assessmentTypes, err := service.AssessmentTypeRepository.FindAll(db)
	if err != nil {
		return []web.AssessmentTypeData{}, err
	}

	var assessmentTypeDataList []web.AssessmentTypeData
	for _, assessmentType := range assessmentTypes {
		assessmentTypeDataList = append(assessmentTypeDataList, converter.AssessmentTypeToAssessmentTypeData(&assessmentType))
	}

	return assessmentTypeDataList, nil
}

func (service *assessmentTypeServiceImpl) FindByID(db *gorm.DB, id uint64) (web.AssessmentTypeData, error) {
	assessmentType, err := service.AssessmentTypeRepository.FindByID(db, id)
	if err != nil {
		return web.AssessmentTypeData{}, err
	}

	return converter.AssessmentTypeToAssessmentTypeData(&assessmentType), nil
}

func (service *assessmentTypeServiceImpl) Create(db *gorm.DB, request *web.AssessmentTypeCreateRequest) (web.AssessmentTypeData, error) {
	err := service.Validate.Struct(request)
	if err != nil {
		return web.AssessmentTypeData{}, err
	}

	assessmentType := converter.AssessmentTypeCreateRequestToAssessmentType(request)
	err = service.AssessmentTypeRepository.Create(db, &assessmentType)
	if err != nil {
		return web.AssessmentTypeData{}, err
	}

	return converter.AssessmentTypeToAssessmentTypeData(&assessmentType), nil
}

func (service *assessmentTypeServiceImpl) Update(db *gorm.DB, request *web.AssessmentTypeUpdateRequest) (web.AssessmentTypeData, error) {
	err := service.Validate.Struct(request)
	if err != nil {
		return web.AssessmentTypeData{}, err
	}

	assessmentType := converter.AssessmentTypeUpdateRequestToAssessmentType(request)
	err = service.AssessmentTypeRepository.Update(db, &assessmentType)
	if err != nil {
		return web.AssessmentTypeData{}, err
	}

	return converter.AssessmentTypeToAssessmentTypeData(&assessmentType), nil
}

func (service *assessmentTypeServiceImpl) Delete(db *gorm.DB, id uint64) error {
	return service.AssessmentTypeRepository.Delete(db, id)
}

func (service *assessmentTypeServiceImpl) CheckStatus(db *gorm.DB, name string) (web.AssessmentTypeStatusResponse, error) {
	assessmentType, err := service.AssessmentTypeRepository.FindByName(db, name)
	if err != nil {
		return web.AssessmentTypeStatusResponse{}, err
	}

	now := time.Now()
	isOpen := true
	openMessage := "Assessment is open"

	// Check if start time has passed
	if assessmentType.StartTime != nil && now.Before(*assessmentType.StartTime) {
		isOpen = false
		openMessage = "Assessment has not started yet"
	}

	// Check if end time has passed
	if assessmentType.EndTime != nil && now.After(*assessmentType.EndTime) {
		isOpen = false
		openMessage = "Assessment has ended"
	}

	// Format times for display
	startTimeFormatted := ""
	endTimeFormatted := ""

	if assessmentType.StartTime != nil {
		startTimeFormatted = assessmentType.StartTime.Format("2006-01-02 15:04:05")
	}

	if assessmentType.EndTime != nil {
		endTimeFormatted = assessmentType.EndTime.Format("2006-01-02 15:04:05")
	}

	return web.AssessmentTypeStatusResponse{
		ID:                 assessmentType.ID,
		AssessmentTypeName: assessmentType.AssessmentTypeName,
		StartTime:          assessmentType.StartTime,
		EndTime:            assessmentType.EndTime,
		MaxAttempts:        assessmentType.MaxAttempts,
		IsOpen:             isOpen,
		OpenMessage:        openMessage,
		StartTimeFormatted: startTimeFormatted,
		EndTimeFormatted:   endTimeFormatted,
	}, nil
}

func (service *assessmentTypeServiceImpl) CheckStatusByID(db *gorm.DB, id uint64) (web.AssessmentTypeStatusResponse, error) {
	assessmentType, err := service.AssessmentTypeRepository.FindByID(db, id)
	if err != nil {
		return web.AssessmentTypeStatusResponse{}, err
	}

	now := time.Now()
	isOpen := true
	openMessage := "Assessment is open"

	// Check if start time has passed
	if assessmentType.StartTime != nil && now.Before(*assessmentType.StartTime) {
		isOpen = false
		openMessage = "Assessment has not started yet"
	}

	// Check if end time has passed
	if assessmentType.EndTime != nil && now.After(*assessmentType.EndTime) {
		isOpen = false
		openMessage = "Assessment has ended"
	}

	// Format times for display
	startTimeFormatted := ""
	endTimeFormatted := ""

	if assessmentType.StartTime != nil {
		startTimeFormatted = assessmentType.StartTime.Format("2006-01-02 15:04:05")
	}

	if assessmentType.EndTime != nil {
		endTimeFormatted = assessmentType.EndTime.Format("2006-01-02 15:04:05")
	}

	return web.AssessmentTypeStatusResponse{
		ID:                 assessmentType.ID,
		AssessmentTypeName: assessmentType.AssessmentTypeName,
		StartTime:          assessmentType.StartTime,
		EndTime:            assessmentType.EndTime,
		MaxAttempts:        assessmentType.MaxAttempts,
		IsOpen:             isOpen,
		OpenMessage:        openMessage,
		StartTimeFormatted: startTimeFormatted,
		EndTimeFormatted:   endTimeFormatted,
	}, nil
}
