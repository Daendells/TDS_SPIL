package services

import (
	"errors"
	"fmt"
	"net/http"

	"backend/internal/models/converter"
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/go-playground/validator/v10"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type MentoringReportService struct {
	DB                        *gorm.DB
	Log                       *logrus.Logger
	Validate                  *validator.Validate
	MentoringReportRepository *repositories.MentoringReportRepository
}

func NewMentoringReportService(db *gorm.DB, log *logrus.Logger, validate *validator.Validate, mentoringReportRepository *repositories.MentoringReportRepository) *MentoringReportService {
	return &MentoringReportService{
		DB:                        db,
		Log:                       log,
		Validate:                  validate,
		MentoringReportRepository: mentoringReportRepository,
	}
}

func (service *MentoringReportService) Create(request *web.MentoringReportRequest) (*web.SuccessResponse, error) {
	// Log the incoming request for debugging
	service.Log.WithField("request", request).Info("Creating mentoring report")

	// Validate request
	if err := service.Validate.Struct(request); err != nil {
		service.Log.WithError(err).WithField("request", request).Error("validation error")
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Convert request to domain
	mentoringReport := converter.MentoringReportRequestToDomain(request)
	service.Log.WithField("domain_model", mentoringReport).Info("Converted to domain model")

	// Create mentoring report
	if err := service.MentoringReportRepository.Create(service.DB, mentoringReport); err != nil {
		service.Log.WithError(err).WithField("domain_model", mentoringReport).Error("failed to create mentoring report in database")
		return nil, fmt.Errorf("failed to create mentoring report: %w", err)
	}

	service.Log.WithField("created_report", mentoringReport).Info("Successfully created mentoring report")

	// Convert to response data
	responseData := converter.MentoringReportDomainToData(mentoringReport)

	return &web.SuccessResponse{
		Code:   http.StatusCreated,
		Status: "Created",
		Data:   responseData,
	}, nil
}

func (service *MentoringReportService) FindAll() (*web.SuccessResponse, error) {
	var mentoringReports []domain.MentoringReport

	// Get all mentoring reports
	if err := service.MentoringReportRepository.FindAll(service.DB, &mentoringReports); err != nil {
		service.Log.WithError(err).Error("failed to find all mentoring reports")
		return nil, fmt.Errorf("failed to retrieve mentoring reports: %w", err)
	}

	// Convert to response data
	responseData := converter.MentoringReportDomainToDataList(&mentoringReports)

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   web.MentoringReportListResponse{Data: *responseData},
	}, nil
}

func (service *MentoringReportService) FindById(id int64) (*web.SuccessResponse, error) {
	var mentoringReport domain.MentoringReport

	// Find mentoring report by ID
	if err := service.MentoringReportRepository.FindById(service.DB, &mentoringReport, id); err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("mentoring report not found")
		}
		service.Log.WithError(err).Error("failed to find mentoring report by id")
		return nil, fmt.Errorf("failed to retrieve mentoring report: %w", err)
	}

	// Convert to response data
	responseData := converter.MentoringReportDomainToData(&mentoringReport)

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   responseData,
	}, nil
}

func (service *MentoringReportService) Update(request *web.MentoringReportUpdateRequest) (*web.SuccessResponse, error) {
	// Validate request
	if err := service.Validate.Struct(request); err != nil {
		service.Log.WithError(err).Error("validation error")
		return nil, fmt.Errorf("validation error: %w", err)
	}

	// Check if mentoring report exists
	var existingReport domain.MentoringReport
	if err := service.MentoringReportRepository.FindById(service.DB, &existingReport, request.ID); err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("mentoring report not found")
		}
		service.Log.WithError(err).Error("failed to find mentoring report")
		return nil, fmt.Errorf("failed to find mentoring report: %w", err)
	}

	// Convert request to domain
	mentoringReport := converter.MentoringReportUpdateRequestToDomain(request)

	// Update mentoring report
	if err := service.MentoringReportRepository.Update(service.DB, mentoringReport); err != nil {
		service.Log.WithError(err).Error("failed to update mentoring report")
		return nil, fmt.Errorf("failed to update mentoring report: %w", err)
	}

	// Convert to response data
	responseData := converter.MentoringReportDomainToData(mentoringReport)

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   responseData,
	}, nil
}

func (service *MentoringReportService) Delete(id int64) (*web.SuccessResponse, error) {
	// Check if mentoring report exists
	var mentoringReport domain.MentoringReport
	if err := service.MentoringReportRepository.FindById(service.DB, &mentoringReport, id); err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, errors.New("mentoring report not found")
		}
		service.Log.WithError(err).Error("failed to find mentoring report")
		return nil, fmt.Errorf("failed to find mentoring report: %w", err)
	}

	// Delete mentoring report
	if err := service.MentoringReportRepository.Delete(service.DB, &mentoringReport); err != nil {
		service.Log.WithError(err).Error("failed to delete mentoring report")
		return nil, fmt.Errorf("failed to delete mentoring report: %w", err)
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   "Mentoring report deleted successfully",
	}, nil
}

func (service *MentoringReportService) FindByMenteeName(menteeName string) (*web.SuccessResponse, error) {
	var mentoringReports []domain.MentoringReport

	// Find mentoring reports by mentee name
	if err := service.MentoringReportRepository.FindByMenteeName(service.DB, &mentoringReports, menteeName); err != nil {
		service.Log.WithError(err).Error("failed to find mentoring reports by mentee name")
		return nil, fmt.Errorf("failed to retrieve mentoring reports: %w", err)
	}

	// Convert to response data
	responseData := converter.MentoringReportDomainToDataList(&mentoringReports)

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   web.MentoringReportListResponse{Data: *responseData},
	}, nil
}