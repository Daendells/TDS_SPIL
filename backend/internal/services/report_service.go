package services

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"backend/internal/helpers"
	"backend/internal/models/converter"
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/go-playground/validator/v10"
	"github.com/sirupsen/logrus"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type ReportService struct {
	DB                      *gorm.DB
	Log                     *logrus.Logger
	Validate                *validator.Validate
	ReportRepository        *repositories.ReportRepository
	GapCompetencyRepository repositories.GapCompetencyRepository
}

func NewReportService(db *gorm.DB, log *logrus.Logger, validate *validator.Validate, reportRepository *repositories.ReportRepository, gapCompetencyRepository repositories.GapCompetencyRepository) *ReportService {
	return &ReportService{
		DB:                      db,
		Log:                     log,
		Validate:                validate,
		ReportRepository:        reportRepository,
		GapCompetencyRepository: gapCompetencyRepository,
	}
}

func (service *ReportService) FindAll(ctx context.Context, request *web.DashboardRequest) (*web.SuccessResponse, error) {
	// TODO: Create Transaction
	tx := service.DB.WithContext(ctx).Begin()
	defer tx.Rollback()

	var reports []domain.Report

	err := service.ReportRepository.SelectAll(tx, request, &reports)
	if err != nil {
		return nil, err
	}

	// TODO: If empty, return empty array and set first_id and last_id equal to null
	if len(reports) == 0 {
		return &web.SuccessResponse{
			Status: "Ok",
			Code:   http.StatusOK,
			Data: map[string]interface{}{
				"reports":    []domain.Report{},
				"first_id":   nil,
				"last_id":    nil,
				"page_size":  request.PageSize,
				"has_more":   false,
				"first_page": true,
			},
		}, nil
	}

	// TODO: Init response
	reportData := converter.ToReportDataList(&reports)
	hasMore := false
	isFirstPage := false

	// //! If for prev, we need to reverse the reports
	if request.Page == "prev" {
		if len(reportData) > request.PageSize {
			isFirstPage = false // Kalau ada lebih, pasti bukan first page
			reportData = reportData[:request.PageSize]
		} else {
			isFirstPage = true
		}

		// Untuk prev, hasil query DESC lalu dibalik biar tetap ASC
		helpers.Reverse(&reportData)
		hasMore = true // Karena page sekarang akan jadi page selanjutnya, jadi pasti TRUE
	} else {
		//! Next
		if len(reportData) > request.PageSize {
			hasMore = true
			reportData = reportData[:request.PageSize]
		}

		if request.AnchorID == 0 {
			isFirstPage = true // 0 digunakan untuk menampilkan page pertama
		} else {
			isFirstPage = false // Karena page sekarang pasti jadi page sebelumya, jadi pasti FALSE
		}
	}

	firstId := reportData[0].ID
	lastId := reportData[len(reportData)-1].ID

	return &web.SuccessResponse{
		Status: "Ok",
		Code:   http.StatusOK,
		Data: map[string]interface{}{
			"results":    reportData,
			"first_id":   firstId,
			"last_id":    lastId,
			"page_size":  request.PageSize,
			"has_more":   hasMore,
			"first_page": isFirstPage,
		},
	}, nil
}

