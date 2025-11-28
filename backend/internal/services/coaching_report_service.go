package services

import (
	"encoding/json"
	"net/http"
	"time"

	"backend/internal/models/domain"
	"backend/internal/models/web"

	"github.com/sirupsen/logrus"
)

type CoachingReportService interface {
	Create(req *web.CoachingReportRequest) (*web.SuccessResponse, error)
	GetByID(id int64) (*web.SuccessResponse, error)
	GetAll() (*web.SuccessResponse, error)
	Update(id int64, req *web.CoachingReportRequest) (*web.SuccessResponse, error)
	Delete(id int64) (*web.SuccessResponse, error)
	GetByReportID(reportID int64) (*web.SuccessResponse, error)
}

type coachingReportService struct {
	repo CoachingReportRepository
	log  *logrus.Logger
}

type CoachingReportRepository interface {
	Create(coachingReport *domain.CoachingReport) error
	GetByID(id int64) (*domain.CoachingReport, error)
	GetAll() ([]domain.CoachingReport, error)
	Update(id int64, coachingReport *domain.CoachingReport) error
	Delete(id int64) error
	GetByReportID(reportID int64) ([]domain.CoachingReport, error)
}

func NewCoachingReportService(repo CoachingReportRepository, log *logrus.Logger) CoachingReportService {
	return &coachingReportService{
		repo: repo,
		log:  log,
	}
}

func parseCoacheeNames(jsonStr string) []string {
	var names []string
	if err := json.Unmarshal([]byte(jsonStr), &names); err != nil {
		return []string{}
	}
	return names
}

func parseReportIDs(jsonStr string) []int {
	var ids []int
	if err := json.Unmarshal([]byte(jsonStr), &ids); err != nil {
		return []int{}
	}
	return ids
}

func formatTimestamp(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.Format("2006-01-02 15:04:05")
}

func (s *coachingReportService) Create(req *web.CoachingReportRequest) (*web.SuccessResponse, error) {
	reportIDsJSON, err := json.Marshal(req.ReportIDs)
	if err != nil {
		s.log.Errorf("Failed to marshal report IDs: %v", err)
		return &web.SuccessResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Data:   nil,
		}, err
	}

	coacheeNamesJSON, err := json.Marshal(req.CoacheeNames)
	if err != nil {
		s.log.Errorf("Failed to marshal coachee names: %v", err)
		return &web.SuccessResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Data:   nil,
		}, err
	}

	coachingReport := &domain.CoachingReport{
		CoachName:       req.CoachName,
		Period:          req.Period,
		CoacheeNames:    string(coacheeNamesJSON),
		Department:      req.Department,
		Program:         req.Program,
		ProgramTitle:    req.ProgramTitle,
		SessionNumber:   string(rune(req.SessionNumber)),
		Date:            req.Date,
		Duration:        string(rune(req.Duration)),
		Purpose:         req.Purpose,
		Observation:     req.Observation,
		Reflection:      req.Reflection,
		ActionPlan:      req.ActionPlan,
		AdditionalNotes: req.AdditionalNotes,
		ReportIDs:       string(reportIDsJSON),
	}

	if err := s.repo.Create(coachingReport); err != nil {
		s.log.Errorf("Failed to create coaching report: %v", err)
		return &web.SuccessResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Data:   nil,
		}, err
	}

	response := &web.CoachingReportData{
		ID:              coachingReport.ID,
		CoachName:       coachingReport.CoachName,
		Period:          coachingReport.Period,
		CoacheeNames:    parseCoacheeNames(coachingReport.CoacheeNames),
		Department:      coachingReport.Department,
		Program:         coachingReport.Program,
		ProgramTitle:    coachingReport.ProgramTitle,
		SessionNumber:   coachingReport.SessionNumber,
		Date:            coachingReport.Date,
		Duration:        coachingReport.Duration,
		Purpose:         coachingReport.Purpose,
		Observation:     coachingReport.Observation,
		Reflection:      coachingReport.Reflection,
		ActionPlan:      coachingReport.ActionPlan,
		AdditionalNotes: coachingReport.AdditionalNotes,
		ReportIDs:       parseReportIDs(coachingReport.ReportIDs),
		CreatedAt:       formatTimestamp(coachingReport.CreatedAt),
		UpdatedAt:       formatTimestamp(coachingReport.UpdatedAt),
	}

	return &web.SuccessResponse{
		Code:   http.StatusCreated,
		Status: "Created",
		Data:   response,
	}, nil
}

func (s *coachingReportService) GetByID(id int64) (*web.SuccessResponse, error) {
	coachingReport, err := s.repo.GetByID(id)
	if err != nil {
		s.log.Errorf("Failed to get coaching report: %v", err)
		return &web.SuccessResponse{
			Code:   http.StatusNotFound,
			Status: "Not Found",
			Data:   nil,
		}, err
	}

	response := &web.CoachingReportData{
		ID:              coachingReport.ID,
		CoachName:       coachingReport.CoachName,
		Period:          coachingReport.Period,
		CoacheeNames:    parseCoacheeNames(coachingReport.CoacheeNames),
		Department:      coachingReport.Department,
		Program:         coachingReport.Program,
		ProgramTitle:    coachingReport.ProgramTitle,
		SessionNumber:   coachingReport.SessionNumber,
		Date:            coachingReport.Date,
		Duration:        coachingReport.Duration,
		Purpose:         coachingReport.Purpose,
		Observation:     coachingReport.Observation,
		Reflection:      coachingReport.Reflection,
		ActionPlan:      coachingReport.ActionPlan,
		AdditionalNotes: coachingReport.AdditionalNotes,
		ReportIDs:       parseReportIDs(coachingReport.ReportIDs),
		CreatedAt:       formatTimestamp(coachingReport.CreatedAt),
		UpdatedAt:       formatTimestamp(coachingReport.UpdatedAt),
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   response,
	}, nil
}

