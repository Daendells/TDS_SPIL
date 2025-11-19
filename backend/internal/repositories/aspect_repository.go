package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type AspectRepository struct {
	Repository[domain.Aspect]
	Log *logrus.Logger
}

func NewAspectRepository(log *logrus.Logger) *AspectRepository {
	return &AspectRepository{
		Log: log,
	}
}

func (r *AspectRepository) Create(db *gorm.DB, aspect *domain.Aspect) error {
	return db.Create(aspect).Error
}

func (r *AspectRepository) Update(db *gorm.DB, aspect *domain.Aspect) error {
	return db.Save(aspect).Error
}

func (r *AspectRepository) Delete(db *gorm.DB, aspect *domain.Aspect) error {
	return db.Delete(aspect).Error
}

func (r *AspectRepository) FindByID(db *gorm.DB, id int) (*domain.Aspect, error) {
	var aspect domain.Aspect
	err := db.Where("id = ?", id).First(&aspect).Error
	if err != nil {
		return nil, err
	}
	return &aspect, nil
}

func (r *AspectRepository) FindAll(db *gorm.DB) ([]domain.Aspect, error) {
	var aspects []domain.Aspect
	err := db.Order("id ASC").Find(&aspects).Error
	if err != nil {
		return nil, err
	}
	return aspects, nil
}

func (r *AspectRepository) FindByAssessmentID(db *gorm.DB, assessmentID int) ([]domain.Aspect, error) {
	var aspects []domain.Aspect
	err := db.Where("assessment_id = ?", assessmentID).Order("id ASC").Find(&aspects).Error
	if err != nil {
		return nil, err
	}
	return aspects, nil
}

func (r *AspectRepository) FindByQuestionID(db *gorm.DB, questionID int) (*domain.Aspect, error) {
	var aspect domain.Aspect
	err := db.Where("question_id = ?", questionID).First(&aspect).Error
	if err != nil {
		return nil, err
	}
	return &aspect, nil
}
