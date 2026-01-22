package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type MutationCacheRepository struct {
	DB  *gorm.DB
	Log *logrus.Logger
}

func NewMutationCacheRepository(db *gorm.DB, log *logrus.Logger) *MutationCacheRepository {
	return &MutationCacheRepository{
		DB:  db,
		Log: log,
	}
}

func (r *MutationCacheRepository) TruncateAndBatchInsert(records []domain.MutationCache, batchSize int) error {
	tx := r.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// Count existing records before delete
	var oldCount int64
	tx.Model(&domain.MutationCache{}).Count(&oldCount)
	r.Log.Infof("      ↳ Deleting %d old records from mutation_cache...", oldCount)

	// Use DELETE instead of TRUNCATE to avoid blocking mysqldump backup
	if err := tx.Exec("DELETE FROM mutation_cache").Error; err != nil {
		tx.Rollback()
		return err
	}

	r.Log.Infof("      ↳ Inserting %d new records (batch size: %d)...", len(records), batchSize)
	if err := tx.CreateInBatches(records, batchSize).Error; err != nil {
		tx.Rollback()
		return err
	}

	return tx.Commit().Error
}

func (r *MutationCacheRepository) GetLast10BySeamanCode(seamanCode string) ([]domain.MutationCache, error) {
	var mutations []domain.MutationCache
	if err := r.DB.
		Where("seaman_code = ?", seamanCode).
		Order("transaction_date DESC").
		Limit(10).
		Find(&mutations).Error; err != nil {
		return nil, err
	}
	return mutations, nil
}

func (r *MutationCacheRepository) GetAllBySeamanCode(seamanCode string) ([]domain.MutationCache, error) {
	var mutations []domain.MutationCache
	if err := r.DB.
		Where("seaman_code = ?", seamanCode).
		Order("transaction_date DESC").
		Find(&mutations).Error; err != nil {
		return nil, err
	}
	return mutations, nil
}