func (service *ReportService) CreateAll(ctx context.Context, request *web.ReportRequest) (*web.SuccessResponse, error) {
	// TODO: Create Transaction
	tx := service.DB.WithContext(ctx).Begin()
	defer tx.Rollback() // Rollback just in case

	// TODO: Validate the request
	err := service.Validate.Struct(request)
	if err != nil {
		service.Log.Warnf("Invalid request body: %+v", err)
		return nil, fmt.Errorf("invalid request body: %w", err)
	}

	// TODO: Read Excel
	file, err := request.File.Open()
	if err != nil {
		service.Log.Warnf("Cannot open the file: %+v", err)
		return nil, fmt.Errorf("cannot open the file: %w", err)
	}
	defer file.Close()

	// TODO: Parse The Excel File from io.Reader
	excel, err := excelize.OpenReader(file)
	if err != nil {
		service.Log.Warnf("Cannot open the excel: %+v", err)
		return nil, fmt.Errorf("cannot open the excel: %w", err)
	}
	defer excel.Close()

	// TODO: Get the Sheet and the rows
	rows, err := excel.GetRows("Sheet1")
	if err != nil {
		service.Log.Warnf("Cannot get the rows: %+v", err)
		return nil, fmt.Errorf("cannot open the rows: %w", err)
	}

	var reports []domain.Report

	for i, row := range rows {
		// Skip the header
		if i == 0 {
			continue
		}

		// Parse all columns from Excel - Following the correct column order from the image
		// A=0: No. (skip)
		// B=1: Vessel Name
		// C=2: Name
		// D=3: Position
		// E=4: Seaman Code
		// F=5: Seafarer Code
		// G=6: Certificate
		// H=7: Age
		// I=8: Value Assessment
		// N=13: Competency Gap Analysis
		// O=14: TOTAL GAP
		// Q=16: Certificate Eligible
		// S=18: Program

		vesselName := helpers.SanitizeCell(helpers.GetCell(row, 1))
		nama := helpers.SanitizeCell(helpers.GetCell(row, 2))
		jabatan := helpers.SanitizeCell(helpers.GetCell(row, 3))
		seamanCode := helpers.SanitizeCell(helpers.GetCell(row, 4))
		seafarerCode := helpers.SanitizeCell(helpers.GetCell(row, 5))
		certificate := helpers.SanitizeCell(helpers.GetCell(row, 6))
		age := helpers.SanitizeCell(helpers.GetCell(row, 7))
		valueAssessmentStr := helpers.SanitizeCell(helpers.GetCell(row, 8))
		competencyGapAnalysis := helpers.SanitizeCell(helpers.GetCell(row, 13))
		totalGapStr := helpers.SanitizeCell(helpers.GetCell(row, 14))
		certificateEligible := helpers.SanitizeCell(helpers.GetCell(row, 16))
		idpProgram := helpers.SanitizeCell(helpers.GetCell(row, 18))

		// Convert string values to integers with proper error handling
		totalGap, _ := strconv.Atoi(totalGapStr)
		valueAssessment, _ := strconv.Atoi(valueAssessmentStr)

		// Fields not in Excel - set to default values
		// (No additional default fields needed based on the Excel structure)

		// Check if report already exists by seafarerCode
		var existingReport domain.Report
		_, findErr := service.ReportRepository.FindBySeafarerCode(tx, seafarerCode, &existingReport)

		var report domain.Report
		isUpdate := findErr == nil

		if isUpdate {
			// Update existing report - keep the ID and timestamps
			report = existingReport
			service.Log.Infof("Row %d - Updating existing report ID=%d for Seafarer Code: %s", i, existingReport.ID, seafarerCode)
		} else {
			// New report
			service.Log.Infof("Row %d - Creating new report for Seafarer Code: %s", i, seafarerCode)
		}

		// Update all fields from Excel
		report.SeamanCode = seamanCode
		report.SeafarerCode = seafarerCode
		report.Nama = nama
		report.Jabatan = jabatan
		report.VesselName = vesselName
		report.Certificate = certificate
		report.Age = age
		report.ValueAssessment = valueAssessment
		report.CompetencyGapAnalysis = competencyGapAnalysis
		report.TotalGap = totalGap
		report.CertificateEligible = certificateEligible
		report.IDPProgram = idpProgram

		// Calculate readiness-related fields based on logic
		// If not updating, set default readiness values
		if !isUpdate {
			// For new reports, set default readiness to "Ready Now"
			report.Readiness = "Ready Now"
			zeroMonths := 0
			report.ReadinessMonth = &zeroMonths
		}

		// Calculate education_fulfillment_months based on certificate + idp_program
		educationMonths := service.calculateEducationFulfillmentMonths(certificate, idpProgram)
		report.EducationFulfillmentMonths = &educationMonths

		// Calculate total_readiness_update_months
		readinessMonthValue := 0
		if report.ReadinessMonth != nil {
			readinessMonthValue = *report.ReadinessMonth
		}
		totalReadinessMonths := readinessMonthValue + educationMonths
		report.TotalReadinessUpdateMonths = &totalReadinessMonths

		// Log first 3 records for debugging
		if i <= 3 {
			service.Log.Infof("Row %d - Name: %s, Vessel: %s, Seaman: %s, Seafarer: %s, Position: %s, ValueAssessment: %d, IsUpdate: %v",
				i, nama, vesselName, seamanCode, seafarerCode, jabatan, valueAssessment, isUpdate)
		}

		// Save or Update the report
		if isUpdate {
			if err = service.ReportRepository.Update(tx, &report); err != nil {
				service.Log.Warnf("Failed updating report for seafarer %s: %+v", seafarerCode, err)
				return nil, fmt.Errorf("failed updating report: %w", err)
			}
			service.Log.Infof("Successfully updated report ID=%d for seafarer: %s", report.ID, seafarerCode)
		} else {
			if err = tx.Create(&report).Error; err != nil {
				service.Log.Warnf("Failed creating report for seafarer %s: %+v", seafarerCode, err)
				return nil, fmt.Errorf("failed creating report: %w", err)
			}
			service.Log.Infof("Successfully created report ID=%d for seafarer: %s", report.ID, seafarerCode)
		}

		reports = append(reports, report)
	}

	service.Log.Infof("Total reports processed: %d", len(reports))

	// TODO: Save Value Assessment scores to report_scores table
	if err = service.saveValueAssessmentScores(tx, &reports); err != nil {
		service.Log.Warnf("Failed saving value assessment scores: %+v", err)
		return nil, fmt.Errorf("failed saving value assessment scores: %w", err)
	}

	// TODO: Process Gap Competencies from CompetencyGapAnalysis field
	if err = service.processGapCompetencies(tx, &reports); err != nil {
		service.Log.Warnf("Failed processing gap competencies: %+v", err)
		return nil, fmt.Errorf("failed processing gap compWetencies: %w", err)
	}

	// TODO: Commit Transaction
	if err = tx.Commit().Error; err != nil {
		service.Log.Warnf("Failed commit transaction: %+v", err)
		return nil, fmt.Errorf("failed commit transaction: %w", err)
	}

	service.Log.Info("Reports created successfully")

	return &web.SuccessResponse{
		Code:   http.StatusCreated,
		Status: "Created",
		Data:   "Reports Created Successfully",
	}, nil
}

