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
//

// FindAll returns paginated master reports
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

// FindById retrieves one master report
func (s *MasterService) FindById(id uint) (*web.SuccessResponse, error) {
	var master domain.FullReport
	if err := s.MasterRepository.FindById(s.DB, &master, id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("master report not found")
		}
		s.Log.WithError(err).Error("failed to find master report by ID")
		return nil, fmt.Errorf("failed to retrieve master report: %w", err)
	}
	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   master,
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

// Create adds a new master report
func (s *MasterService) Create(request *web.ReportData) (*web.SuccessResponse, error) {
	if err := s.Validate.Struct(request); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	master := converter.MasterReportRequestToDomain(request)

	if err := fillReportDefaults(master); err != nil {
		return nil, err
	}

	if err := s.MasterRepository.Create(s.DB, master); err != nil {
		s.Log.WithError(err).Error("failed to create master report")
		return nil, fmt.Errorf("failed to create master report: %w", err)
	}

	return &web.SuccessResponse{
		Code:   http.StatusCreated,
		Status: "Created",
		Data:   master,
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

func parseDateOrNil(p *string) (*time.Time, error) {
	if p == nil {
		return nil, nil
	}
	if strings.TrimSpace(*p) == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", *p)
	if err != nil {
		return nil, fmt.Errorf("invalid date format for startDate, expected YYYY-MM-DD")
	}
	return &t, nil
}

func (s *MasterService) Update(id uint, request *web.UpdateMasterRequest) (*web.SuccessResponse, error) {
	if err := s.Validate.Struct(request); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	var existing domain.FullReport
	if err := s.MasterRepository.FindById(s.DB, &existing, id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("master report not found")
		}
		return nil, err
	}

	// 🔒 Prevent FK-breaking updates
	if request.SeafarerCode != nil && existing.SeafarerCode != nil &&
		*request.SeafarerCode != *existing.SeafarerCode {
		return nil, fmt.Errorf("cannot update seafarerCode; it is referenced by other tables")
	}
	if request.SeamanCode != nil && existing.SeamanCode != nil &&
		*request.SeamanCode != *existing.SeamanCode {
		return nil, fmt.Errorf("cannot update seamanCode")
	}

	// --- Apply partial updates ---
	if request.Nama != nil {
		existing.Nama = nullifyStringPtr(request.Nama)
	}
	if request.SeafarerCode != nil {
		existing.SeafarerCode = nullifyStringPtr(request.SeafarerCode)
	}
	if request.SeamanCode != nil {
		existing.SeamanCode = nullifyStringPtr(request.SeamanCode)
	}
	if request.Jabatan != nil {
		existing.Jabatan = nullifyStringPtr(request.Jabatan)
	}
	if request.VesselName != nil {
		existing.VesselName = nullifyStringPtr(request.VesselName)
	}
	if request.StartDate != nil {
		t, err := parseDateOrNil(request.StartDate)
		if err != nil {
			return nil, err
		}
		existing.StartDate = t
	}

	// --- Required fields must remain non-empty ---
	if existing.Nama == nil || strings.TrimSpace(*existing.Nama) == "" {
		return nil, fmt.Errorf("field 'nama' is required and cannot be empty")
	}
	if existing.SeamanCode == nil || strings.TrimSpace(*existing.SeamanCode) == "" {
		return nil, fmt.Errorf("field 'seamanCode' is required and cannot be empty")
	}
	if existing.SeafarerCode == nil || strings.TrimSpace(*existing.SeafarerCode) == "" {
		return nil, fmt.Errorf("field 'seafarerCode' is required and cannot be empty")
	}

	if err := s.MasterRepository.Update(s.DB, &existing); err != nil {
		s.Log.WithError(err).Error("failed to update master report")
		return nil, fmt.Errorf("failed to update master report: %w", err)
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "Updated",
		Data:   existing,
	}, nil
}

//
// ---------------------- DELETE ----------------------
//

func (s *MasterService) Delete(id uint) (*web.SuccessResponse, error) {
	var master domain.FullReport
	if err := s.MasterRepository.FindById(s.DB, &master, id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("master report not found")
		}
		return nil, err
	}

	if err := s.MasterRepository.Delete(s.DB, &master); err != nil {
		s.Log.WithError(err).Error("failed to delete master report")
		return nil, fmt.Errorf("failed to delete master report: %w", err)
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "Deleted",
		Data:   fmt.Sprintf("master report with ID %d deleted successfully", id),
	}, nil
}
