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

func (s *TrainingService) UpdateGeneratedFileURL(kode string, fileURL string, pdfURL string) error {
	now := time.Now()
	updates := map[string]interface{}{
		"generated_at": now,
	}
	
	if fileURL != "" {
		updates["generated_file_url"] = fileURL
	}
	
	if pdfURL != "" {
		updates["generated_pdf_url"] = pdfURL
	}
	
	return s.DB.Model(&domain.Training{}).
		Where("kode = ?", kode).
		Updates(updates).Error
}

func (s *TrainingService) UpdateGeneratedQuizURL(kode string, quizURL string) error {
	now := time.Now()
	updates := map[string]interface{}{
		"generated_quiz_url": quizURL,
		"generated_at":       now,
	}
	
	return s.DB.Model(&domain.Training{}).
		Where("kode = ?", kode).
		Updates(updates).Error
}

func (s *TrainingService) Update(no string, req *web.TrainingUpdateRequest) (*web.SuccessResponse, error) {
	if err := s.Validate.Struct(req); err != nil {
		s.Log.Errorf("Validasi gagal: %v", err)
		return nil, err
	}

	training := domain.Training{
		Level:             req.Lvl,
		Kode:              req.Kode,
		TopikTraining:     req.TopikTraining,
		DeskripsiPerilaku: req.DeskripsiPerilaku,
		ToolsTraining:     req.ToolsTraining,
	}

	if err := s.DB.Model(&domain.Training{}).Where("no = ?", no).Updates(training).Error; err != nil {
		s.Log.Errorf("Gagal update training: %v", err)
		return nil, err
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data: map[string]string{
			"message": "Training berhasil diupdate",
		},
	}, nil
}

func (s *TrainingService) Delete(no string) (*web.SuccessResponse, error) {
	if err := s.DB.Where("no = ?", no).Delete(&domain.Training{}).Error; err != nil {
		s.Log.Errorf("Gagal delete training: %v", err)
		return nil, err
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data: map[string]string{
			"message": "Training berhasil dihapus",
		},
	}, nil
}