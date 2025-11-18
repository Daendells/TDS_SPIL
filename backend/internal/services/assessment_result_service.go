package services

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"
	"errors"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type AssessmentResultService interface {
	SubmitAssessment(db *gorm.DB, request *web.AssessmentSubmitRequest) (*web.AssessmentResultData, error)
	FindBySeafarerCode(db *gorm.DB, seafarerCode string) (*web.AssessmentResultData, error)
}

type assessmentResultServiceImpl struct {
	AssessmentResultRepository repositories.AssessmentResultRepository
	QuestionRepository         repositories.QuestionRepository
	OptionRepository           repositories.OptionRepository
	ReportRepository           *repositories.ReportRepository
	Log                        *logrus.Logger
	Validate                   *validator.Validate
}

func NewAssessmentResultService(
	assessmentResultRepository repositories.AssessmentResultRepository,
	questionRepository repositories.QuestionRepository,
	optionRepository repositories.OptionRepository,
	reportRepository *repositories.ReportRepository,
	log *logrus.Logger,
	validate *validator.Validate,
) AssessmentResultService {
	return &assessmentResultServiceImpl{
		AssessmentResultRepository: assessmentResultRepository,
		QuestionRepository:         questionRepository,
		OptionRepository:           optionRepository,
		ReportRepository:           reportRepository,
		Log:                        log,
		Validate:                   validate,
	}
}

func (service *assessmentResultServiceImpl) SubmitAssessment(db *gorm.DB, request *web.AssessmentSubmitRequest) (*web.AssessmentResultData, error) {
	err := service.Validate.Struct(request)
	if err != nil {
		service.Log.WithError(err).Error("Error validating assessment submit request")
		return nil, err
	}

	// Get assessment by role
	var assessment domain.Assessment
	if err := db.Where("role = ?", request.Role).First(&assessment).Error; err != nil {
		service.Log.WithError(err).Error("Error finding assessment by role")
		return nil, err
	}

	// Find or create assessment result
	var assessmentResult *domain.AssessmentResult
	err = db.Where("seafarer_code = ? AND assessment_id = ?", request.SeafarerCode, assessment.AssessmentID).
		First(&assessmentResult).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Create new assessment result
		assessmentResult = &domain.AssessmentResult{
			SeafarerCode: request.SeafarerCode,
			AssessmentID: int64(assessment.AssessmentID),
			IsCompleted:  0,
		}
		if err := db.Create(assessmentResult).Error; err != nil {
			service.Log.WithError(err).Error("Error creating assessment result")
			return nil, err
		}
	} else if err != nil {
		service.Log.WithError(err).Error("Error finding assessment result")
		return nil, err
	}

	// Calculate scores based on aspects
	err = service.calculateAspectScores(db, assessmentResult, request.Answers, int(assessment.AssessmentID))
	if err != nil {
		service.Log.WithError(err).Error("Error calculating aspect scores")
		return nil, err
	}

	// Mark as completed
	assessmentResult.IsCompleted = 1
	now := time.Now()
	assessmentResult.CompletedAt = &now

	// Update assessment result
	if err := db.Save(assessmentResult).Error; err != nil {
		service.Log.WithError(err).Error("Error updating assessment result")
		return nil, err
	}

	// Reload with relations
	if err := db.Preload("ScoreResults.Aspect").First(assessmentResult, assessmentResult.ID).Error; err != nil {
		service.Log.WithError(err).Error("Error reloading assessment result")
		return nil, err
	}

	return service.convertToAssessmentResultData(assessmentResult), nil
}

