package repositories

import (
	"backend/internal/models/domain"
	"time"

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

func (r *BatchRepository) FindAll(db *gorm.DB, batchType string) ([]domain.Batch, error) {
	var batches []domain.Batch
	query := db.Order("batch_no desc")
	if batchType != "" {
		query = query.Where("type = ?", batchType)
	}
	err := query.Find(&batches).Error
	return batches, err
}

func (r *BatchRepository) FindLatest(db *gorm.DB) (*domain.Batch, error) {
	var batch domain.Batch
	err := db.Order("batch_no desc").First(&batch).Error
	return &batch, err
}

func (r *BatchRepository) FindByID(db *gorm.DB, id int) (*domain.Batch, error) {
	var batch domain.Batch
	err := db.Where("id = ?", id).First(&batch).Error
	if err != nil {
		return nil, err
	}
	return &batch, nil
}

func (r *BatchRepository) FindByBatchNo(db *gorm.DB, batchNo int) (*domain.Batch, error) {
	var batch domain.Batch
	err := db.Where("batch_no = ?", batchNo).First(&batch).Error
	if err != nil {
		return nil, err
	}
	return &batch, nil
}

// FindActivePastEndDate finds all batches that are still 'active' but their end_date is in the past.
// Used by the cron job to auto-close batches.
func (r *BatchRepository) FindActivePastEndDate(db *gorm.DB) ([]domain.Batch, error) {
	var batches []domain.Batch
	// Use DATE() to compare date-only, avoiding timezone/time-of-day mismatch.
	// Also use <= so a batch that ends TODAY is included.
	err := db.Where("status = ? AND DATE(end_date) <= DATE(?)", "active", time.Now()).Find(&batches).Error
	return batches, err
}

func (r *BatchRepository) Update(db *gorm.DB, batch *domain.Batch) error {
	return db.Save(batch).Error
}

func (r *BatchRepository) UpdateStatus(db *gorm.DB, id int, status string, snapshotAt *time.Time) error {
	updates := map[string]interface{}{
		"status":         status,
		"snapshotted_at": snapshotAt,
		"updated_at":     time.Now(),
	}
	return db.Model(&domain.Batch{}).Where("id = ?", id).Updates(updates).Error
}

// GetReportIDsForBatch returns all report IDs assigned to the given batch via the junction table.
func (r *BatchRepository) GetReportIDsForBatch(db *gorm.DB, batchID int) ([]int, error) {
	var ids []int
	err := db.Table("report_batches").Where("batch_id = ?", batchID).Pluck("report_id", &ids).Error
	return ids, err
}

// GetReportCountForBatch returns the count of reports assigned to the given batch.
func (r *BatchRepository) GetReportCountForBatch(db *gorm.DB, batchID int) (int, error) {
	var count int64
	err := db.Table("report_batches").Where("batch_id = ?", batchID).Count(&count).Error
	return int(count), err
}
