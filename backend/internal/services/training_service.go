package services

import (
	"net/http"
	"time"

	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/go-playground/validator/v10"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type TrainingService struct {
	DB                 *gorm.DB
	Log                *logrus.Logger
	Validate           *validator.Validate
	TrainingRepository *repositories.TrainingRepository
}

func NewTrainingService(
	db *gorm.DB,
	log *logrus.Logger,
	validate *validator.Validate,
	repo *repositories.TrainingRepository,
) *TrainingService {
	return &TrainingService{
		DB:                 db,
		Log:                log,
		Validate:           validate,
		TrainingRepository: repo,
	}
}

func (s *TrainingService) FindAll() (*web.SuccessResponse, error) {
	var rows []domain.Training	
	if err := s.TrainingRepository.FindAll(s.DB, &rows); err != nil {
		s.Log.Errorf("Gagal mengambil data training: %v", err)
		return nil, err
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   rows,
	}, nil
}

func (s *TrainingService) UpdateGeneratedFileURL(kode string, fileURL string) error {
	now := time.Now()
	return s.DB.Model(&domain.Training{}).
		Where("kode = ?", kode).
		Updates(map[string]interface{}{
			"generated_file_url": fileURL,
			"generated_at":       now,
		}).Error
}