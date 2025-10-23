package services

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"backend/internal/helpers"
	"backend/internal/models/converter"
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/go-playground/validator/v10"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type MasterService struct {
	DB               *gorm.DB
	Log              *logrus.Logger
	Validate         *validator.Validate
	MasterRepository *repositories.MasterRepository
}

func NewMasterService(db *gorm.DB, log *logrus.Logger, validate *validator.Validate, repo *repositories.MasterRepository) *MasterService {
	return &MasterService{
		DB:               db,
		Log:              log,
		Validate:         validate,
		MasterRepository: repo,
	}
}

func (s *MasterService) FindAll(ctx context.Context, req *web.MasterListRequest) (*web.SuccessResponse, error) {
	// Validate query params
	if err := s.Validate.Struct(req); err != nil {
		return nil, err
	}

	tx := s.DB.WithContext(ctx).Begin()
	defer tx.Rollback()

	var reports []domain.MasterReport
	err := s.MasterRepository.SelectAll(tx, req, &reports)
	if err != nil {
		return nil, err
	}

	// Handle empty results
	if len(reports) == 0 {
		return &web.SuccessResponse{
			Status: "Ok",
			Code:   http.StatusOK,
			Data: map[string]interface{}{
				"results":    []domain.MasterReport{},
				"first_id":   nil,
				"last_id":    nil,
				"page_size":  req.PageSize,
				"has_more":   false,
				"first_page": req.AnchorID == 0,
			},
		}, nil
	}

	// Convert and handle pagination
	data := converter.ToMasterReportList(&reports)

	hasMore := false
	firstPage := req.AnchorID == 0

	if req.Page == "prev" {
		if len(data) > req.PageSize {
			firstPage = false
			data = data[:req.PageSize]
		} else {
			firstPage = true
		}
		helpers.Reverse(&data)
		hasMore = true
	} else {
		if len(data) > req.PageSize {
			hasMore = true
			data = data[:req.PageSize]
		}
	}

	firstId := data[0].ID
	lastId := data[len(data)-1].ID

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &web.SuccessResponse{
		Status: "Ok",
		Code:   http.StatusOK,
		Data: map[string]interface{}{
			"results":    data,
			"first_id":   firstId,
			"last_id":    lastId,
			"page_size":  req.PageSize,
			"has_more":   hasMore,
			"first_page": firstPage,
		},
	}, nil
}

func (s *MasterService) Create(ctx context.Context, req *web.ReportData) (*web.SuccessResponse, error) {
	tx := s.DB.WithContext(ctx).Begin()
	defer tx.Rollback()

	if err := s.Validate.Struct(req); err != nil {
		s.Log.Warnf("Invalid input: %+v", err)
		return nil, err
	}

	report := domain.FullReport{
		VesselName:    req.VesselName,
		Nama:          req.Nama,
		Jabatan:       req.Jabatan,
		SeamanCode:    req.SeamanCode,
		SeafarerCode:  req.SeafarerCode,
		Certificate:   req.Certificate,
		Age:           req.Age,
		TanggalLahir:  req.TanggalLahir,
		StartDate:     req.StartDate,
		WarningLetter: req.WarningLetter,
		CaseHistory:   req.CaseHistory,
		YearOfCase:    req.YearOfCase,
		VesselHistory: req.VesselHistory,
		// Optional numeric fields — safe defaults
		KonditeReview:              req.KonditeReview,
		KpiVessel:                  req.KpiVessel,
		PerformanceScore:           req.PerformanceScore,
		ValueAssessment:            req.ValueAssessment,
		AssessmentCenter:           req.AssessmentCenter,
		PotentialScore:             req.PotentialScore,
		HavQuadran:                 req.HavQuadran,
		HavMapping:                 req.HavMapping,
		CompetencyGapAnalysis:      req.CompetencyGapAnalysis,
		TotalGap:                   req.TotalGap,
		Strength:                   req.Strength,
		TalentClassified:           req.TalentClassified,
		IDPProgram:                 req.IDPProgram,
		HavQuadran2:                req.HavQuadran2,
		TalentClassified2:          req.TalentClassified2,
		Readiness:                  req.Readiness,
		CertificateEligible:        req.CertificateEligible,
		TrainingCompleted:          req.TrainingCompleted,
		TrainingPlanned:            req.TrainingPlanned,
		MentoringCompleted:         req.MentoringCompleted,
		MentoringPlanned:           req.MentoringPlanned,
		CoachingCompleted:          req.CoachingCompleted,
		CoachingPlanned:            req.CoachingPlanned,
		DataIncumbent:              req.DataIncumbent,
		SuccessionVessel:           req.SuccessionVessel,
		SuccessionRank:             req.SuccessionRank,
		IDPStart:                   req.IDPStart,
		IDPMentor:                  req.IDPMentor,
		IDPCoach:                   req.IDPCoach,
		ReadinessMonth:             0,
		EducationFulfillmentMonths: 0,
		TotalReadinessUpdateMonths: 0,
		Keterangan:                 req.VesselHistory,
	}

	if err := s.MasterRepository.Create(tx, &report); err != nil {
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	return &web.SuccessResponse{
		Code:   http.StatusCreated,
		Status: "Created",
		Data:   report,
	}, nil
}

func (s *MasterService) Delete(ctx context.Context, id uint) (*web.SuccessResponse, error) {
	tx := s.DB.WithContext(ctx).Begin()
	defer tx.Rollback()

	// Cek apakah data ada
	report, err := s.MasterRepository.FindByID(tx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			s.Log.Warnf("Data tidak ditemukan untuk ID %d", id)
			return nil, fmt.Errorf("data dengan ID %d tidak ditemukan", id)
		}
		return nil, err
	}

	// Hapus data
	if err := s.MasterRepository.Delete(tx, id); err != nil {
		s.Log.Errorf("Gagal menghapus ID %d: %v", id, err)
		return nil, err
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	s.Log.Infof("Berhasil menghapus data ID %d (%s)", report.ID, report.Nama)

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "Deleted",
		Data: map[string]interface{}{
			"id":   id,
			"nama": report.Nama,
		},
	}, nil
}
