package services

import (
	"backend/internal/models/converter"
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"
	"strings"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type SeafarerAssessmentService interface {
	FindAll(db *gorm.DB) ([]web.SeafarerAssessmentData, error)
	FindByID(db *gorm.DB, id uint64) (web.SeafarerAssessmentData, error)
	FindBySeafarerCode(db *gorm.DB, seafarerCode string) ([]web.SeafarerAssessmentData, error)
	FindByAssessmentTypeID(db *gorm.DB, assessmentTypeID uint64) ([]web.SeafarerAssessmentData, error)
	AssignAssessment(db *gorm.DB, request *web.SeafarerAssessmentCreateRequest) (web.SeafarerAssessmentData, error)
	UpdateStatus(db *gorm.DB, request *web.SeafarerAssessmentUpdateStatusRequest) (web.SeafarerAssessmentData, error)
	IncrementAttempts(db *gorm.DB, seafarerCode string, assessmentTypeID uint64) (web.SeafarerAssessmentData, error)
	Delete(db *gorm.DB, id uint64) error
	CheckAssignment(db *gorm.DB, seafarerCode string, assessmentTypeID uint64) (web.AssignmentCheckResponse, error)
	CheckAssignmentWithRole(db *gorm.DB, seafarerCode string, assessmentTypeID uint64, role string) (web.AssignmentCheckResponse, error)
}

type seafarerAssessmentServiceImpl struct {
	SeafarerAssessmentRepository repositories.SeafarerAssessmentRepository
	ReportRepository            *repositories.ReportRepository
	Validate                     *validator.Validate
}

func NewSeafarerAssessmentService(seafarerAssessmentRepository repositories.SeafarerAssessmentRepository, reportRepository *repositories.ReportRepository, validate *validator.Validate) SeafarerAssessmentService {
	return &seafarerAssessmentServiceImpl{
		SeafarerAssessmentRepository: seafarerAssessmentRepository,
		ReportRepository:            reportRepository,
		Validate:                     validate,
	}
}

func (service *seafarerAssessmentServiceImpl) FindAll(db *gorm.DB) ([]web.SeafarerAssessmentData, error) {
	seafarerAssessments, err := service.SeafarerAssessmentRepository.FindAll(db)
	if err != nil {
		return []web.SeafarerAssessmentData{}, err
	}

	var seafarerAssessmentDataList []web.SeafarerAssessmentData
	for _, seafarerAssessment := range seafarerAssessments {
		seafarerAssessmentDataList = append(seafarerAssessmentDataList, converter.SeafarerAssessmentToSeafarerAssessmentData(&seafarerAssessment))
	}

	return seafarerAssessmentDataList, nil
}

func (service *seafarerAssessmentServiceImpl) FindByID(db *gorm.DB, id uint64) (web.SeafarerAssessmentData, error) {
	seafarerAssessment, err := service.SeafarerAssessmentRepository.FindByID(db, id)
	if err != nil {
		return web.SeafarerAssessmentData{}, err
	}

	return converter.SeafarerAssessmentToSeafarerAssessmentData(&seafarerAssessment), nil
}

func (service *seafarerAssessmentServiceImpl) FindBySeafarerCode(db *gorm.DB, seafarerCode string) ([]web.SeafarerAssessmentData, error) {
	seafarerAssessments, err := service.SeafarerAssessmentRepository.FindBySeafarerCode(db, seafarerCode)
	if err != nil {
		return []web.SeafarerAssessmentData{}, err
	}

	var seafarerAssessmentDataList []web.SeafarerAssessmentData
	for _, seafarerAssessment := range seafarerAssessments {
		seafarerAssessmentDataList = append(seafarerAssessmentDataList, converter.SeafarerAssessmentToSeafarerAssessmentData(&seafarerAssessment))
	}

	return seafarerAssessmentDataList, nil
}

func (service *seafarerAssessmentServiceImpl) FindByAssessmentTypeID(db *gorm.DB, assessmentTypeID uint64) ([]web.SeafarerAssessmentData, error) {
	seafarerAssessments, err := service.SeafarerAssessmentRepository.FindByAssessmentTypeID(db, assessmentTypeID)
	if err != nil {
		return []web.SeafarerAssessmentData{}, err
	}

	var seafarerAssessmentDataList []web.SeafarerAssessmentData
	for _, seafarerAssessment := range seafarerAssessments {
		seafarerAssessmentDataList = append(seafarerAssessmentDataList, converter.SeafarerAssessmentToSeafarerAssessmentData(&seafarerAssessment))
	}

	return seafarerAssessmentDataList, nil
}

func (service *seafarerAssessmentServiceImpl) AssignAssessment(db *gorm.DB, request *web.SeafarerAssessmentCreateRequest) (web.SeafarerAssessmentData, error) {
	err := service.Validate.Struct(request)
	if err != nil {
		return web.SeafarerAssessmentData{}, err
	}

	seafarerAssessment := converter.SeafarerAssessmentCreateRequestToSeafarerAssessment(request)
	err = service.SeafarerAssessmentRepository.Create(db, &seafarerAssessment)
	if err != nil {
		return web.SeafarerAssessmentData{}, err
	}

	return converter.SeafarerAssessmentToSeafarerAssessmentData(&seafarerAssessment), nil
}

func (service *seafarerAssessmentServiceImpl) UpdateStatus(db *gorm.DB, request *web.SeafarerAssessmentUpdateStatusRequest) (web.SeafarerAssessmentData, error) {
	err := service.Validate.Struct(request)
	if err != nil {
		return web.SeafarerAssessmentData{}, err
	}

	seafarerAssessment, err := service.SeafarerAssessmentRepository.FindByID(db, request.ID)
	if err != nil {
		return web.SeafarerAssessmentData{}, err
	}

	seafarerAssessment.Status = request.Status
	err = service.SeafarerAssessmentRepository.Update(db, &seafarerAssessment)
	if err != nil {
		return web.SeafarerAssessmentData{}, err
	}

	return converter.SeafarerAssessmentToSeafarerAssessmentData(&seafarerAssessment), nil
}

func (service *seafarerAssessmentServiceImpl) Delete(db *gorm.DB, id uint64) error {
	return service.SeafarerAssessmentRepository.Delete(db, id)
}

func (service *seafarerAssessmentServiceImpl) IncrementAttempts(db *gorm.DB, seafarerCode string, assessmentTypeID uint64) (web.SeafarerAssessmentData, error) {
	seafarerAssessment, err := service.SeafarerAssessmentRepository.FindBySeafarerCodeAndAssessmentTypePreferActiveBatch(db, seafarerCode, assessmentTypeID)
	if err != nil {
		return web.SeafarerAssessmentData{}, err
	}

	// Increment the attempts count
	seafarerAssessment.AttemptsCount++
	err = service.SeafarerAssessmentRepository.Update(db, &seafarerAssessment)
	if err != nil {
		return web.SeafarerAssessmentData{}, err
	}

	return converter.SeafarerAssessmentToSeafarerAssessmentData(&seafarerAssessment), nil
}

func (service *seafarerAssessmentServiceImpl) CheckAssignment(db *gorm.DB, seafarerCode string, assessmentTypeID uint64) (web.AssignmentCheckResponse, error) {
	seafarerAssessment, err := service.SeafarerAssessmentRepository.FindBySeafarerCodeAndAssessmentTypePreferActiveBatch(db, seafarerCode, assessmentTypeID)
	
	if err != nil {
		// If record not found, it means not assigned
		if err == gorm.ErrRecordNotFound {
			return web.AssignmentCheckResponse{
				IsAssigned: false,
				Message: "Seafarer dengan kode '" + seafarerCode + "' tidak diassign untuk assessment type ini. Silakan hubungi administrator untuk mendapatkan akses.",
				SeafarerCode: seafarerCode,
				AssessmentTypeID: assessmentTypeID,
				AttemptsCount: 0,
				MaxAttempts: nil,
			}, nil
		}
		// Other errors should return error
		return web.AssignmentCheckResponse{}, err
	}

	// Record found, so it's assigned. Now fetch the report data
	report, reportErr := service.ReportRepository.FindBySeafarerCode(db, seafarerCode, &domain.Report{})
	
	// Convert to web.ReportData if report found
	var reportData *web.ReportData
	if reportErr == nil {
		reportWebData := web.ReportData{
			ID: report.ID,
			SeamanCode: report.SeamanCode,
			SeafarerCode: report.SeafarerCode,
			Nama: report.Nama,
			IDP: report.IDP,
			Jabatan: report.Jabatan,
			VesselName: report.VesselName,
			Certificate: report.Certificate,
			Age: report.Age,
			TanggalLahir: report.TanggalLahir,
			StartDate: report.StartDate,
		}
		reportData = &reportWebData
	}

	// Fetch assessment type to get max attempts
	var assessmentType domain.AssessmentType
	_ = db.Where("id = ?", assessmentTypeID).First(&assessmentType).Error
	
	response := web.AssignmentCheckResponse{
		IsAssigned: true,
		Message: "Seafarer is assigned to this assessment type",
		SeafarerCode: seafarerCode,
		AssessmentTypeID: assessmentTypeID,
		PersonalData: reportData,
		AttemptsCount: seafarerAssessment.AttemptsCount,
		MaxAttempts: assessmentType.MaxAttempts,
	}

	return response, nil
}

func (service *seafarerAssessmentServiceImpl) CheckAssignmentWithRole(db *gorm.DB, seafarerCode string, assessmentTypeID uint64, role string) (web.AssignmentCheckResponse, error) {
	seafarerAssessment, err := service.SeafarerAssessmentRepository.FindBySeafarerCodeAndAssessmentType(db, seafarerCode, assessmentTypeID)
	
	if err != nil {
		// If record not found, it means not assigned
		if err == gorm.ErrRecordNotFound {
			return web.AssignmentCheckResponse{
				IsAssigned: false,
				Message: "Seafarer dengan kode '" + seafarerCode + "' tidak diassign untuk assessment type ini. Silakan hubungi administrator untuk mendapatkan akses.",
				SeafarerCode: seafarerCode,
				AssessmentTypeID: assessmentTypeID,
				AttemptsCount: 0,
				MaxAttempts: nil,
			}, nil
		}
		// Other errors should return error
		return web.AssignmentCheckResponse{}, err
	}

	// Fetch assessment type to get max attempts and verify it matches the assessment
	var assessmentType domain.AssessmentType
	if err := db.Where("id = ?", assessmentTypeID).First(&assessmentType).Error; err != nil {
		return web.AssignmentCheckResponse{
			IsAssigned: false,
			Message: "Assessment type tidak ditemukan",
			SeafarerCode: seafarerCode,
			AssessmentTypeID: assessmentTypeID,
			AttemptsCount: 0,
			MaxAttempts: nil,
		}, nil
	}

	// Check if there's an assessment with this assessment_type_id and role
	var assessment domain.Assessment
	if err := db.Where("assess_type_id = ? AND role = ?", assessmentTypeID, role).First(&assessment).Error; err != nil {
		return web.AssignmentCheckResponse{
			IsAssigned: false,
			Message: "Role '" + role + "' tidak sesuai dengan assessment type yang di-assign. Pastikan Anda membuka halaman assessment yang benar.",
			SeafarerCode: seafarerCode,
			AssessmentTypeID: assessmentTypeID,
			AttemptsCount: seafarerAssessment.AttemptsCount,
			MaxAttempts: assessmentType.MaxAttempts,
		}, nil
	}

	// Record found, so it's assigned. Now fetch the report data
	report, reportErr := service.ReportRepository.FindBySeafarerCode(db, seafarerCode, &domain.Report{})

	// Convert to web.ReportData if report found
	var reportData *web.ReportData
	if reportErr == nil {
		reportWebData := web.ReportData{
			ID: report.ID,
			SeamanCode: report.SeamanCode,
			SeafarerCode: report.SeafarerCode,
			Nama: report.Nama,
			IDP: report.IDP,
			Jabatan: report.Jabatan,
			VesselName: report.VesselName,
			Certificate: report.Certificate,
			Age: report.Age,
			TanggalLahir: report.TanggalLahir,
			StartDate: report.StartDate,
		}
		reportData = &reportWebData

		// Check if jabatan matches assessment name (case insensitive)
		jabatanUpper := strings.ToUpper(report.Jabatan)
		assessmentNameUpper := strings.ToUpper(assessment.AssessmentName)

		if jabatanUpper != assessmentNameUpper {
			return web.AssignmentCheckResponse{
				IsAssigned: false,
				Message: "Jabatan '" + report.Jabatan + "' tidak sesuai dengan assessment '" + assessment.AssessmentName + "'. Pastikan Anda membuka halaman assessment yang sesuai dengan jabatan Anda.",
				SeafarerCode: seafarerCode,
				AssessmentTypeID: assessmentTypeID,
				PersonalData: reportData,
				AttemptsCount: seafarerAssessment.AttemptsCount,
				MaxAttempts: assessmentType.MaxAttempts,
			}, nil
		}
	}

	response := web.AssignmentCheckResponse{
		IsAssigned: true,
		Message: "Seafarer is assigned to this assessment type and role matches",
		SeafarerCode: seafarerCode,
		AssessmentTypeID: assessmentTypeID,
		PersonalData: reportData,
		AttemptsCount: seafarerAssessment.AttemptsCount,
		MaxAttempts: assessmentType.MaxAttempts,
	}

	return response, nil
}


