package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type ReportRepository struct {
	Repository[domain.Report]
	Log *logrus.Logger
}

func NewReportRepository(log *logrus.Logger) *ReportRepository {
	return &ReportRepository{
		Log: log,
	}
}

func (r *ReportRepository) CreateAll(db *gorm.DB, reports *[]domain.Report) error {
	return db.Create(reports).Error
}
