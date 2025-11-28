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
	// Manual upsert: check if record exists by seaman_code, then update or insert
	// Process in batches to avoid performance issues
	batchSize := 50

	for i := 0; i < len(*reports); i += batchSize {
		end := i + batchSize
		if end > len(*reports) {
			end = len(*reports)
		}

		batch := (*reports)[i:end]

		// Process each report in the batch
		for _, report := range batch {
			// Check if record with this seaman_code exists
			var existing domain.Report
			err := db.Where("seaman_code = ?", report.SeamanCode).First(&existing).Error

			if err == nil {
				// Record exists, update it
				report.ID = existing.ID               // Keep the same ID
				report.CreatedAt = existing.CreatedAt // Keep original creation time

				// Use Updates instead of Save to ensure all fields are updated
				// This explicitly updates all the fields from the Excel import
				updateData := map[string]interface{}{
					"seafarer_code":                 report.SeafarerCode,
					"nama":                          report.Nama,
					"jabatan":                       report.Jabatan,
					"vessel_name":                   report.VesselName,
					"certificate":                   report.Certificate,
					"age":                           report.Age,
					"tanggal_lahir":                 report.TanggalLahir,
					"kondite_review":                report.KonditeReview,
					"kpi_vessel":                    report.KpiVessel,
					"performance_score":             report.PerformanceScore,
					"value_assessment":              report.ValueAssessment,
					"competency_gap_analysis":       report.CompetencyGapAnalysis,
					"total_gap":                     report.TotalGap,
					"strength":                      report.Strength,
					"idp_program":                   report.IDPProgram,
					"hav_quadran2":                  report.HavQuadran2,
					"talent_classified2":            report.TalentClassified2,
					"readiness":                     report.Readiness,
					"readiness_month":               report.ReadinessMonth,
					"certificate_eligible":          report.CertificateEligible,
					"education_fulfillment_months":  report.EducationFulfillmentMonths,
					"total_readiness_update_months": report.TotalReadinessUpdateMonths,
				}

				if err := db.Model(&domain.Report{}).Where("id = ?", existing.ID).Updates(updateData).Error; err != nil {
					return err
				}
			} else {
				// Record doesn't exist, create new
				if err := db.Create(&report).Error; err != nil {
					return err
				}
			}
		}
	}

	return nil
}

// GetMinTotalReadinessMonths returns the minimum total_readiness_update_months
// for active participants (readiness_month > 0) in a specific program
func (r *ReportRepository) GetMinTotalReadinessMonths(db *gorm.DB, program string) (int, error) {
	var result struct {
		MinMonths int
	}

	err := db.Raw(`
		SELECT COALESCE(MIN(total_readiness_update_months), 0) as min_months 
		FROM reports 
		WHERE idp_program = ? 
		AND readiness_month > 0 
		AND total_readiness_update_months IS NOT NULL
	`, program).Scan(&result).Error

	if err != nil {
		return 0, err
	}

	return result.MinMonths, nil
}

func (r *ReportRepository) SelectAll(db *gorm.DB, filter *web.DashboardRequest, reports *[]domain.Report) error {
	var queryBuilder strings.Builder
	var args []interface{}

	// Base Query
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

	// Finalize query
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

func (r *ReportRepository) FindBySeamanCode(db *gorm.DB, seamanCode string, report *domain.Report) error {
	return db.Where("seaman_code = ?", seamanCode).First(report).Error
}

func (r *ReportRepository) FindBySeafarerCode(db *gorm.DB, seafarerCode string, report *domain.Report) (domain.Report, error) {
	err := db.Where("seafarer_code = ?", seafarerCode).First(report).Error
	return *report, err
}

func (r *ReportRepository) Update(db *gorm.DB, report *domain.Report) error {
	return db.Save(report).Error
}

// GetMinimumReadinessDeadline returns the minimum total_readiness_update_months
// for active participants (readiness_month > 0) in a specific program
func (r *ReportRepository) GetMinimumReadinessDeadline(db *gorm.DB, program string) (int, error) {
	var result struct {
		MinMonths int
	}

	err := db.Raw(`
		SELECT COALESCE(MIN(total_readiness_update_months), 0) as min_months
		FROM reports
		WHERE idp_program = ?
		AND readiness_month > 0
		AND total_readiness_update_months IS NOT NULL
	`, program).Scan(&result).Error

	if err != nil {
		return 0, err
	}

	return result.MinMonths, nil
}
