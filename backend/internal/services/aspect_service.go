package services

import (
	"backend/internal/models/converter"
	"backend/internal/models/web"
	"backend/internal/repositories"
	"errors"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type AspectService struct {
	DB               *gorm.DB
	Log              *logrus.Logger
	AspectRepository *repositories.AspectRepository
}

func NewAspectService(db *gorm.DB, log *logrus.Logger, aspectRepository *repositories.AspectRepository) *AspectService {
	return &AspectService{
		DB:               db,
		Log:              log,
		AspectRepository: aspectRepository,
	}
}

func (s *AspectService) Create(request *web.AspectCreateRequest) (*web.AspectData, error) {
	aspect := converter.AspectCreateRequestToAspect(request)

	err := s.AspectRepository.Create(s.DB, &aspect)
	if err != nil {
		s.Log.Errorf("Failed to create aspect: %v", err)
		return nil, err
	}

	result := converter.AspectToAspectData(&aspect)
	return &result, nil
}

func (s *AspectService) Update(id int, request *web.AspectUpdateRequest) (*web.AspectData, error) {
	existing, err := s.AspectRepository.FindByID(s.DB, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("aspect not found")
		}
		s.Log.Errorf("Failed to find aspect: %v", err)
		return nil, err
	}

	aspect := converter.AspectUpdateRequestToAspect(request, existing)
	aspect.ID = id

	err = s.AspectRepository.Update(s.DB, &aspect)
	if err != nil {
		s.Log.Errorf("Failed to update aspect: %v", err)
		return nil, err
	}

	result := converter.AspectToAspectData(&aspect)
	return &result, nil
}

func (s *AspectService) Delete(id int) error {
	aspect, err := s.AspectRepository.FindByID(s.DB, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("aspect not found")
		}
		s.Log.Errorf("Failed to find aspect: %v", err)
		return err
	}

	err = s.AspectRepository.Delete(s.DB, aspect)
	if err != nil {
		s.Log.Errorf("Failed to delete aspect: %v", err)
		return err
	}

	return nil
}

func (s *AspectService) FindByID(id int) (*web.AspectData, error) {
	aspect, err := s.AspectRepository.FindByID(s.DB, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("aspect not found")
		}
		s.Log.Errorf("Failed to find aspect: %v", err)
		return nil, err
	}

	result := converter.AspectToAspectData(aspect)
	return &result, nil
}

func (s *AspectService) FindAll() ([]web.AspectData, error) {
	aspects, err := s.AspectRepository.FindAll(s.DB)
	if err != nil {
		s.Log.Errorf("Failed to find all aspects: %v", err)
		return nil, err
	}

	var results []web.AspectData
	for _, aspect := range aspects {
		results = append(results, converter.AspectToAspectData(&aspect))
	}

	return results, nil
}

func (s *AspectService) FindByAssessmentID(assessmentID int) ([]web.AspectData, error) {
	aspects, err := s.AspectRepository.FindByAssessmentID(s.DB, assessmentID)
	if err != nil {
		s.Log.Errorf("Failed to find aspects by assessment ID: %v", err)
		return nil, err
	}

	var results []web.AspectData
	for _, aspect := range aspects {
		results = append(results, converter.AspectToAspectData(&aspect))
	}

	return results, nil
}

func (s *AspectService) AssignQuestionToAspect(aspectID int, questionID int) error {
	aspect, err := s.AspectRepository.FindByID(s.DB, aspectID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("aspect not found")
		}
		s.Log.Errorf("Failed to find aspect: %v", err)
		return err
	}

	aspect.QuestionID = &questionID

	err = s.AspectRepository.Update(s.DB, aspect)
	if err != nil {
		s.Log.Errorf("Failed to assign question to aspect: %v", err)
		return err
	}

	return nil
}
