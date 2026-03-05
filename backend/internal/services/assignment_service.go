package services

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"
	"errors"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type AssignmentService interface {
	FindPaged(db *gorm.DB, search string, status string, page int, pageSize int) (map[string]interface{}, error)
	FindAll(db *gorm.DB) ([]web.AssignmentData, error)
	FindByID(db *gorm.DB, id uint64) (web.AssignmentData, error)
	Create(db *gorm.DB, request *web.AssignmentCreateRequest) (web.AssignmentData, error)
	Update(db *gorm.DB, request *web.AssignmentUpdateRequest) (web.AssignmentData, error)
	Delete(db *gorm.DB, id uint64) error
	BulkCreate(db *gorm.DB, request *web.BulkAssignmentRequest) ([]web.AssignmentData, error)
}

type assignmentServiceImpl struct {
	AssignmentRepository repositories.AssignmentRepository
	Validate             *validator.Validate
}

func NewAssignmentService(repo repositories.AssignmentRepository, validate *validator.Validate) AssignmentService {
	return &assignmentServiceImpl{AssignmentRepository: repo, Validate: validate}
}

// Ambil semua assignment (JOIN ke tabel assessment_types & reports)
func (s *assignmentServiceImpl) FindAll(db *gorm.DB) ([]web.AssignmentData, error) {
	rows, err := s.AssignmentRepository.FindJoined(db)
	if err != nil {
		return nil, err
	}

	out := make([]web.AssignmentData, 0, len(rows))
	for _, row := range rows {
		out = append(out, web.AssignmentData{
			ID:               toUint64(row["id"]),
			SeafarerCode:     toString(row["seafarer_code"]),
			Nama:             toString(row["nama"]),
			AssessmentTypeID: toUint64(row["assessment_type_id"]),
			AssessmentType:   toString(row["assessment_type_name"]),
			Attempts: func() int {
				v := toInt(row["attempts"])
				if v == 0 {
					v = toInt(row["attempts_count"])
				}
				return v
			}(),
			Status:  toString(row["status"]),
			BatchID: toUint64Ptr(row["batch_id"]),
		})
	}
	return out, nil
}

// Ambil satu data by ID
func (s *assignmentServiceImpl) FindByID(db *gorm.DB, id uint64) (web.AssignmentData, error) {
	d, err := s.AssignmentRepository.FindByID(db, id)
	if err != nil {
		return web.AssignmentData{}, err
	}

	return web.AssignmentData{
		ID:               d.ID,
		SeafarerCode:     d.SeafarerCode,
		AssessmentTypeID: d.AssessmentTypeID,
		Attempts:         int(d.AttemptsCount),
		Status:           d.Status,
	}, nil
}

// Tambah satu assignment
func (s *assignmentServiceImpl) Create(db *gorm.DB, req *web.AssignmentCreateRequest) (web.AssignmentData, error) {
	if err := s.Validate.Struct(req); err != nil {
		return web.AssignmentData{}, err
	}

	exists, err := s.AssignmentRepository.Exists(db, req.SeafarerCode, req.AssessmentTypeID, req.BatchID)
	if err != nil {
		return web.AssignmentData{}, err
	}
	if exists {
		return web.AssignmentData{}, errors.New("assignment already exists")
	}

	data := domain.SeafarerAssessment{
		SeafarerCode:     req.SeafarerCode,
		AssessmentTypeID: req.AssessmentTypeID,
		BatchID:          req.BatchID,
		AttemptsCount:    0,
	}

	if err := s.AssignmentRepository.Create(db, &data); err != nil {
		return web.AssignmentData{}, err
	}

	return web.AssignmentData{
		ID:               data.ID,
		SeafarerCode:     data.SeafarerCode,
		AssessmentTypeID: data.AssessmentTypeID,
		BatchID:          data.BatchID,
		Attempts:         int(data.AttemptsCount),
		Status:           data.Status,
	}, nil
}

func (s *assignmentServiceImpl) Update(db *gorm.DB, req *web.AssignmentUpdateRequest) (web.AssignmentData, error) {
	if err := s.Validate.Struct(req); err != nil {
		return web.AssignmentData{}, err
	}

	data, err := s.AssignmentRepository.FindByID(db, req.ID)
	if err != nil {
		return web.AssignmentData{}, err
	}

	// 🔹 Update field sesuai input
	if req.AssessmentTypeID != 0 {
		data.AssessmentTypeID = req.AssessmentTypeID
	}
	if req.Status != "" {
		data.Status = req.Status
	}

	if err := s.AssignmentRepository.Update(db, &data); err != nil {
		return web.AssignmentData{}, err
	}

	return web.AssignmentData{
		ID:               data.ID,
		SeafarerCode:     data.SeafarerCode,
		Nama:             "", // bisa diisi join kalau ingin
		AssessmentTypeID: data.AssessmentTypeID,
		AssessmentType:   "",
		Attempts:         int(data.AttemptsCount),
		Status:           data.Status,
	}, nil
}

// Delete assignment by ID
func (s *assignmentServiceImpl) Delete(db *gorm.DB, id uint64) error {
	return s.AssignmentRepository.Delete(db, id)
}

// Bulk insert assignment
func (s *assignmentServiceImpl) BulkCreate(db *gorm.DB, req *web.BulkAssignmentRequest) ([]web.AssignmentData, error) {
	if err := s.Validate.Struct(req); err != nil {
		return nil, err
	}

	out := make([]web.AssignmentData, 0, len(req.Assignments))
	for _, a := range req.Assignments {
		if d, err := s.Create(db, &a); err == nil {
			out = append(out, d)
		}
	}
	return out, nil
}

func (s *assignmentServiceImpl) FindPaged(db *gorm.DB, search string, status string, page int, pageSize int) (map[string]interface{}, error) {
	rows, err := s.AssignmentRepository.FindAllPaged(db, search, status)
	if err != nil {
		return nil, err
	}

	data := make([]web.AssignmentData, 0, len(rows))
	for _, row := range rows {
		data = append(data, web.AssignmentData{
			ID:               toUint64(row["id"]),
			SeafarerCode:     toString(row["seafarer_code"]),
			Nama:             toString(row["nama"]),
			AssessmentTypeID: toUint64(row["assessment_type_id"]),
			AssessmentType:   toString(row["assessment_type_name"]),
			Status:           toString(row["status"]),
			Attempts:         toInt(row["attempts"]),
			BatchID:          toUint64Ptr(row["batch_id"]),
		})
	}

	return map[string]interface{}{
		"results": data,
		"total":   len(data),
	}, nil
}

/* -------------------- Helper Functions -------------------- */

func toString(v interface{}) string {
	if v == nil {
		return ""
	}
	return v.(string)
}

func toInt(v interface{}) int {
	switch x := v.(type) {
	case nil:
		return 0
	case int:
		return x
	case int64:
		return int(x)
	case uint64:
		return int(x)
	}
	return 0
}

func toUint64(v interface{}) uint64 {
	switch x := v.(type) {
	case nil:
		return 0
	case uint64:
		return x
	case int:
		return uint64(x)
	case int64:
		return uint64(x)
	}
	return 0
}

func toUint64Ptr(v interface{}) *uint64 {
	if v == nil {
		return nil
	}
	val := toUint64(v)
	return &val
}
