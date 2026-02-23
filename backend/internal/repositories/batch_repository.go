package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type BatchRepository struct {
	Repository[domain.Batch]
	Log *logrus.Logger
}

func NewBatchRepository(log *logrus.Logger) *BatchRepository {
	return &BatchRepository{
		Log: log,
	}
}

func (r *BatchRepository) Create(db *gorm.DB, batch *domain.Batch) error {
	return db.Create(batch).Error
}

func (r *BatchRepository) FindAll(db *gorm.DB) ([]domain.Batch, error) {
	var batches []domain.Batch
	err := db.Order("batch_no desc").Find(&batches).Error
	return batches, err
}

func (r *BatchRepository) FindLatest(db *gorm.DB) (*domain.Batch, error) {
	var batch domain.Batch
	err := db.Order("batch_no desc").First(&batch).Error
	return &batch, err
}
