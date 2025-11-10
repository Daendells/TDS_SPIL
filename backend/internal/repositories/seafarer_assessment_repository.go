package repositories

import (
	"backend/internal/models/domain"

	"gorm.io/gorm"
)

type SeafarerAssessmentRepository interface {
	FindAll(db *gorm.DB) ([]domain.SeafarerAssessment, error)
	FindByID(db *gorm.DB, id uint64) (domain.SeafarerAssessment, error)
	FindBySeafarerCode(db *gorm.DB, seafarerCode string) ([]domain.SeafarerAssessment, error)
	FindByAssessmentTypeID(db *gorm.DB, assessmentTypeID uint64) ([]domain.SeafarerAssessment, error)
	Create(db *gorm.DB, seafarerAssessment *domain.SeafarerAssessment) error
	Update(db *gorm.DB, seafarerAssessment *domain.SeafarerAssessment) error
	Delete(db *gorm.DB, id uint64) error
	FindBySeafarerCodeAndAssessmentType(db *gorm.DB, seafarerCode string, assessmentTypeID uint64) (domain.SeafarerAssessment, error)
}

type seafarerAssessmentRepositoryImpl struct {
}

func NewSeafarerAssessmentRepository() SeafarerAssessmentRepository {
	return &seafarerAssessmentRepositoryImpl{}
}

func (repository *seafarerAssessmentRepositoryImpl) FindAll(db *gorm.DB) ([]domain.SeafarerAssessment, error) {
	var seafarerAssessments []domain.SeafarerAssessment
	err := db.Find(&seafarerAssessments).Error
	return seafarerAssessments, err
}

func (repository *seafarerAssessmentRepositoryImpl) FindByID(db *gorm.DB, id uint64) (domain.SeafarerAssessment, error) {
	var seafarerAssessment domain.SeafarerAssessment
	err := db.Where("id = ?", id).First(&seafarerAssessment).Error
	return seafarerAssessment, err
}

func (repository *seafarerAssessmentRepositoryImpl) FindBySeafarerCode(db *gorm.DB, seafarerCode string) ([]domain.SeafarerAssessment, error) {
	var seafarerAssessments []domain.SeafarerAssessment
	err := db.Where("seafarer_code = ?", seafarerCode).Find(&seafarerAssessments).Error
	return seafarerAssessments, err
}

func (repository *seafarerAssessmentRepositoryImpl) FindByAssessmentTypeID(db *gorm.DB, assessmentTypeID uint64) ([]domain.SeafarerAssessment, error) {
	var seafarerAssessments []domain.SeafarerAssessment
	err := db.Where("assessment_type_id = ?", assessmentTypeID).Find(&seafarerAssessments).Error
	return seafarerAssessments, err
}

func (repository *seafarerAssessmentRepositoryImpl) Create(db *gorm.DB, seafarerAssessment *domain.SeafarerAssessment) error {
	return db.Create(seafarerAssessment).Error
}

func (repository *seafarerAssessmentRepositoryImpl) Update(db *gorm.DB, seafarerAssessment *domain.SeafarerAssessment) error {
	return db.Save(seafarerAssessment).Error
}

func (repository *seafarerAssessmentRepositoryImpl) Delete(db *gorm.DB, id uint64) error {
	return db.Delete(&domain.SeafarerAssessment{}, id).Error
}

func (repository *seafarerAssessmentRepositoryImpl) FindBySeafarerCodeAndAssessmentType(db *gorm.DB, seafarerCode string, assessmentTypeID uint64) (domain.SeafarerAssessment, error) {
	var seafarerAssessment domain.SeafarerAssessment
	err := db.Where("seafarer_code = ? AND assessment_type_id = ?", seafarerCode, assessmentTypeID).First(&seafarerAssessment).Error
	return seafarerAssessment, err
}
