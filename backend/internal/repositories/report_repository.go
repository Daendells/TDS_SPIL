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

func (r *ReportRepository) SelectAll(db *gorm.DB, filter *web.DashboardRequest, reports *[]domain.Report) error {
	return nil
}

func (r *ReportRepository) SelectWithFilter(db *gorm.DB, filter *web.DashboardRequest, reports *[]domain.Report) error {
	var query string
	// var anchorId int

	if filter.Page == "next" {
		//! Query Next
		query = `
			SELECT *
			FROM
				reports
			WHERE id > ?
			ORDER BY
				id ASC
			LIMIT ?
		`
	} else {
		//! Query Prev
		query = `
			SELECT *
			FROM
				reports
			WHERE id < ?
			ORDER BY
				id DESC
			LIMIT ?
		`
	}

	if err := db.Raw(query, filter.AnchorID, filter.PageSize+1).Scan(reports).Error; err != nil {
		return err
	}

	return nil
}
