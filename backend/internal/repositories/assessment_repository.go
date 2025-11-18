package repositories

import (
	"backend/internal/models/domain"

	"gorm.io/gorm"
)

type AssessmentRepository interface {
	FindByRole(db *gorm.DB, role string) (domain.Assessment, error)
	Update(db *gorm.DB, assessment *domain.Assessment) error
	Create(db *gorm.DB, assessment *domain.Assessment) error
	FindAll(db *gorm.DB) ([]domain.Assessment, error)
	Delete(db *gorm.DB, id uint64) error
	ExistsByRole(db *gorm.DB, role string) bool
}

type assessmentRepositoryImpl struct {
}

func NewAssessmentRepository() AssessmentRepository {
	return &assessmentRepositoryImpl{}
}

func (repository *assessmentRepositoryImpl) FindByRole(db *gorm.DB, role string) (domain.Assessment, error) {
	var assessment domain.Assessment
	// Get the latest record for the role (highest ID)
	err := db.Where("role = ?", role).Order("id DESC").First(&assessment).Error
	return assessment, err
}

func (repository *assessmentRepositoryImpl) ExistsByRole(db *gorm.DB, role string) bool {
	var count int64
	db.Model(&domain.Assessment{}).Where("role = ?", role).Count(&count)
	return count > 0
}

func (repository *assessmentRepositoryImpl) Update(db *gorm.DB, assessment *domain.Assessment) error {
	return db.Save(assessment).Error
}

func (repository *assessmentRepositoryImpl) Create(db *gorm.DB, assessment *domain.Assessment) error {
	return db.Create(assessment).Error
}

func (repository *assessmentRepositoryImpl) FindAll(db *gorm.DB) ([]domain.Assessment, error) {
	var assessments []domain.Assessment
	err := db.Find(&assessments).Error
	return assessments, err
}

func (repository *assessmentRepositoryImpl) Delete(db *gorm.DB, id uint64) error {
	return db.Delete(&domain.Assessment{}, id).Error
}
