package repositories

import (
	"backend/internal/models/domain"

	"gorm.io/gorm"
)

type AssessmentRepository interface {
	FindByRole(db *gorm.DB, role string) (domain.Assessment, error)
	Update(db *gorm.DB, assessment *domain.Assessment) error
}

type assessmentRepositoryImpl struct {
}

func NewAssessmentRepository() AssessmentRepository {
	return &assessmentRepositoryImpl{}
}

func (repository *assessmentRepositoryImpl) FindByRole(db *gorm.DB, role string) (domain.Assessment, error) {
	var assessment domain.Assessment
	err := db.Where("role = ?", role).First(&assessment).Error
	return assessment, err
}

func (repository *assessmentRepositoryImpl) Update(db *gorm.DB, assessment *domain.Assessment) error {
	return db.Save(assessment).Error
}