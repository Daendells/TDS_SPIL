package repositories

import (
	"backend/internal/models/domain"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type IDPTrackingRepository interface {
	GetByReportAndMonth(reportID int, month time.Time) (*domain.IDPTracking, error)
	Create(tracking *domain.IDPTracking) error
	Update(tracking *domain.IDPTracking) error
	Upsert(tracking *domain.IDPTracking) error
	GetByReport(reportID int) ([]domain.IDPTracking, error)
	GetLatestByReport(reportID int) (*domain.IDPTracking, error)
	GetAllForMonth(month time.Time) ([]domain.IDPTracking, error)
	GetAllActiveReports() ([]int, error) // Returns list of report IDs with readiness_month > 0
}

type idpTrackingRepository struct {
	db  *gorm.DB
	log *logrus.Logger
}

func NewIDPTrackingRepository(db *gorm.DB, log *logrus.Logger) IDPTrackingRepository {
	return &idpTrackingRepository{
		db:  db,
		log: log,
	}
}

func (r *idpTrackingRepository) GetByReportAndMonth(reportID int, month time.Time) (*domain.IDPTracking, error) {
	// Normalize month to first day of month
	normalized := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.UTC)
	
	var tracking domain.IDPTracking
	err := r.db.Where("report_id = ? AND month = ?", reportID, normalized).
		Preload("Report").
		First(&tracking).Error
	
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &tracking, err
}

func (r *idpTrackingRepository) Create(tracking *domain.IDPTracking) error {
	// Normalize month to first day
	tracking.Month = time.Date(tracking.Month.Year(), tracking.Month.Month(), 1, 0, 0, 0, 0, time.UTC)
	return r.db.Create(tracking).Error
}

func (r *idpTrackingRepository) Update(tracking *domain.IDPTracking) error {
	return r.db.Save(tracking).Error
}

func (r *idpTrackingRepository) Upsert(tracking *domain.IDPTracking) error {
	tracking.Month = time.Date(tracking.Month.Year(), tracking.Month.Month(), 1, 0, 0, 0, 0, time.UTC)
	
	existing, err := r.GetByReportAndMonth(tracking.ReportID, tracking.Month)
	if err != nil && err != gorm.ErrRecordNotFound {
		return err
	}
	
	if existing != nil {
		tracking.ID = existing.ID
		tracking.CreatedAt = existing.CreatedAt
		r.log.Infof("Updating existing idp_tracking ID=%d for report_id=%d, month=%s", existing.ID, tracking.ReportID, tracking.Month.Format("2006-01"))
		return r.db.Save(tracking).Error
	}
	
	r.log.Infof("Creating new idp_tracking for report_id=%d, month=%s", tracking.ReportID, tracking.Month.Format("2006-01"))
	return r.db.Create(tracking).Error
}

func (r *idpTrackingRepository) GetByReport(reportID int) ([]domain.IDPTracking, error) {
	var trackings []domain.IDPTracking
	err := r.db.Where("report_id = ?", reportID).
		Order("month DESC").
		Find(&trackings).Error
	return trackings, err
}

func (r *idpTrackingRepository) GetLatestByReport(reportID int) (*domain.IDPTracking, error) {
	var tracking domain.IDPTracking
	err := r.db.Where("report_id = ?", reportID).
		Order("month DESC").
		First(&tracking).Error
	
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &tracking, err
}

func (r *idpTrackingRepository) GetAllForMonth(month time.Time) ([]domain.IDPTracking, error) {
	normalized := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.UTC)
	
	var trackings []domain.IDPTracking
	err := r.db.Where("month = ?", normalized).
		Preload("Report").
		Find(&trackings).Error
	return trackings, err
}

func (r *idpTrackingRepository) GetAllActiveReports() ([]int, error) {
	var reportIDs []int
	err := r.db.Table("reports").
		Where("readiness_month > 0").
		Pluck("id", &reportIDs).Error
	return reportIDs, err
}
