package services

import (
	"fmt"

	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/go-playground/validator/v10"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type AssignmentService struct {
	DB               *gorm.DB
	Log              *logrus.Logger
	Validate         *validator.Validate
	AssignmentRepo   *repositories.AssignmentRepository
	MasterRepository *repositories.MasterRepository
}

// constructor menerima logger
func NewAssignmentService(
	db *gorm.DB,
	log *logrus.Logger,
	v *validator.Validate,
	ar *repositories.AssignmentRepository,
	mr *repositories.MasterRepository,
) *AssignmentService {
	return &AssignmentService{
		DB: db, Log: log, Validate: v, AssignmentRepo: ar, MasterRepository: mr,
	}
}

func (s *AssignmentService) AssignUser(req *web.AssignRequest) (*web.SuccessResponse, error) {
	if err := s.Validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}
	if req.StartDate.After(req.EndDate) {
		return nil, fmt.Errorf("start_date cannot be after end_date")
	}

	// 1️⃣ Cek overlap
	overlap, err := s.AssignmentRepo.ExistsOverlappingAssignment(
		s.DB, req.UserID, req.AssessmentID, req.StartDate, req.EndDate,
	)
	if err != nil {
		s.Log.WithError(err).Error("failed to check overlapping assignment")
		return nil, fmt.Errorf("failed to check overlapping assignment: %w", err)
	}
	if overlap {
		return nil, fmt.Errorf("assignment already exists in the same period for this assessment")
	}

	// 2️⃣ Insert baru
	assignment := domain.UserAssessment{
		UserID:       req.UserID,
		AssessmentID: req.AssessmentID,
		Attempt:      1,
		StartDate:    req.StartDate,
		EndDate:      req.EndDate,
		Status:       "ASSIGNED",
		Note:         req.Note,
	}

	if err := s.AssignmentRepo.Create(s.DB, &assignment); err != nil {
		s.Log.WithError(err).Error("failed to create assignment")
		return nil, fmt.Errorf("failed to create assignment: %w", err)
	}

	s.Log.WithFields(logrus.Fields{
		"user_id":       req.UserID,
		"assessment_id": req.AssessmentID,
		"start_date":    req.StartDate,
		"end_date":      req.EndDate,
	}).Info("assignment created successfully")

	return &web.SuccessResponse{
		Code:   201,
		Status: "Created",
		Data:   assignment,
	}, nil
}

func (s *AssignmentService) GetAssignmentsByUserID(userID int64) (*web.SuccessResponse, error) {
	assignments, err := s.AssignmentRepo.FindByUserID(s.DB, userID)
	if err != nil {
		s.Log.WithError(err).Error("failed to get assignments by user_id")
		return nil, fmt.Errorf("failed to get assignments: %w", err)
	}

	return &web.SuccessResponse{
		Code:   200,
		Status: "OK",
		Data:   assignments,
	}, nil
}

func (s *AssignmentService) DeleteAssignment(id uint64) (*web.SuccessResponse, error) {
	// cek dulu data
	existing, err := s.AssignmentRepo.FindByID(s.DB, id)
	if err != nil {
		return nil, fmt.Errorf("assignment not found: %w", err)
	}

	if err := s.AssignmentRepo.Delete(s.DB, id); err != nil {
		s.Log.WithError(err).Error("failed to delete assignment")
		return nil, fmt.Errorf("failed to delete assignment: %w", err)
	}

	s.Log.WithField("assignment_id", id).Info("assignment deleted")

	return &web.SuccessResponse{
		Code:   200,
		Status: "Deleted",
		Data:   existing,
	}, nil
}

func (s *AssignmentService) GetAssignments(limit int) (*web.SuccessResponse, error) {
	assignments, err := s.AssignmentRepo.FindWithLimit(s.DB, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get assignments: %w", err)
	}

	return &web.SuccessResponse{
		Code:   200,
		Status: "OK",
		Data:   assignments,
	}, nil
}

// Bulk assign untuk banyak user
func (s *AssignmentService) AssignMultiple(req *web.AssignMultiRequest) (*web.SuccessResponse, error) {
	if err := s.Validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}
	if req.StartDate.After(req.EndDate) {
		return nil, fmt.Errorf("start_date cannot be after end_date")
	}

	var created []domain.UserAssessment

	for _, uid := range req.UserIDs {
		overlap, err := s.AssignmentRepo.ExistsOverlappingAssignment(
			s.DB, uid, req.AssessmentID, req.StartDate, req.EndDate,
		)
		if err != nil {
			s.Log.WithError(err).Errorf("failed to check overlap for user %d", uid)
			continue
		}
		if overlap {
			s.Log.WithField("user_id", uid).Warn("skipped due to overlap")
			continue
		}

		assignment := domain.UserAssessment{
			UserID:       uid,
			AssessmentID: req.AssessmentID,
			Attempt:      1,
			StartDate:    req.StartDate,
			EndDate:      req.EndDate,
			Status:       req.Status,
			Note:         req.Note,
		}

		if err := s.AssignmentRepo.Create(s.DB, &assignment); err != nil {
			s.Log.WithError(err).Error("failed create assignment")
			continue
		}

		created = append(created, assignment)
	}

	return &web.SuccessResponse{
		Code:   201,
		Status: "Created",
		Data:   created,
	}, nil
}

// UpdateAssignment dengan preload relasi
func (s *AssignmentService) UpdateAssignment(id uint64, req *web.AssignRequest) (*web.SuccessResponse, error) {
	if err := s.Validate.Struct(req); err != nil {
		return nil, fmt.Errorf("validation error: %w", err)
	}

	existing, err := s.AssignmentRepo.FindByID(s.DB, id)
	if err != nil {
		return nil, fmt.Errorf("assignment not found: %w", err)
	}

	if req.StartDate.After(req.EndDate) {
		return nil, fmt.Errorf("start_date cannot be after end_date")
	}

	overlap, err := s.AssignmentRepo.ExistsOverlappingAssignment(
		s.DB, req.UserID, req.AssessmentID, req.StartDate, req.EndDate,
	)
	if err != nil {
		return nil, err
	}
	if overlap && (existing.UserID != req.UserID || existing.AssessmentID != req.AssessmentID) {
		return nil, fmt.Errorf("cannot update — overlapping assignment exists in same period")
	}

	existing.StartDate = req.StartDate
	existing.EndDate = req.EndDate
	existing.Note = req.Note
	existing.Status = req.Status
	existing.AssessmentID = req.AssessmentID

	if err := s.AssignmentRepo.Update(s.DB, existing); err != nil {
		s.Log.WithError(err).Error("failed to update assignment")
		return nil, fmt.Errorf("failed to update assignment: %w", err)
	}

	// ✅ preload ulang relasi agar nama assessment & user langsung muncul
	updated, _ := s.AssignmentRepo.FindByID(s.DB, id)

	return &web.SuccessResponse{
		Code:   200,
		Status: "Updated",
		Data:   updated,
	}, nil
}

func (s *AssignmentService) GetAllAssignments(limit int) (*web.SuccessResponse, error) {
	assignments, err := s.AssignmentRepo.FindAll(s.DB, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch all assignments: %w", err)
	}

	return &web.SuccessResponse{
		Code:   200,
		Status: "OK",
		Data:   assignments,
	}, nil
}
