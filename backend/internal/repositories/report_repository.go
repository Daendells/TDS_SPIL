package repositories

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"

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

func (r *ReportRepository) SelectAll(db *gorm.DB, filter *web.DashboardRequest, reports *[]web.Report) error {
	return nil
}

func (r *ReportRepository) SelectWithFilter(db *gorm.DB, filter *web.DashboardRequest, reports *[]web.Report) error {
	query := `
		SELECT *
		FROM
			reports
		ORDER BY
			id ASC
	`

	if err := db.Raw(query).Scan(reports).Error; err != nil {
		return err
	}

	return nil
}
