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

func (s *TrainingService) Create(req *web.TrainingCreateRequest) (*web.SuccessResponse, error) {
	if err := s.Validate.Struct(req); err != nil {
		return nil, err
	}

	var competencyType domain.CompetencyType
	if err := s.DB.First(&competencyType, req.CompetencyTypeID).Error; err != nil {
		return nil, err
	}

	var maxNo int
	s.DB.Model(&domain.Training{}).Select("COALESCE(MAX(no), 0)").Scan(&maxNo)

	training := domain.Training{
		No:                maxNo + 1,
		CompetencyTypeID:  req.CompetencyTypeID,
		Level:             req.Lvl,
		DeskripsiPerilaku: req.DeskripsiPerilaku,
		ToolsTraining:     req.ToolsTraining,
		Kode:              req.Kode,
		TopikTraining:     req.TopikTraining,
	}

	if err := s.DB.Create(&training).Error; err != nil {
		return nil, err
	}

	if err := s.DB.Preload("CompetencyType").First(&training, training.No).Error; err != nil {
		return nil, err
	}

	return &web.SuccessResponse{
		Code:   http.StatusCreated,
		Status: "Created",
		Data:   training,
	}, nil
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

func (s *TrainingService) UpdateGeneratedFileURL(no int, fileURL string, pdfURL string) error {
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
		Where("no = ?", no).
		Updates(updates).Error
}

func (s *TrainingService) UpdateGeneratedQuizURL(no int, quizURL string) error {
	now := time.Now()
	updates := map[string]interface{}{
		"generated_quiz_url": quizURL,
		"generated_at":       now,
	}
	
	return s.DB.Model(&domain.Training{}).
		Where("no = ?", no).
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

func (s *TrainingService) UpdateReferensi(no string, referensi string) (*web.SuccessResponse, error) {
	var training domain.Training
	if err := s.DB.Where("no = ?", no).First(&training).Error; err != nil {
		s.Log.Errorf("Training tidak ditemukan: %v", err)
		return nil, err
	}

	training.Referensi = &referensi
	if err := s.DB.Save(&training).Error; err != nil {
		s.Log.Errorf("Gagal update referensi: %v", err)
		return nil, err
	}

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data: map[string]string{
			"message": "Referensi berhasil diupdate",
		},
	}, nil
}