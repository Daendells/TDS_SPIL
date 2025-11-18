package repositories

import (
	"backend/internal/models/domain"

	"gorm.io/gorm"
)

type QuestionRepository interface {
	Create(db *gorm.DB, question *domain.Question) error
	FindAll(db *gorm.DB) ([]domain.Question, error)
	FindById(db *gorm.DB, questionId int) (domain.Question, error)
	FindByRole(db *gorm.DB, role string) ([]domain.Question, error)
	FindByAssessmentId(db *gorm.DB, assessmentId uint64) ([]domain.Question, error)
	Update(db *gorm.DB, question *domain.Question) error
	Delete(db *gorm.DB, questionId int) error
	BulkDelete(db *gorm.DB, questionIds []int) error
	BulkUpdateAspect(db *gorm.DB, questionIds []int, aspectId *int64) error
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

func (repository *questionRepositoryImpl) FindByRole(db *gorm.DB, role string) ([]domain.Question, error) {
	var questions []domain.Question
	err := db.Where("role = ?", role).Find(&questions).Error
	return questions, err
}

func (repository *questionRepositoryImpl) FindByAssessmentId(db *gorm.DB, assessmentId uint64) ([]domain.Question, error) {
	var questions []domain.Question
	err := db.Where("assessment_id = ?", assessmentId).Find(&questions).Error
	return questions, err
}

func (repository *questionRepositoryImpl) Update(db *gorm.DB, question *domain.Question) error {
	return db.Save(question).Error
}

func (repository *questionRepositoryImpl) Delete(db *gorm.DB, questionId int) error {
	return db.Where("question_id = ?", questionId).Delete(&domain.Question{}).Error
}

func (repository *questionRepositoryImpl) BulkDelete(db *gorm.DB, questionIds []int) error {
	return db.Where("question_id IN ?", questionIds).Delete(&domain.Question{}).Error
}

func (repository *questionRepositoryImpl) BulkUpdateAspect(db *gorm.DB, questionIds []int, aspectId *int64) error {
	return db.Model(&domain.Question{}).Where("question_id IN ?", questionIds).Update("aspect_id", aspectId).Error
}