func (service *ReportService) IDPCount(ctx context.Context) (*web.SuccessResponse, error) {
	// TODO: Create Transaction
	tx := service.DB.WithContext(ctx).Begin()
	defer tx.Rollback()

	// TODO: Get IDP Count
	var data web.IDPCountData
	err := service.ReportRepository.IDPCount(tx, &data)
	if err != nil {
		return nil, err
	}

	// TODO: Commit Transaction
	if err = tx.Commit().Error; err != nil {
		service.Log.Warnf("Failed commit transaction: %+v", err)
		return nil, fmt.Errorf("failed commit transaction: %w", err)
	}

	return &web.SuccessResponse{
		Status: "Ok",
		Code:   http.StatusOK,
		Data:   data,
	}, nil
}

func (service *ReportService) FindBySeamanCode(ctx context.Context, seamanCode string) (*web.SuccessResponse, error) {
	// TODO: Create Transaction
	tx := service.DB.WithContext(ctx).Begin()
	defer tx.Rollback()

	var report domain.Report
	err := service.ReportRepository.FindBySeamanCode(tx, seamanCode, &report)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("seaman code not found")
		}
		return nil, err
	}

	// TODO: Commit Transaction
	if err = tx.Commit().Error; err != nil {
		service.Log.Warnf("Failed commit transaction: %+v", err)
		return nil, fmt.Errorf("failed commit transaction: %w", err)
	}

	reportData := converter.ToReportData(&report)

	return &web.SuccessResponse{
		Status: "Ok",
		Code:   http.StatusOK,
		Data:   reportData,
	}, nil
}

