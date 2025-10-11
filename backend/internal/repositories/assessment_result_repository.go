package repositories

import (
	"backend/internal/models/domain"
	"gorm.io/gorm"
)

type AssessmentResultRepository interface {
	Create(db *gorm.DB, assessmentResult *domain.AssessmentResult) (*domain.AssessmentResult, error)
	Update(db *gorm.DB, assessmentResult *domain.AssessmentResult) (*domain.AssessmentResult, error)
	FindBySeamanCode(db *gorm.DB, seamanCode string) (*domain.AssessmentResult, error)
	FindByID(db *gorm.DB, id int) (*domain.AssessmentResult, error)
	Delete(db *gorm.DB, id int) error
}

type assessmentResultRepositoryImpl struct {
}

func NewAssessmentResultRepository() AssessmentResultRepository {
	return &assessmentResultRepositoryImpl{}
}

func (repository *assessmentResultRepositoryImpl) Create(db *gorm.DB, assessmentResult *domain.AssessmentResult) (*domain.AssessmentResult, error) {
	err := db.Create(assessmentResult).Error
	if err != nil {
		return nil, err
	}
	return assessmentResult, nil
}

func (repository *assessmentResultRepositoryImpl) Update(db *gorm.DB, assessmentResult *domain.AssessmentResult) (*domain.AssessmentResult, error) {
	err := db.Save(assessmentResult).Error
	if err != nil {
		return nil, err
	}
	return assessmentResult, nil
}

func (repository *assessmentResultRepositoryImpl) FindBySeamanCode(db *gorm.DB, seamanCode string) (*domain.AssessmentResult, error) {
	var assessmentResult domain.AssessmentResult
	err := db.Where("seaman_code = ?", seamanCode).First(&assessmentResult).Error
	if err != nil {
		return nil, err
	}
	return &assessmentResult, nil
}

func (repository *assessmentResultRepositoryImpl) FindByID(db *gorm.DB, id int) (*domain.AssessmentResult, error) {
	var assessmentResult domain.AssessmentResult
	err := db.Where("id = ?", id).First(&assessmentResult).Error
	if err != nil {
		return nil, err
	}
	return &assessmentResult, nil
}

func (repository *assessmentResultRepositoryImpl) Delete(db *gorm.DB, id int) error {
	err := db.Delete(&domain.AssessmentResult{}, id).Error
	return err
}