func (s *coachingReportService) GetAll() (*web.SuccessResponse, error) {
	coachingReports, err := s.repo.GetAll()
	if err != nil {
		s.log.Errorf("Failed to get all coaching reports: %v", err)
		return &web.SuccessResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Data:   nil,
		}, err
	}

	var responses []web.CoachingReportData
	for _, report := range coachingReports {
		responses = append(responses, web.CoachingReportData{
			ID:              report.ID,
			CoachName:       report.CoachName,
			Period:          report.Period,
			CoacheeNames:    parseCoacheeNames(report.CoacheeNames),
			Department:      report.Department,
			Program:         report.Program,
			ProgramTitle:    report.ProgramTitle,
			SessionNumber:   report.SessionNumber,
			Date:            report.Date,
			Duration:        report.Duration,
			Purpose:         report.Purpose,
			Observation:     report.Observation,
			Reflection:      report.Reflection,
			ActionPlan:      report.ActionPlan,
			AdditionalNotes: report.AdditionalNotes,
			ReportIDs:       parseReportIDs(report.ReportIDs),
			CreatedAt:       formatTimestamp(report.CreatedAt),
			UpdatedAt:       formatTimestamp(report.UpdatedAt),
		})
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   responses,
	}, nil
}

func (s *coachingReportService) Update(id int64, req *web.CoachingReportRequest) (*web.SuccessResponse, error) {
	reportIDsJSON, err := json.Marshal(req.ReportIDs)
	if err != nil {
		s.log.Errorf("Failed to marshal report IDs: %v", err)
		return &web.SuccessResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Data:   nil,
		}, err
	}

	coacheeNamesJSON, err := json.Marshal(req.CoacheeNames)
	if err != nil {
		s.log.Errorf("Failed to marshal coachee names: %v", err)
		return &web.SuccessResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Data:   nil,
		}, err
	}

	coachingReport := &domain.CoachingReport{
		CoachName:       req.CoachName,
		Period:          req.Period,
		CoacheeNames:    string(coacheeNamesJSON),
		Department:      req.Department,
		Program:         req.Program,
		ProgramTitle:    req.ProgramTitle,
		SessionNumber:   string(rune(req.SessionNumber)),
		Date:            req.Date,
		Duration:        string(rune(req.Duration)),
		Purpose:         req.Purpose,
		Observation:     req.Observation,
		Reflection:      req.Reflection,
		ActionPlan:      req.ActionPlan,
		AdditionalNotes: req.AdditionalNotes,
		ReportIDs:       string(reportIDsJSON),
	}

	if err := s.repo.Update(id, coachingReport); err != nil {
		s.log.Errorf("Failed to update coaching report: %v", err)
		return &web.SuccessResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Data:   nil,
		}, err
	}

	response := &web.CoachingReportData{
		ID:              id,
		CoachName:       coachingReport.CoachName,
		Period:          coachingReport.Period,
		CoacheeNames:    parseCoacheeNames(coachingReport.CoacheeNames),
		Department:      coachingReport.Department,
		Program:         coachingReport.Program,
		ProgramTitle:    coachingReport.ProgramTitle,
		SessionNumber:   coachingReport.SessionNumber,
		Date:            coachingReport.Date,
		Duration:        coachingReport.Duration,
		Purpose:         coachingReport.Purpose,
		Observation:     coachingReport.Observation,
		Reflection:      coachingReport.Reflection,
		ActionPlan:      coachingReport.ActionPlan,
		AdditionalNotes: coachingReport.AdditionalNotes,
		ReportIDs:       parseReportIDs(coachingReport.ReportIDs),
		CreatedAt:       formatTimestamp(coachingReport.CreatedAt),
		UpdatedAt:       formatTimestamp(coachingReport.UpdatedAt),
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   response,
	}, nil
}

func (s *coachingReportService) Delete(id int64) (*web.SuccessResponse, error) {
	if err := s.repo.Delete(id); err != nil {
		s.log.Errorf("Failed to delete coaching report: %v", err)
		return &web.SuccessResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Data:   nil,
		}, err
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   nil,
	}, nil
}

func (s *coachingReportService) GetByReportID(reportID int64) (*web.SuccessResponse, error) {
	coachingReports, err := s.repo.GetByReportID(reportID)
	if err != nil {
		s.log.Errorf("Failed to get coaching reports by report ID: %v", err)
		return &web.SuccessResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Data:   nil,
		}, err
	}

	var responses []web.CoachingReportData
	for _, report := range coachingReports {
		responses = append(responses, web.CoachingReportData{
			ID:              report.ID,
			CoachName:       report.CoachName,
			Period:          report.Period,
			CoacheeNames:    parseCoacheeNames(report.CoacheeNames),
			Department:      report.Department,
			Program:         report.Program,
			ProgramTitle:    report.ProgramTitle,
			SessionNumber:   report.SessionNumber,
			Date:            report.Date,
			Duration:        report.Duration,
			Purpose:         report.Purpose,
			Observation:     report.Observation,
			Reflection:      report.Reflection,
			ActionPlan:      report.ActionPlan,
			AdditionalNotes: report.AdditionalNotes,
			ReportIDs:       parseReportIDs(report.ReportIDs),
			CreatedAt:       formatTimestamp(report.CreatedAt),
			UpdatedAt:       formatTimestamp(report.UpdatedAt),
		})
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   web.CoachingReportListResponse{Data: responses},
	}, nil
}