func (service *ReportService) FindBySeafarerCode(ctx context.Context, seafarerCode string) (*web.SuccessResponse, error) {
	// TODO: Create Transaction
	tx := service.DB.WithContext(ctx).Begin()
	defer tx.Rollback()

	var report domain.Report
	_, err := service.ReportRepository.FindBySeafarerCode(tx, seafarerCode, &report)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("seafarer code not found")
		}
		return nil, err
	}

	// TODO: Commit Transaction
	if err = tx.Commit().Error; err != nil {
		service.Log.Warnf("Failed commit transaction: %+v", err)
		return nil, fmt.Errorf("failed commit transaction: %w", err)
	}

	reportData := converter.ToReportData(&report)

	// Get value assessment score from report_scores table
	reportData.ValueAssessmentScore = service.getValueAssessmentScore(service.DB, seafarerCode)

	return &web.SuccessResponse{
		Status: "Ok",
		Code:   http.StatusOK,
		Data:   reportData,
	}, nil
}

// getValueAssessmentScore retrieves the value assessment score from report_scores table
func (service *ReportService) getValueAssessmentScore(db *gorm.DB, seafarerCode string) int {
	service.Log.Infof("=== START getValueAssessmentScore for seafarer: %s ===", seafarerCode)

	// First, find the report for this seafarer
	var reportModel domain.Report
	report, reportErr := service.ReportRepository.FindBySeafarerCode(db, seafarerCode, &reportModel)
	if reportErr != nil {
		// If report not found, return 0
		service.Log.Warnf("❌ Report not found for seafarer %s, error: %v, returning 0", seafarerCode, reportErr)
		return 0
	}
	service.Log.Infof("✅ Found report for seafarer %s: report.ID=%d, report.ValueAssessment=%d", seafarerCode, report.ID, report.ValueAssessment)

	// Get Value Assessment type ID
	var assessmentType domain.AssessmentType
	typeErr := db.Where("assessment_type_name = ?", "Value Assessment").First(&assessmentType).Error
	if typeErr != nil {
		// If assessment type not found, try to get from reports table
		service.Log.Warnf("❌ Value Assessment type not found, error: %v. Using fallback from reports table. Score: %d", typeErr, report.ValueAssessment)
		return report.ValueAssessment
	}
	service.Log.Infof("✅ Found Value Assessment type: ID=%d, Name=%s", assessmentType.ID, assessmentType.AssessmentTypeName)

	// Get the score from report_scores table
	var reportScore domain.ReportScore
	scoreErr := db.Where("report_id = ? AND assessment_type_id = ?", report.ID, assessmentType.ID).
		First(&reportScore).Error
	if scoreErr != nil {
		// Fallback: use value from reports table if report_scores not found
		service.Log.Warnf("❌ report_scores not found for report_id=%d, assessment_type_id=%d. Error: %v. Using fallback from reports table. Score: %d", report.ID, assessmentType.ID, scoreErr, report.ValueAssessment)

		// Let's also check what's actually in report_scores table
		var allReportScores []domain.ReportScore
		db.Where("report_id = ?", report.ID).Find(&allReportScores)
		service.Log.Infof("📊 All report_scores for report_id=%d: %+v", report.ID, allReportScores)

		return report.ValueAssessment
	}

	service.Log.Infof("✅ Successfully retrieved value assessment from report_scores for seafarer %s. reportScore.ID=%d, reportScore.Score=%d (from report_scores table)", seafarerCode, reportScore.ID, reportScore.Score)
	service.Log.Infof("=== END getValueAssessmentScore: returning %d ===", reportScore.Score)
	return reportScore.Score
}

