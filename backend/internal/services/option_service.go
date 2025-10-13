package services

import (
	"backend/internal/models/converter"
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type OptionService interface {
	Create(db *gorm.DB, request *web.OptionCreateRequest) (web.OptionData, error)
	FindAll(db *gorm.DB) ([]web.OptionData, error)
	FindById(db *gorm.DB, optionId int) (web.OptionData, error)
	FindByQuestionId(db *gorm.DB, questionId int) ([]web.OptionData, error)
	Update(db *gorm.DB, request *web.OptionUpdateRequest) (web.OptionData, error)
	Delete(db *gorm.DB, optionId int) error
}

type optionServiceImpl struct {
	OptionRepository repositories.OptionRepository
	Validate         *validator.Validate
}

func NewOptionService(optionRepository repositories.OptionRepository, validate *validator.Validate) OptionService {
	return &optionServiceImpl{
		OptionRepository: optionRepository,
		Validate:         validate,
	}
}

// Helper function to convert slice of options to slice of option data
func (service *optionServiceImpl) convertOptionsToData(options []domain.Option) []web.OptionData {
	optionDataList := make([]web.OptionData, len(options))
	for i, option := range options {
		optionDataList[i] = converter.OptionToOptionData(&option)
	}
	return optionDataList
}

func (service *optionServiceImpl) Create(db *gorm.DB, request *web.OptionCreateRequest) (web.OptionData, error) {
	err := service.Validate.Struct(request)
	if err != nil {
		return web.OptionData{}, err
	}

	option := converter.OptionCreateRequestToOption(request)
	err = service.OptionRepository.Create(db, &option)
	if err != nil {
		return web.OptionData{}, err
	}

	return converter.OptionToOptionData(&option), nil
}

func (service *optionServiceImpl) FindAll(db *gorm.DB) ([]web.OptionData, error) {
	options, err := service.OptionRepository.FindAll(db)
	if err != nil {
		return []web.OptionData{}, err
	}

	return service.convertOptionsToData(options), nil
}

func (service *optionServiceImpl) FindById(db *gorm.DB, optionId int) (web.OptionData, error) {
	option, err := service.OptionRepository.FindById(db, optionId)
	if err != nil {
		return web.OptionData{}, err
	}

	return converter.OptionToOptionData(&option), nil
}

func (service *optionServiceImpl) FindByQuestionId(db *gorm.DB, questionId int) ([]web.OptionData, error) {
	options, err := service.OptionRepository.FindByQuestionId(db, questionId)
	if err != nil {
		return []web.OptionData{}, err
	}

	return service.convertOptionsToData(options), nil
}

func (service *optionServiceImpl) Update(db *gorm.DB, request *web.OptionUpdateRequest) (web.OptionData, error) {
	err := service.Validate.Struct(request)
	if err != nil {
		return web.OptionData{}, err
	}

	option := converter.OptionUpdateRequestToOption(request)
	err = service.OptionRepository.Update(db, &option)
	if err != nil {
		return web.OptionData{}, err
	}

	return converter.OptionToOptionData(&option), nil
}

func (service *optionServiceImpl) Delete(db *gorm.DB, optionId int) error {
	return service.OptionRepository.Delete(db, optionId)
}