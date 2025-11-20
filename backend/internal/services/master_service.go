package services

import (
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"backend/internal/models/converter"
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// MasterService provides business logic for master report operations
type MasterService struct {
	DB               *gorm.DB
	Log              *logrus.Logger
	Validate         *validator.Validate
	MasterRepository *repositories.MasterRepository
}

// Constructor
func NewMasterService(db *gorm.DB, log *logrus.Logger, validate *validator.Validate, repo *repositories.MasterRepository) *MasterService {
	return &MasterService{
		DB: db, Log: log, Validate: validate, MasterRepository: repo,
	}
}

//
// ---------------------- READ OPERATIONS ----------------------

func (s *MasterService) FindAll(req web.MasterListRequest) (*web.SuccessResponse, error) {
	db := s.DB.Model(&domain.MasterReport{})

	// --- optional search filter ---
	if req.Query != "" {
		q := strings.ToLower(req.Query)
		db = db.Where(
			s.DB.
				Where("LOWER(nama) LIKE ?", "%"+q+"%").
				Or("seafarer_code LIKE ?", "%"+req.Query+"%"),
		)
	}

	// --- cursor pagination logic ---
	if req.Page == "next" && req.AnchorID > 0 {
		db = db.Where("id > ?", req.AnchorID).Order("id ASC")
	} else if req.Page == "prev" && req.AnchorID > 0 {
		db = db.Where("id < ?", req.AnchorID).Order("id DESC")
	} else {
		db = db.Order("id ASC")
	}

	// --- enforce limit ---
	limit := req.PageSize
	if limit <= 0 {
		limit = 10
	}
	db = db.Limit(limit)

	// --- Preload GapCompetencies with CompetencyType and ReportScores with AssessmentType ---
	db = db.Preload("GapCompetencies").Preload("GapCompetencies.CompetencyType").
		Preload("ReportScores").Preload("ReportScores.AssessmentType")

	// --- execute query ---
	var rows []domain.MasterReport
	if err := db.Find(&rows).Error; err != nil {
		s.Log.WithError(err).Error("failed to query master reports")
		return nil, fmt.Errorf("failed to retrieve master reports: %w", err)
	}

	// --- reverse if prev (so UI order stays ascending) ---
	if req.Page == "prev" && len(rows) > 1 {
		for i, j := 0, len(rows)-1; i < j; i, j = i+1, j-1 {
			rows[i], rows[j] = rows[j], rows[i]
		}
	}

	// --- map domain → web model ---
	result := make([]web.MasterReportData, 0, len(rows))
	for _, r := range rows {
		// Map competencies
		competencies := make([]web.GapCompetencyData, 0, len(r.GapCompetencies))
		for _, gc := range r.GapCompetencies {
			competencies = append(competencies, web.GapCompetencyData{
				ID:               gc.ID,
				CompetencyTypeID: gc.CompetencyTypeID,
				CompetencyType: web.CompetencyTypeData{
					ID:   gc.CompetencyType.ID,
					Code: gc.CompetencyType.Code,
					Name: gc.CompetencyType.Name,
				},
			})
		}

		// Map report scores
		reportScores := make([]web.ReportScoreData, 0, len(r.ReportScores))
		for _, rs := range r.ReportScores {
			if rs.AssessmentType != nil {
				reportScores = append(reportScores, web.ReportScoreData{
					ID:               rs.ID,
					Score:            rs.Score,
					AssessmentTypeID: rs.AssessmentTypeID,
					AssessmentType: web.AssessmentTypeData{
						ID:                 rs.AssessmentType.ID,
						AssessmentTypeName: rs.AssessmentType.AssessmentTypeName,
						StartTime:          rs.AssessmentType.StartTime,
						EndTime:            rs.AssessmentType.EndTime,
						MaxAttempts:        rs.AssessmentType.MaxAttempts,
					},
				})
			}
		}

		result = append(result, web.MasterReportData{
			ID:                         r.ID,
			VesselName:                 r.VesselName,
			Nama:                       r.Nama,
			Jabatan:                    r.Jabatan,
			User:                       r.User,
			SeamanCode:                 r.SeamanCode,
			SeafarerCode:               r.SeafarerCode,
			Certificate:                r.Certificate,
			Age:                        r.Age,
			KonditeReview:              r.KonditeReview,
			KpiVessel:                  r.KpiVessel,
			PerformanceScore:           r.PerformanceScore,
			ValueAssessment:            r.ValueAssessment,
			AssessmentCenter:           r.AssessmentCenter,
			PotentialScore:             r.PotentialScore,
			HavQuadran:                 r.HavQuadran,
			HavMapping:                 r.HavMapping,
			CompetencyGapAnalysis:      r.CompetencyGapAnalysis,
			TotalGap:                   r.TotalGap,
			Strength:                   r.Strength,
			TalentClassified:           r.TalentClassified,
			IDPProgram:                 r.IDPProgram,
			HavQuadran2:                r.HavQuadran2,
			TalentClassified2:          r.TalentClassified2,
			ReadinessMonth:             r.ReadinessMonth,
			CertificateEligible:        r.CertificateEligible,
			EducationFulfillmentMonths: r.EducationFulfillmentMonths,
			TotalReadinessUpdateMonths: r.TotalReadinessUpdateMonths,
			Keterangan:                 r.Keterangan,
			TmNm:                       r.TmNm,
			Competencies:               competencies,    // Add competencies here
			ReportScores:               reportScores,    // Add report scores here
		})
	}

	// --- detect boundaries for first/last page ---
	var isFirstPage bool
	if len(result) == 0 {
		isFirstPage = true
	} else {
		var count int64
		if err := s.DB.Model(&domain.MasterReport{}).
			Where("id < ?", result[0].ID).
			Count(&count).Error; err != nil {
			s.Log.WithError(err).Warn("failed to count previous records")
		}
		isFirstPage = (count == 0)
	}

	responsePayload := web.MasterReportListResponse{
		Data:      result,
		PageSize:  limit,
		HasMore:   len(result) >= limit,
		FirstPage: isFirstPage,
	}

	if len(result) > 0 {
		responsePayload.FirstID = result[0].ID
		responsePayload.LastID = result[len(result)-1].ID
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   responsePayload,
	}, nil
}

// FindById retrieves one master report with full competencies and report scores
func (s *MasterService) FindById(id uint) (*web.SuccessResponse, error) {
	var master domain.FullReport
	if err := s.DB.Preload("GapCompetencies.CompetencyType").
		Preload("ReportScores.AssessmentType").
		First(&master, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("master report not found")
		}
		s.Log.WithError(err).Error("failed to find master report by ID")
		return nil, fmt.Errorf("failed to retrieve master report: %w", err)
	}

	// Map competencies to web model
	competencies := make([]web.GapCompetencyData, 0, len(master.GapCompetencies))
	for _, gc := range master.GapCompetencies {
		competencies = append(competencies, web.GapCompetencyData{
			ID:               gc.ID,
			CompetencyTypeID: gc.CompetencyTypeID,
			CompetencyType: web.CompetencyTypeData{
				ID:   gc.CompetencyType.ID,
				Code: gc.CompetencyType.Code,
				Name: gc.CompetencyType.Name,
			},
		})
	}

	// Map report scores to web model
	reportScores := make([]web.ReportScoreData, 0, len(master.ReportScores))
	for _, rs := range master.ReportScores {
		if rs.AssessmentType != nil {
			reportScores = append(reportScores, web.ReportScoreData{
				ID:               rs.ID,
				Score:            rs.Score,
				AssessmentTypeID: rs.AssessmentTypeID,
				AssessmentType: web.AssessmentTypeData{
					ID:                 rs.AssessmentType.ID,
					AssessmentTypeName: rs.AssessmentType.AssessmentTypeName,
					StartTime:          rs.AssessmentType.StartTime,
					EndTime:            rs.AssessmentType.EndTime,
					MaxAttempts:        rs.AssessmentType.MaxAttempts,
				},
			})
		}
	}

	// Create response with competencies and report scores
	response := web.FullReportResponse{
		ID:                         master.ID,
		VesselName:                 master.VesselName,
		Nama:                       master.Nama,
		Jabatan:                    master.Jabatan,
		SeamanCode:                 master.SeamanCode,
		SeafarerCode:               master.SeafarerCode,
		Certificate:                master.Certificate,
		Age:                        master.Age,
		KonditeReview:              master.KonditeReview,
		KpiVessel:                  master.KpiVessel,
		PerformanceScore:           master.PerformanceScore,
		ValueAssessment:            master.ValueAssessment,
		AssessmentCenter:           master.AssessmentCenter,
		PotentialScore:             master.PotentialScore,
		HavQuadran:                 master.HavQuadran,
		HavMapping:                 master.HavMapping,
		CompetencyGapAnalysis:      master.CompetencyGapAnalysis,
		TotalGap:                   master.TotalGap,
		Strength:                   master.Strength,
		TalentClassified:           master.TalentClassified,
		IDPProgram:                 master.IDPProgram,
		HavQuadran2:                master.HavQuadran2,
		TalentClassified2:          master.TalentClassified2,
		ReadinessMonth:             master.ReadinessMonth,
		CertificateEligible:        master.CertificateEligible,
		EducationFulfillmentMonths: master.EducationFulfillmentMonths,
		TotalReadinessUpdateMonths: master.TotalReadinessUpdateMonths,
		Keterangan:                 master.Keterangan,
		TmNm:                       master.TmNm,
		Competencies:               competencies,
		ReportScores:               reportScores,
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   response,
	}, nil
}