// processGapCompetencies parses CompetencyGapAnalysis field and creates gap_competencies records
func (service *ReportService) processGapCompetencies(db *gorm.DB, reports *[]domain.Report) error {
	service.Log.Info("Starting to process gap competencies from Excel upload")

	for _, report := range *reports {
		// Delete all existing gap competencies for this report first
		// This ensures fresh data from Excel replaces old data
		deleteResult := db.Where("report_id = ?", report.ID).Delete(&domain.GapCompetency{})
		if deleteResult.Error != nil {
			service.Log.Warnf("Failed to delete existing gap competencies for report ID %d: %v", report.ID, deleteResult.Error)
		} else {
			service.Log.Infof("Deleted %d existing gap competencies for report ID=%d", deleteResult.RowsAffected, report.ID)
		}

		// Skip if no competency gap analysis data
		if report.CompetencyGapAnalysis == "" {
			service.Log.Infof("No competency gap analysis data for report ID %d, skipping", report.ID)
			continue
		}

		// Parse the competency codes (e.g., "L1; L2; M3")
		codes := strings.Split(report.CompetencyGapAnalysis, ";")

		for _, code := range codes {
			code = strings.TrimSpace(code)
			if code == "" {
				continue
			}

			// Find the competency type by code
			var competencyType domain.CompetencyType
			if err := db.Where("code = ?", code).First(&competencyType).Error; err != nil {
				service.Log.Warnf("Competency type not found for code '%s' in report ID %d, skipping", code, report.ID)
				continue
			}

			// Create gap competency record
			gapCompetency := domain.GapCompetency{
				ReportID:         report.ID,
				CompetencyTypeID: competencyType.ID,
				GapLevel:         "MEDIUM",
				Priority:         1,
			}

			// Create new gap competency
			if err := db.Create(&gapCompetency).Error; err != nil {
				service.Log.Warnf("Failed to create gap competency for report ID %d, competency '%s': %v", report.ID, code, err)
				continue
			}
			service.Log.Infof("Created gap competency: Report ID=%d, Competency=%s (%d)", report.ID, code, competencyType.ID)
		}
	}

	service.Log.Info("Finished processing gap competencies")
	return nil
}

