package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type MasterRepository struct {
	Log *logrus.Logger
}

func NewMasterRepository(log *logrus.Logger) *MasterRepository {
	return &MasterRepository{Log: log}
}

// Get all master reports
func (r *MasterRepository) FindAll(db *gorm.DB, masters *[]domain.MasterReport) error {
	return db.
		Preload("GapCompetencies").
		Preload("GapCompetencies.CompetencyType").
		Find(masters).Error
}

// Get one by ID
func (r *MasterRepository) FindById(db *gorm.DB, master *domain.FullReport, id uint) error {
	return db.
		Preload("GapCompetencies").
		Preload("GapCompetencies.CompetencyType").
		First(master, id).Error
}

// Create new master report
func (r *MasterRepository) Create(db *gorm.DB, master *domain.FullReport) error {
	return db.Create(master).Error
}

// Update existing master report
func (r *MasterRepository) Update(db *gorm.DB, report *domain.FullReport) error {
	if err := db.Save(report).Error; err != nil {
		r.Log.WithError(err).Warn("failed to update master report")
		return err
	}
	return nil
}

// Delete master report
func (r *MasterRepository) Delete(db *gorm.DB, master *domain.FullReport) error {
	return db.Delete(master).Error
}

// BulkAssignBatch assigns reports to a batch via the report_batches junction table.
// Also keeps reports.batch_id in sync for backward-compatible filtering.
func (r *MasterRepository) BulkAssignBatch(db *gorm.DB, reportIDs []uint, batchID *int) error {
	if batchID == nil {
		// Clear assignment: remove from junction table
		return db.Where("report_id IN ?", reportIDs).Delete(&domain.ReportBatch{}).Error
	}
	// Insert into junction table (ignore duplicates)
	rows := make([]domain.ReportBatch, 0, len(reportIDs))
	for _, rid := range reportIDs {
		rows = append(rows, domain.ReportBatch{
			ReportID: int(rid),
			BatchID:  *batchID,
		})
	}
	if err := db.Clauses(clause.OnConflict{DoNothing: true}).Create(&rows).Error; err != nil {
		return err
	}
	// Keep reports.batch_id in sync for existing queries
	return db.Model(&domain.FullReport{}).Where("id IN ?", reportIDs).Update("batch_id", batchID).Error
}

// BulkAssignBatchAll assigns ALL reports matching the given filters to a batch.
// Used when the user selects "Pilih semua" (global select-all) across all pages.
func (r *MasterRepository) BulkAssignBatchAll(db *gorm.DB, batchID *int, query string, filterBatchID *int) error {
	q := db.Model(&domain.FullReport{}).Select("id")

	if query != "" {
		q = q.Where("nama LIKE ? OR seafarer_code LIKE ?", "%"+query+"%", "%"+query+"%")
	}

	if filterBatchID != nil {
		if *filterBatchID == -1 {
			q = q.Where("batch_id IS NULL")
		} else if *filterBatchID > 0 {
			q = q.Joins("JOIN report_batches rb ON rb.report_id = reports.id AND rb.batch_id = ?", *filterBatchID)
		}
	}

	var reportIDs []uint
	if err := q.Pluck("reports.id", &reportIDs).Error; err != nil {
		return err
	}
	if len(reportIDs) == 0 {
		return nil
	}
	return r.BulkAssignBatch(db, reportIDs, batchID)
}
