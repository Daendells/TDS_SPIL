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
	FindBySeafarerCodeAndAssessmentTypePreferActiveBatch(db *gorm.DB, seafarerCode string, assessmentTypeID uint64) (domain.SeafarerAssessment, error)
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

// FindBySeafarerCodeAndAssessmentTypePreferActiveBatch finds the assignment row for the given seafarer and
// assessment type, preferring the row linked to the currently active batch. Falls back to any unlinked
// (batch_id IS NULL) row, and finally to rows linked to non-active batches.
func (repository *seafarerAssessmentRepositoryImpl) FindBySeafarerCodeAndAssessmentTypePreferActiveBatch(db *gorm.DB, seafarerCode string, assessmentTypeID uint64) (domain.SeafarerAssessment, error) {
	var seafarerAssessment domain.SeafarerAssessment
	err := db.
		Joins("LEFT JOIN batches ON batches.id = seafarer_assessments.batch_id").
		Where("seafarer_assessments.seafarer_code = ? AND seafarer_assessments.assessment_type_id = ?", seafarerCode, assessmentTypeID).
		Order("CASE WHEN batches.status = 'active' THEN 0 WHEN seafarer_assessments.batch_id IS NULL THEN 1 ELSE 2 END, seafarer_assessments.id DESC").
		First(&seafarerAssessment).Error
	return seafarerAssessment, err
}