//
// ---------------------- CREATE ----------------------
//

// Ensure required defaults before create
func fillReportDefaults(r *domain.FullReport) error {
	if r.Readiness == nil || *r.Readiness == "" {
		def := "Pending"
		r.Readiness = &def
	}
	if r.SeamanCode == nil || *r.SeamanCode == "" {
		return fmt.Errorf("seamanCode is required")
	}
	if r.SeafarerCode == nil || *r.SeafarerCode == "" {
		return fmt.Errorf("seafarerCode is required")
	}
	return nil
}

// Create adds a new master report with competencies
func (s *MasterService) Create(request *web.MasterReportData) (*web.SuccessResponse, error) {
	if err := s.Validate.Struct(request); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	master := converter.MasterReportRequestToDomain(request)

	if err := fillReportDefaults(master); err != nil {
		return nil, err
	}

	// Process competencies if provided
	if len(request.Competencies) > 0 {
		competencies := make([]domain.GapCompetency, 0, len(request.Competencies))

		for _, comp := range request.Competencies {
			competencies = append(competencies, domain.GapCompetency{
				CompetencyTypeID: comp.CompetencyTypeID,
			})
		}

		master.GapCompetencies = competencies
	}

	if err := s.MasterRepository.Create(s.DB, master); err != nil {
		s.Log.WithError(err).Error("failed to create master report")
		return nil, fmt.Errorf("failed to create master report: %w", err)
	}

	// Reload with competency types for response
	var created domain.FullReport
	if err := s.MasterRepository.FindById(s.DB, &created, master.ID); err != nil {
		s.Log.WithError(err).Warn("created but failed to reload with relations")
	} else {
		master = &created
	}

	// Map competencies for response
	competencies := make([]web.GapCompetencyData, 0, len(master.GapCompetencies))
	for _, gc := range master.GapCompetencies {
		competencies = append(competencies, web.GapCompetencyData{
			ID:               gc.ID,
			CompetencyTypeID: gc.CompetencyTypeID,
			CompetencyType: web.CompetencyTypeData{
				ID:   gc.CompetencyType.ID,
				Code: gc.CompetencyType.Code,
				Name: gc.CompetencyType.Name,
			},
		})
	}

	response := web.CreateReportResponse{
		ID:           master.ID,
		Nama:         master.Nama,
		SeafarerCode: master.SeafarerCode,
		Competencies: competencies,
	}

	return &web.SuccessResponse{
		Code:   http.StatusCreated,
		Status: "Created",
		Data:   response,
	}, nil
}

