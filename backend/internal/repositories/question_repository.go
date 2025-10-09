package repositories

import (
	"backend/internal/models/domain"

	"gorm.io/gorm"
)

type QuestionRepository interface {
	Create(db *gorm.DB, question *domain.Question) error
	FindAll(db *gorm.DB) ([]domain.Question, error)
	FindById(db *gorm.DB, questionId int) (domain.Question, error)
	Update(db *gorm.DB, question *domain.Question) error
	Delete(db *gorm.DB, questionId int) error
}

type questionRepositoryImpl struct {
}

func NewQuestionRepository() QuestionRepository {
	return &questionRepositoryImpl{}
}

func (repository *questionRepositoryImpl) Create(db *gorm.DB, question *domain.Question) error {
	return db.Create(question).Error
}

func (repository *questionRepositoryImpl) FindAll(db *gorm.DB) ([]domain.Question, error) {
	var questions []domain.Question
	err := db.Find(&questions).Error
	return questions, err
}

func (repository *questionRepositoryImpl) FindById(db *gorm.DB, questionId int) (domain.Question, error) {
	var question domain.Question
	err := db.Where("question_id = ?", questionId).First(&question).Error
	return question, err
}

func (repository *questionRepositoryImpl) Update(db *gorm.DB, question *domain.Question) error {
	return db.Save(question).Error
}

func (repository *questionRepositoryImpl) Delete(db *gorm.DB, questionId int) error {
	return db.Where("question_id = ?", questionId).Delete(&domain.Question{}).Error
}
