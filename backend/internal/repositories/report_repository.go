package repositories

import (
	"strings"

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
	// var query string
	var queryBuilder strings.Builder
	var args []interface{}

	// TODO: Make Base Query
	queryBuilder.WriteString("SELECT * FROM reports WHERE ")

	// Page Condition
	var anchorCondition string
	if filter.Page == "next" {
		anchorCondition = "id > ?"
	} else {
		anchorCondition = "id < ?"
	}
	queryBuilder.WriteString(anchorCondition)
	args = append(args, filter.AnchorID)

	// Optional Filter
	if filter.Filter != "" {
		queryBuilder.WriteString(" AND idp_program = ?")
		args = append(args, filter.Filter)
	}

	// Order + limit
	var orderCondition string
	if filter.Page == "next" {
		orderCondition = " ORDER BY id ASC LIMIT ?"
	} else {
		orderCondition = " ORDER BY id DESC LIMIT ?"
	}
	queryBuilder.WriteString(orderCondition)
	args = append(args, filter.PageSize+1)

	// TODO: Finalize query
	query := queryBuilder.String()

	if err := db.Raw(query, args...).Scan(reports).Error; err != nil {
		return err
	}

	return nil
}

func (r *ReportRepository) IDPCount(db *gorm.DB, data *web.IDPCountData) error {
	query := `
		SELECT 
			SUM(CASE WHEN idp_program = 'MDP' THEN 1 ELSE 0 END) as mdp,
			SUM(CASE WHEN idp_program = 'FDP' THEN 1 ELSE 0 END) as fdp,
			SUM(CASE WHEN idp_program = 'SDP' THEN 1 ELSE 0 END) as sdp
		FROM reports
	`

	if err := db.Raw(query).Scan(data).Error; err != nil {
		return err
	}

	return nil
}