// saveValueAssessmentScores saves Value Assessment scores to report_scores table
func (service *ReportService) saveValueAssessmentScores(db *gorm.DB, reports *[]domain.Report) error {
	service.Log.Info("🔍 Starting to save Value Assessment scores to report_scores table")

	// First, let's check what assessment types exist in the database
	var allAssessmentTypes []domain.AssessmentType
	if err := db.Find(&allAssessmentTypes).Error; err != nil {
		service.Log.Warnf("❌ Failed to fetch all assessment types: %v", err)
	} else {
		service.Log.Infof("📊 Available Assessment Types in DB: %d types", len(allAssessmentTypes))
		for _, at := range allAssessmentTypes {
			service.Log.Infof("  - ID=%d, Name=%s", at.ID, at.AssessmentTypeName)
		}
	}

	// Get Value Assessment type ID
	var assessmentType domain.AssessmentType
	typeErr := db.Where("assessment_type_name = ?", "Value Assessment").First(&assessmentType).Error
	if typeErr != nil {
		service.Log.Warnf("❌ Value Assessment type NOT found in assessment_types table: %v", typeErr)
		service.Log.Info("⚠️ Will skip report_scores creation for Value Assessment")
		return nil // Don't fail the entire upload, just skip this step
	}
	service.Log.Infof("✅ Found Value Assessment type: ID=%d, Name=%s", assessmentType.ID, assessmentType.AssessmentTypeName)

	if len(*reports) == 0 {
		service.Log.Info("⏭️ No reports to process")
		return nil
	}

	successCount := 0
	skippedCount := 0

	for i, report := range *reports {
		// Only create report_scores if ValueAssessment > 0
		if report.ValueAssessment <= 0 {
			service.Log.Infof("⏭️ Row %d: Skipping report_scores for Report ID=%d (ValueAssessment=%d is 0 or negative)", i, report.ID, report.ValueAssessment)
			skippedCount++
			continue
		}

		service.Log.Infof("🔄 Row %d: Processing Report ID=%d, ValueAssessment=%d", i, report.ID, report.ValueAssessment)

		// Check if report_scores entry already exists
		var existingScore domain.ReportScore
		err := db.Where("report_id = ? AND assessment_type_id = ?", report.ID, assessmentType.ID).First(&existingScore).Error

		if err == gorm.ErrRecordNotFound {
			// Create new report_scores entry
			reportScore := domain.ReportScore{
				ReportID:         int64(report.ID),
				AssessmentTypeID: assessmentType.ID,
				Score:            report.ValueAssessment,
			}

			createErr := db.Create(&reportScore).Error
			if createErr != nil {
				service.Log.Errorf("❌ Failed to CREATE report_scores for Report ID=%d, Assessment Type ID=%d, Score=%d. Error: %v",
					report.ID, assessmentType.ID, report.ValueAssessment, createErr)

				// Fallback: try raw SQL INSERT
				service.Log.Infof("🔧 Trying fallback raw SQL INSERT...")
				rawErr := db.Exec(
					"INSERT INTO report_scores (report_id, assessment_type_id, score) VALUES (?, ?, ?)",
					report.ID, assessmentType.ID, report.ValueAssessment,
				).Error
				if rawErr != nil {
					service.Log.Errorf("❌ Raw SQL INSERT also failed: %v", rawErr)
					continue
				}
				service.Log.Infof("✅ Raw SQL INSERT succeeded")
			}

			// Verify the insert
			var verifyScore domain.ReportScore
			verifyErr := db.Where("report_id = ? AND assessment_type_id = ?", report.ID, assessmentType.ID).First(&verifyScore).Error
			if verifyErr != nil {
				service.Log.Warnf("⚠️ Failed to verify created report_scores for Report ID=%d: %v", report.ID, verifyErr)
			} else {
				service.Log.Infof("✅ VERIFIED - Created report_scores: ReportScore ID=%d, Report ID=%d, Assessment Type=%s (ID=%d), Score=%d",
					verifyScore.ID, report.ID, assessmentType.AssessmentTypeName, assessmentType.ID, verifyScore.Score)
				successCount++
			}
		} else if err == nil {
			// Update existing report_scores entry
			updateErr := db.Model(&existingScore).Update("score", report.ValueAssessment).Error
			if updateErr != nil {
				service.Log.Errorf("❌ Failed to UPDATE report_scores ID=%d for report ID %d with score %d: %v",
					existingScore.ID, report.ID, report.ValueAssessment, updateErr)
				continue
			}

			// Verify the update
			var verifyScore domain.ReportScore
			verifyErr := db.Where("id = ?", existingScore.ID).First(&verifyScore).Error
			if verifyErr != nil {
				service.Log.Warnf("⚠️ Failed to verify updated report_scores ID=%d: %v", existingScore.ID, verifyErr)
			} else {
				service.Log.Infof("✅ VERIFIED - Updated report_scores: ReportScore ID=%d, Report ID=%d, Assessment Type=%s (ID=%d), Score=%d",
					verifyScore.ID, report.ID, assessmentType.AssessmentTypeName, assessmentType.ID, verifyScore.Score)
				successCount++
			}
		} else {
			service.Log.Warnf("⚠️ Unexpected error checking existing report_scores for report ID %d: %v", report.ID, err)
			continue
		}
	}

	service.Log.Infof("📊 Finished saving Value Assessment scores - Success: %d, Skipped: %d, Total: %d",
		successCount, skippedCount, len(*reports))
	return nil
}

// calculateEducationFulfillmentMonths calculates the education fulfillment months based on certificate and IDP program
// This follows the same logic as the database trigger
func (service *ReportService) calculateEducationFulfillmentMonths(certificate, idpProgram string) int {
	switch idpProgram {
	case "SDP": // SDP Program (highest level)
		switch certificate {
		case "ANT-I", "ATT-I":
			return 0
		case "ANT-II", "ATT-II":
			return 5
		case "ANT-III", "ATT-III":
			return 8
		default:
			return 0
		}
	case "MDP": // MDP Program (middle level)
		switch certificate {
		case "ANT-I", "ATT-I", "ANT-II", "ATT-II":
			return 0
		case "ANT-III", "ATT-III":
			return 8
		default:
			return 0
		}
	case "FDP": // FDP Program (lowest level - all certificates result in 0)
		return 0
	default:
		return 0
	}
}
