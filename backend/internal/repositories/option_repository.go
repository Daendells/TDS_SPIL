package repositories

import (
	"backend/internal/models/domain"

	"gorm.io/gorm"
)

type OptionRepository interface {
	Create(db *gorm.DB, option *domain.Option) error
	FindAll(db *gorm.DB) ([]domain.Option, error)
	FindById(db *gorm.DB, optionId int) (domain.Option, error)
	FindByQuestionId(db *gorm.DB, questionId int) ([]domain.Option, error)
	Update(db *gorm.DB, option *domain.Option) error
	Delete(db *gorm.DB, optionId int) error
	DeleteByQuestionId(db *gorm.DB, questionId int) error
}

type optionRepositoryImpl struct {
}

func NewOptionRepository() OptionRepository {
	return &optionRepositoryImpl{}
}

func (repository *optionRepositoryImpl) Create(db *gorm.DB, option *domain.Option) error {
	return db.Create(option).Error
}

func (repository *optionRepositoryImpl) FindAll(db *gorm.DB) ([]domain.Option, error) {
	var options []domain.Option
	err := db.Find(&options).Error
	return options, err
}

func (repository *optionRepositoryImpl) FindById(db *gorm.DB, optionId int) (domain.Option, error) {
	var option domain.Option
	err := db.Where("option_id = ?", optionId).First(&option).Error
	return option, err
}

func (repository *optionRepositoryImpl) FindByQuestionId(db *gorm.DB, questionId int) ([]domain.Option, error) {
	var options []domain.Option
	err := db.Where("question_id = ?", questionId).Find(&options).Error
	return options, err
}

func (repository *optionRepositoryImpl) Update(db *gorm.DB, option *domain.Option) error {
	return db.Save(option).Error
}

func (repository *optionRepositoryImpl) Delete(db *gorm.DB, optionId int) error {
	return db.Where("option_id = ?", optionId).Delete(&domain.Option{}).Error
}

func (repository *optionRepositoryImpl) DeleteByQuestionId(db *gorm.DB, questionId int) error {
	return db.Where("question_id = ?", questionId).Delete(&domain.Option{}).Error
}