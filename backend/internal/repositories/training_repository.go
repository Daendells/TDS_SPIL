package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type TrainingRepository struct {
	Repository[domain.Training]
	Log *logrus.Logger
}

func NewTrainingRepository(log *logrus.Logger) *TrainingRepository {
	return &TrainingRepository{Log: log}
}

func (r *TrainingRepository) FindAll(db *gorm.DB, trainings *[]domain.Training) error {
	return db.Preload("CompetencyType").Find(trainings).Error
}
