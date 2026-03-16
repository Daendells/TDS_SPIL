package services

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"
	"fmt"
	"net/http"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type BatchService struct {
	DB              *gorm.DB
	Log             *logrus.Logger
	Validate        *validator.Validate
	BatchRepository *repositories.BatchRepository
}

func NewBatchService(db *gorm.DB, log *logrus.Logger, validate *validator.Validate, repo *repositories.BatchRepository) *BatchService {
	return &BatchService{
		DB:              db,
		Log:             log,
		Validate:        validate,
		BatchRepository: repo,
	}
}

func (s *BatchService) Create(req web.CreateBatchRequest) (*web.SuccessResponse, error) {
	// Transaction to ensure batch_no consistency
	var batch domain.Batch
	err := s.DB.Transaction(func(tx *gorm.DB) error {
		// Find latest batch to increment number
		latest, err := s.BatchRepository.FindLatest(tx)
		nextNo := 1
		if err == nil && latest != nil {
			nextNo = latest.BatchNo + 1
		}

		batch = domain.Batch{
			BatchNo:   nextNo,
			BatchName: req.BatchName,
			Type:      req.Type,
			StartDate: req.StartDate,
			EndDate:   req.EndDate,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		return s.BatchRepository.Create(tx, &batch)
	})

	if err != nil {
		return nil, fmt.Errorf("failed to create batch: %w", err)
	}

	return &web.SuccessResponse{
		Code:   http.StatusCreated,
		Status: "Created",
		Data:   batch,
	}, nil
}

func (s *BatchService) FindAll(batchType string) (*web.SuccessResponse, error) {
	batches, err := s.BatchRepository.FindAll(s.DB, batchType)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch batches: %w", err)
	}

	var responses []web.BatchResponse
	for _, b := range batches {
		count, _ := s.BatchRepository.GetReportCountForBatch(s.DB, b.ID)
		responses = append(responses, web.BatchResponse{
			ID:          b.ID,
			BatchNo:     b.BatchNo,
			BatchName:   b.BatchName,
			Type:        b.Type,
			StartDate:   b.StartDate,
			EndDate:     b.EndDate,
			Status:      b.Status,
			SnapshotAt:  b.SnapshotAt,
			ReportCount: count,
		})
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   responses,
	}, nil
}

func (s *BatchService) FindByID(id int) (*web.SuccessResponse, error) {
	batch, err := s.BatchRepository.FindByID(s.DB, id)
	if err != nil {
		return nil, fmt.Errorf("batch not found: %w", err)
	}

	count, _ := s.BatchRepository.GetReportCountForBatch(s.DB, batch.ID)

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data: web.BatchResponse{
			ID:          batch.ID,
			BatchNo:     batch.BatchNo,
			BatchName:   batch.BatchName,
			Type:        batch.Type,
			StartDate:   batch.StartDate,
			EndDate:     batch.EndDate,
			Status:      batch.Status,
			SnapshotAt:  batch.SnapshotAt,
			ReportCount: count,
		},
	}, nil
}

// Update changes the start/end dates of a batch, validating there is no overlap with
// the immediately preceding and following batches (by batch_no).
func (s *BatchService) Update(id int, req web.UpdateBatchRequest) (*web.SuccessResponse, error) {
	batch, err := s.BatchRepository.FindByID(s.DB, id)
	if err != nil {
		return nil, fmt.Errorf("batch not found: %w", err)
	}

	if batch.Status == "completed" {
		return nil, fmt.Errorf("cannot edit a completed batch")
	}

	// Validate: no overlap with previous batch
	if prev, err := s.BatchRepository.FindByBatchNo(s.DB, batch.BatchNo-1); err == nil {
		if !req.StartDate.After(prev.EndDate) {
			return nil, fmt.Errorf("start date must be after batch %d end date (%s)", prev.BatchNo, prev.EndDate.Format("2006-01-02"))
		}
	}

	// Validate: no overlap with next batch
	if next, err := s.BatchRepository.FindByBatchNo(s.DB, batch.BatchNo+1); err == nil {
		if !req.EndDate.Before(next.StartDate) {
			return nil, fmt.Errorf("end date must be before batch %d start date (%s)", next.BatchNo, next.StartDate.Format("2006-01-02"))
		}
	}

	batch.BatchName = req.BatchName
	batch.StartDate = req.StartDate
	batch.EndDate = req.EndDate
	batch.Type = req.Type
	batch.UpdatedAt = time.Now()

	if err := s.BatchRepository.Update(s.DB, batch); err != nil {
		return nil, fmt.Errorf("failed to update batch: %w", err)
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   batch,
	}, nil
}
