package repositories

import (
	"backend/internal/models/domain"
	"fmt"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type CoachingReportRepository interface {
	Create(coachingReport *domain.CoachingReport) error
	GetByID(id int64) (*domain.CoachingReport, error)
	GetAll() ([]domain.CoachingReport, error)
	Update(id int64, coachingReport *domain.CoachingReport) error
	Delete(id int64) error
	GetByReportID(reportID int64) ([]domain.CoachingReport, error)
}

type coachingReportRepository struct {
	db  *gorm.DB
	log *logrus.Logger
}

func NewCoachingReportRepository(db *gorm.DB, log *logrus.Logger) CoachingReportRepository {
	return &coachingReportRepository{
		db:  db,
		log: log,
	}
}

func (r *coachingReportRepository) Create(coachingReport *domain.CoachingReport) error {
	if err := r.db.Create(coachingReport).Error; err != nil {
		r.log.Errorf("Failed to create coaching report: %v", err)
		return err
	}
	return nil
}

func (r *coachingReportRepository) GetByID(id int64) (*domain.CoachingReport, error) {
	var coachingReport domain.CoachingReport
	if err := r.db.Where("id = ?", id).First(&coachingReport).Error; err != nil {
		r.log.Errorf("Failed to get coaching report by ID: %v", err)
		return nil, err
	}
	return &coachingReport, nil
}

func (r *coachingReportRepository) GetAll() ([]domain.CoachingReport, error) {
	var coachingReports []domain.CoachingReport
	if err := r.db.Find(&coachingReports).Error; err != nil {
		r.log.Errorf("Failed to get all coaching reports: %v", err)
		return nil, err
	}
	return coachingReports, nil
}

func (r *coachingReportRepository) Update(id int64, coachingReport *domain.CoachingReport) error {
	if err := r.db.Model(&domain.CoachingReport{}).Where("id = ?", id).Updates(coachingReport).Error; err != nil {
		r.log.Errorf("Failed to update coaching report: %v", err)
		return err
	}
	return nil
}

func (r *coachingReportRepository) Delete(id int64) error {
	if err := r.db.Where("id = ?", id).Delete(&domain.CoachingReport{}).Error; err != nil {
		r.log.Errorf("Failed to delete coaching report: %v", err)
		return err
	}
	return nil
}

func (r *coachingReportRepository) GetByReportID(reportID int64) ([]domain.CoachingReport, error) {
	var coachingReports []domain.CoachingReport
	reportIDStr := fmt.Sprintf("%d", reportID)
	
	query := `JSON_CONTAINS(report_ids, ?, '$')`
	if err := r.db.Where(query, reportIDStr).Find(&coachingReports).Error; err != nil {
		r.log.Errorf("Failed to get coaching reports by report ID: %v", err)
		return nil, err
	}
	return coachingReports, nil
}
