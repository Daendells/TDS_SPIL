package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type BatchSnapshotRepository struct {
	Log *logrus.Logger
}

func NewBatchSnapshotRepository(log *logrus.Logger) *BatchSnapshotRepository {
	return &BatchSnapshotRepository{Log: log}
}

// BulkCreate inserts a batch of snapshots in a single statement.
func (r *BatchSnapshotRepository) BulkCreate(db *gorm.DB, snapshots []domain.BatchReportSnapshot) error {
	if len(snapshots) == 0 {
		return nil
	}
	return db.CreateInBatches(snapshots, 100).Error
}

// FindByBatchID returns all snapshots for a given batch, ordered by seafarer name.
func (r *BatchSnapshotRepository) FindByBatchID(db *gorm.DB, batchID int) ([]domain.BatchReportSnapshot, error) {
	var snapshots []domain.BatchReportSnapshot
	err := db.Where("batch_id = ?", batchID).
		Order("nama asc").
		Find(&snapshots).Error
	return snapshots, err
}

// CountByBatchID returns the total number of snapshots for a batch.
func (r *BatchSnapshotRepository) CountByBatchID(db *gorm.DB, batchID int) (int, error) {
	var count int64
	err := db.Model(&domain.BatchReportSnapshot{}).Where("batch_id = ?", batchID).Count(&count).Error
	return int(count), err
}
