package services

import (
	"context"
	"fmt"
	"net/http"
	"strconv"

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
	// sheetName := excel.GetSheetName(0) // Kalau pakai sheet pertama
	// rows, err := excel.GetRows(sheetName)
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

		// TODO: Get All Cells
		vesselName := helpers.SanitizeCell(helpers.GetCell(row, 1))
		nama := helpers.SanitizeCell(helpers.GetCell(row, 2))
		jabatan := helpers.SanitizeCell(helpers.GetCell(row, 3))
		seamanCode := helpers.SanitizeCell(helpers.GetCell(row, 4))
		certificate := helpers.SanitizeCell(helpers.GetCell(row, 5))
		age := helpers.SanitizeCell(helpers.GetCell(row, 6))
		konditeReview, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 7)))
		kpiVessel, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 8)))
		performanceScore, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 9)))
		valueAssessment, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 10)))
		assessmentCenter, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 11)))
		potentialScore, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 12)))
		havQuadran, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 13)))
		havMapping := helpers.SanitizeCell(helpers.GetCell(row, 14))
		competencyGapAnalysis := helpers.SanitizeCell(helpers.GetCell(row, 15))
		totalGap, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 16)))
		strength, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 17)))
		talentClassified := helpers.SanitizeCell(helpers.GetCell(row, 18))
		idpProgram := helpers.SanitizeCell(helpers.GetCell(row, 19))
		havQuadran2, _ := strconv.Atoi(helpers.SanitizeCell(helpers.GetCell(row, 20)))
		talentClassified2 := helpers.SanitizeCell(helpers.GetCell(row, 21))
		readiness := helpers.SanitizeCell(helpers.GetCell(row, 22))
		certificateEligible := helpers.SanitizeCell(helpers.GetCell(row, 23))

		tanggalLahir := "dd-mm-yyyy"

		reports = append(reports, domain.Report{
			SeamanCode:            seamanCode,
			Nama:                  nama,
			Jabatan:               jabatan,
			VesselName:            vesselName,
			Certificate:           certificate,
			Age:                   age,
			TanggalLahir:          tanggalLahir,
			KonditeReview:         konditeReview,
			KpiVessel:             kpiVessel,
			PerformanceScore:      performanceScore,
			ValueAssessment:       valueAssessment,
			AssessmentCenter:      assessmentCenter,
			PotentialScore:        potentialScore,
			HavQuadran:            havQuadran,
			HavMapping:            havMapping,
			CompetencyGapAnalysis: competencyGapAnalysis,
			TotalGap:              totalGap,
			Strength:              strength,
			TalentClassified:      talentClassified,
			IDPProgram:            idpProgram,
			HavQuadran2:           havQuadran2,
			TalentClassified2:     talentClassified2,
			Readiness:             readiness,
			CertificateEligible:   certificateEligible,
		})
	}

	// service.Log.Info(reports)

	// TODO: Create Reports
	if err = service.ReportRepository.CreateAll(tx, &reports); err != nil {
		service.Log.Warnf("Failed saving to DB: %+v", err)
		return nil, fmt.Errorf("failed saving to DB: %w", err)
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