//
// ---------------------- UPDATE ----------------------
//

func nullifyStringPtr(p *string) *string {
	if p == nil {
		return nil
	}
	if strings.TrimSpace(*p) == "" {
		return nil
	}
	return p
}

func (s *MasterService) Update(id uint, request *web.UpdateMasterRequest) (*web.SuccessResponse, error) {
	// Validate input
	if err := s.Validate.Struct(request); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Get existing report
	var existing domain.FullReport
	if err := s.MasterRepository.FindById(s.DB, &existing, id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("master report not found")
		}
		return nil, err
	}

	// Prevent breaking FK
	if request.SeafarerCode != nil && existing.SeafarerCode != nil &&
		*request.SeafarerCode != *existing.SeafarerCode {
		return nil, fmt.Errorf("cannot update seafarerCode; referenced by other tables")
	}

	// Apply normal fields update
	if request.Nama != nil {
		existing.Nama = nullifyStringPtr(request.Nama)
	}
	if request.Jabatan != nil {
		existing.Jabatan = nullifyStringPtr(request.Jabatan)
	}
	if request.VesselName != nil {
		existing.VesselName = nullifyStringPtr(request.VesselName)
	}
	if request.SeamanCode != nil {
		existing.SeamanCode = nullifyStringPtr(request.SeamanCode)
	}

	//  UPDATE CHILD TABLE (GapCompetencies)

	if request.Competencies != nil {

		// 1. Load existing children
		var existingComps []domain.GapCompetency
		s.DB.Where("report_id = ?", existing.ID).Find(&existingComps)

		// Map old children by ID
		oldMap := make(map[int]domain.GapCompetency)
		for _, c := range existingComps {
			oldMap[c.ID] = c
		}

		// 2. Process incoming competencies
		for _, comp := range request.Competencies {

			// INSERT new row
			if comp.ID == nil {
				newComp := domain.GapCompetency{
					ReportID:         int(existing.ID),
					CompetencyTypeID: comp.CompetencyTypeID,
				}
				s.DB.Create(&newComp)
				continue
			}

			// UPDATE existing row
			if old, found := oldMap[*comp.ID]; found {
				old.CompetencyTypeID = comp.CompetencyTypeID
				s.DB.Save(&old)
				delete(oldMap, *comp.ID) // remove from delete list
			}
		}

		// 3. DELETE children not included in request
		for _, leftover := range oldMap {
			s.DB.Delete(&leftover)
		}
	}

	// Save master report
	if err := s.MasterRepository.Update(s.DB, &existing); err != nil {
		return nil, fmt.Errorf("failed to update master report: %w", err)
	}

	// Reload with full relations
	var updated domain.FullReport
	if err := s.MasterRepository.FindById(s.DB, &updated, id); err != nil {
		s.Log.WithError(err).Warn("updated but failed to reload with relations")
	} else {
		existing = updated
	}

	// Map competencies for response
	competencies := make([]web.GapCompetencyData, 0, len(existing.GapCompetencies))
	for _, gc := range existing.GapCompetencies {
		competencies = append(competencies, web.GapCompetencyData{
			ID:               gc.ID,
			CompetencyTypeID: gc.CompetencyTypeID,
			CompetencyType: web.CompetencyTypeData{
				ID:   gc.CompetencyType.ID,
				Code: gc.CompetencyType.Code,
				Name: gc.CompetencyType.Name,
			},
		})
	}

	response := web.UpdateReportResponse{
		ID:           existing.ID,
		Nama:         existing.Nama,
		Jabatan:      existing.Jabatan,
		Competencies: competencies,
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "Updated",
		Data:   response,
	}, nil
}

// ---------------------- DELETE ----------------------

func (s *MasterService) Delete(id uint) (*web.SuccessResponse, error) {

	var master domain.FullReport
	if err := s.MasterRepository.FindById(s.DB, &master, id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("master report not found")
		}
		return nil, err
	}

	// Hapus child terlebih dahulu
	var deleted int64
	s.DB.Model(&domain.GapCompetency{}).
		Where("report_id = ?", id).
		Count(&deleted)

	s.DB.Where("report_id = ?", id).Delete(&domain.GapCompetency{})

	s.Log.WithFields(logrus.Fields{
		"report_id":       id,
		"childrenDeleted": deleted,
		"time":            time.Now(),
	}).Info("Deleting master report and children")

	// Hapus parent
	if err := s.MasterRepository.Delete(s.DB, &master); err != nil {
		return nil, fmt.Errorf("failed to delete master report: %w", err)
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "Deleted",
		Data: gin.H{
			"message":      fmt.Sprintf("Master report %d deleted", id),
			"childDeleted": deleted,
		},
	}, nil
}
