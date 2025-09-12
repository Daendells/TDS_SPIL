package services

import (
	"context"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"backend/internal/helpers"
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/go-playground/validator/v10"
	"github.com/sirupsen/logrus"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

type ReportService struct {
	DB               *gorm.DB
	Log              *logrus.Logger
	Validate         *validator.Validate
	ReportRepository *repositories.ReportRepository
}

func NewReportService(db *gorm.DB, log *logrus.Logger, validate *validator.Validate, reportRepository *repositories.ReportRepository) *ReportService {
	return &ReportService{
		DB:               db,
		Log:              log,
		Validate:         validate,
		ReportRepository: reportRepository,
	}
}

func (service *ReportService) FindAll(ctx context.Context, request *web.DashboardRequest) (*web.SuccessResponse, error) {
	// TODO: Create Transaction
	tx := service.DB.WithContext(ctx).Begin()
	defer tx.Rollback()

	var reports []domain.Report

	err := service.ReportRepository.SelectWithFilter(tx, request, &reports)
	if err != nil {
		return nil, err
	}

	// TODO: Init response
	hasMore := false
	isFirstPage := false

	// //! If for prev, we need to reverse the reports
	// if request.Page == "prev" {
	// 	helpers.Reverse(&reports)
	// 	if len(reports) > request.PageSize {
	// 		hasMore = true
	// 		isFirstPage = true
	// 		reports = reports[:request.PageSize]
	// 	}
	// } else {
	// 	// Check Page, apakah masih ada page selanjutnya / sebelumnya
	// 	if len(reports) > request.PageSize {
	// 		hasMore = true
	// 		reports = reports[:request.PageSize]
	// 	}
	// }
	if request.Page == "prev" {
		// Untuk prev, hasil query DESC lalu dibalik biar tetap ASC
		helpers.Reverse(&reports)
		if len(reports) > request.PageSize {
			isFirstPage = false // Kalau ada lebih, pasti bukan first page
		} else {
			isFirstPage = true
		}
		hasMore = true // Karena page sekarang akan jadi page selanjutnya, jadi pasti TRUE
	} else {
		//! Next
		if len(reports) > request.PageSize {
			hasMore = true
			reports = reports[:request.PageSize]
		}
		isFirstPage = false // Karena page sekarang pasti jadi page sebelumya, jadi pasti FALSE
	}

	firstId := reports[0].ID
	lastId := reports[len(reports)-1].ID

	return &web.SuccessResponse{
		Status: "Ok",
		Code:   http.StatusOK,
		Data: map[string]interface{}{
			"reports":    reports,
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
		return nil, fmt.Errorf("Invalid request body: %w", err)
	}

	// TODO: Read Excel
	file, err := request.File.Open()
	if err != nil {
		service.Log.Warnf("Cannot open the file: %+v", err)
		return nil, fmt.Errorf("Cannot open the file: %w", err)
	}
	defer file.Close()

	// TODO: Parse The Excel File from io.Reader
	excel, err := excelize.OpenReader(file)
	if err != nil {
		service.Log.Warnf("Cannot open the excel: %+v", err)
		return nil, fmt.Errorf("Cannot open the excel: %w", err)
	}
	defer excel.Close()

	// TODO: Get the Sheet and the rows
	sheetName := excel.GetSheetName(0)
	rows, err := excel.GetRows(sheetName)
	if err != nil {
		service.Log.Warnf("Cannot get the rows: %+v", err)
		return nil, fmt.Errorf("Cannot open the rows: %w", err)
	}

	var reports []domain.Report

	for i, row := range rows {
		// Skip the header
		if i == 0 {
			continue
		}

		// TODO: Get All Cells
		vesselName := helpers.SanitizeCell(helpers.GetCell(row, 1))
		nama := helpers.SanitizeCell(helpers.GetCell(row, 2))
		jabatan := helpers.SanitizeCell(helpers.GetCell(row, 3))
		konditeReview, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 4)))
		kpiVessel, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 5)))
		performanceScore, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 6)))
		valueAssessment, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 7)))
		assessmentCenter, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 8)))
		potentialScore, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 9)))
		havQuadran := helpers.SanitizeCell(helpers.GetCell(row, 10))
		havMapping := helpers.SanitizeCell(helpers.GetCell(row, 11))
		competencyGapAnalysis := helpers.SanitizeCell(helpers.GetCell(row, 12))
		talentClassified := helpers.SanitizeCell(helpers.GetCell(row, 13))

		// Mapping the IDP Program
		idp := strings.ToUpper(jabatan)
		service.Log.Info(idp)
		idpProgram := helpers.MapIDPProgram(idp)

		reports = append(reports, domain.Report{
			VesselName:            vesselName,
			Nama:                  nama,
			Jabatan:               jabatan,
			KonditeReview:         konditeReview,
			KPIVessel:             kpiVessel,
			PerformanceScore:      performanceScore,
			ValueAssessment:       valueAssessment,
			AssessmentCenter:      assessmentCenter,
			PotentialScore:        potentialScore,
			HAVQuadran:            havQuadran,
			HAVMapping:            havMapping,
			CompetencyGapAnalysis: competencyGapAnalysis,
			TalentClassified:      talentClassified,
			IDPProgram:            idpProgram,
		})
	}

	// service.Log.Info(reports)

	// TODO: Create Reports
	if err = service.ReportRepository.CreateAll(tx, &reports); err != nil {
		service.Log.Warnf("Failed saving to DB: %+v", err)
		return nil, fmt.Errorf("Failed saving to DB: %w", err)
	}

	// TODO: Commit Transaction
	if err = tx.Commit().Error; err != nil {
		service.Log.Warnf("Failed commit transaction: %+v", err)
		return nil, fmt.Errorf("Failed commit transaction: %w", err)
	}

	service.Log.Info("Reports created successfully")

	return &web.SuccessResponse{
		Code:   http.StatusCreated,
		Status: "Created",
		Data:   "Reports Created Successfully",
	}, nil
}