func (service *assessmentResultServiceImpl) calculateAspectScores(db *gorm.DB, assessmentResult *domain.AssessmentResult, answers map[int]int, assessmentID int) error {
	// Get all aspects for this assessment
	var aspects []domain.Aspect
	if err := db.Where("assessment_id = ?", assessmentID).Find(&aspects).Error; err != nil {
		return err
	}

	// Group questions by aspect
	questionAspectMap := make(map[int]int) // questionID -> aspectID
	var questions []domain.Question
	if err := db.Where("assessment_id = ?", assessmentID).Find(&questions).Error; err != nil {
		return err
	}

	for _, q := range questions {
		if q.AspectID != nil {
			questionAspectMap[q.QuestionID] = int(*q.AspectID)
		}
	}

	// Calculate raw scores per aspect
	aspectRawScores := make(map[int]int)
	for questionID, optionID := range answers {
		option, err := service.OptionRepository.FindById(db, optionID)
		if err != nil {
			service.Log.WithError(err).Errorf("Error finding option %d", optionID)
			continue
		}

		if aspectID, exists := questionAspectMap[questionID]; exists {
			aspectRawScores[aspectID] += option.Score
		}
	}

	// Create or update score results for each aspect
	for _, aspect := range aspects {
		rawScore := aspectRawScores[aspect.ID]
		// Calculate final score based on weight
		finalScore := (rawScore * aspect.Weight) / 100

		// Check if score result already exists
		var existingScoreResult domain.ScoreResult
		err := db.Where("assessment_result_id = ? AND aspect_id = ?", assessmentResult.ID, aspect.ID).
			First(&existingScoreResult).Error

		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Create new score result
			scoreResult := domain.ScoreResult{
				RawScore:           rawScore,
				FinalScore:         finalScore,
				AssessmentResultID: assessmentResult.ID,
				AspectID:           aspect.ID,
			}
			if err := db.Create(&scoreResult).Error; err != nil {
				return err
			}
		} else if err != nil {
			return err
		} else {
			// Update existing score result
			existingScoreResult.RawScore = rawScore
			existingScoreResult.FinalScore = finalScore
			if err := db.Save(&existingScoreResult).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

func (service *assessmentResultServiceImpl) FindBySeafarerCode(db *gorm.DB, seafarerCode string) (*web.AssessmentResultData, error) {
	assessmentResult, err := service.AssessmentResultRepository.FindBySeafarerCode(db, seafarerCode)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("assessment result not found")
		}
		service.Log.WithError(err).Error("Error finding assessment result by seafarer code")
		return nil, err
	}

	return service.convertToAssessmentResultData(assessmentResult), nil
}

func (service *assessmentResultServiceImpl) convertToAssessmentResultData(assessmentResult *domain.AssessmentResult) *web.AssessmentResultData {
	data := &web.AssessmentResultData{
		ID:           assessmentResult.ID,
		SeafarerCode: assessmentResult.SeafarerCode,
		AssessmentID: assessmentResult.AssessmentID,
		IsCompleted:  assessmentResult.IsCompleted,
		CompletedAt:  assessmentResult.CompletedAt,
		CreatedAt:    assessmentResult.CreatedAt,
		UpdatedAt:    assessmentResult.UpdatedAt,
	}

	// Convert score results if available
	if len(assessmentResult.ScoreResults) > 0 {
		data.ScoreResults = make([]web.ScoreResultData, len(assessmentResult.ScoreResults))
		for i, sr := range assessmentResult.ScoreResults {
			scoreData := web.ScoreResultData{
				ID:                 sr.ID,
				RawScore:           sr.RawScore,
				FinalScore:         sr.FinalScore,
				AssessmentResultID: sr.AssessmentResultID,
				AspectID:           sr.AspectID,
			}

			// Convert aspect if available
			if sr.Aspect != nil {
				aspectData := web.AspectData{
					ID:           sr.Aspect.ID,
					Name:         sr.Aspect.Name,
					Weight:       sr.Aspect.Weight,
					AssessmentID: sr.Aspect.AssessmentID,
					QuestionID:   sr.Aspect.QuestionID,
				}
				scoreData.Aspect = &aspectData
			}

			data.ScoreResults[i] = scoreData
		}
	}

	return data
}
