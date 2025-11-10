package repositories

import (
	"backend/internal/models/domain"

	"gorm.io/gorm"
)

type AssessmentTypeRepository interface {
	FindAll(db *gorm.DB) ([]domain.AssessmentType, error)
	FindByID(db *gorm.DB, id uint64) (domain.AssessmentType, error)
	FindByName(db *gorm.DB, name string) (domain.AssessmentType, error)
	Create(db *gorm.DB, assessmentType *domain.AssessmentType) error
	Update(db *gorm.DB, assessmentType *domain.AssessmentType) error
	Delete(db *gorm.DB, id uint64) error
}

type assessmentTypeRepositoryImpl struct {
}

func NewAssessmentTypeRepository() AssessmentTypeRepository {
	return &assessmentTypeRepositoryImpl{}
}

func (repository *assessmentTypeRepositoryImpl) FindAll(db *gorm.DB) ([]domain.AssessmentType, error) {
	var assessmentTypes []domain.AssessmentType
	err := db.Find(&assessmentTypes).Error
	return assessmentTypes, err
}

func (repository *assessmentTypeRepositoryImpl) FindByID(db *gorm.DB, id uint64) (domain.AssessmentType, error) {
	var assessmentType domain.AssessmentType
	err := db.Where("id = ?", id).First(&assessmentType).Error
	return assessmentType, err
}

func (repository *assessmentTypeRepositoryImpl) FindByName(db *gorm.DB, name string) (domain.AssessmentType, error) {
	var assessmentType domain.AssessmentType
	err := db.Where("assessment_type_name = ?", name).First(&assessmentType).Error
	return assessmentType, err
}

func (repository *assessmentTypeRepositoryImpl) Create(db *gorm.DB, assessmentType *domain.AssessmentType) error {
	return db.Create(assessmentType).Error
}

func (repository *assessmentTypeRepositoryImpl) Update(db *gorm.DB, assessmentType *domain.AssessmentType) error {
	return db.Save(assessmentType).Error
}

func (repository *assessmentTypeRepositoryImpl) Delete(db *gorm.DB, id uint64) error {
	return db.Delete(&domain.AssessmentType{}, id).Error
}
