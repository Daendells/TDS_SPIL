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

func (s *BatchService) FindAll() (*web.SuccessResponse, error) {
	batches, err := s.BatchRepository.FindAll(s.DB)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch batches: %w", err)
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   batches,
	}, nil
}
