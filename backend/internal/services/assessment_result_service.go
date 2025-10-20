package services

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"
	"encoding/json"
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
	Log                        *logrus.Logger
	Validate                   *validator.Validate
}

func NewAssessmentResultService(
	assessmentResultRepository repositories.AssessmentResultRepository,
	questionRepository repositories.QuestionRepository,
	optionRepository repositories.OptionRepository,
	log *logrus.Logger,
	validate *validator.Validate,
) AssessmentResultService {
	return &assessmentResultServiceImpl{
		AssessmentResultRepository: assessmentResultRepository,
		QuestionRepository:         questionRepository,
		OptionRepository:           optionRepository,
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

	// Find or create assessment result
	assessmentResult, err := service.AssessmentResultRepository.FindBySeafarerCode(db, request.SeafarerCode)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		service.Log.WithError(err).Error("Error finding assessment result")
		return nil, err
	}

	if assessmentResult == nil {
		// Create new assessment result
		assessmentResult = &domain.AssessmentResult{
			SeafarerCode:        request.SeafarerCode,
			VA1CategoryScores: "{}",
		}
		assessmentResult, err = service.AssessmentResultRepository.Create(db, assessmentResult)
		if err != nil {
			service.Log.WithError(err).Error("Error creating assessment result")
			return nil, err
		}
	}

	switch request.Role {
	case "va_1":
		err = service.calculateVA1Scores(db, assessmentResult, request.Answers)
	case "va_2":
		err = service.calculateVA2Scores(db, assessmentResult, request.Answers)
	case "va_3":
		err = service.calculateVA3Scores(db, assessmentResult, request.Answers)
	default:
		return nil, errors.New("invalid role")
	}

	if err != nil {
		service.Log.WithError(err).Error("Error calculating scores")
		return nil, err
	}

	service.calculateFinalScores(assessmentResult)

	assessmentResult, err = service.AssessmentResultRepository.Update(db, assessmentResult)
	if err != nil {
		service.Log.WithError(err).Error("Error updating assessment result")
		return nil, err
	}

	return service.convertToAssessmentResultData(assessmentResult), nil
}

func (service *assessmentResultServiceImpl) calculateVA1Scores(db *gorm.DB, assessmentResult *domain.AssessmentResult, answers map[int]int) error {
	allQuestions, err := service.QuestionRepository.FindAll(db)
	if err != nil {
		return err
	}

	var va1Questions []domain.Question
	for _, q := range allQuestions {
		if q.Role == "va_1" {
			va1Questions = append(va1Questions, q)
		}
	}

	for i := 0; i < len(va1Questions)-1; i++ {
		for j := i + 1; j < len(va1Questions); j++ {
			if va1Questions[i].QuestionID > va1Questions[j].QuestionID {
				va1Questions[i], va1Questions[j] = va1Questions[j], va1Questions[i]
			}
		}
	}

	questionIdToNumber := make(map[int]int)
	for i, q := range va1Questions {
		questionIdToNumber[q.QuestionID] = i + 1
	}

	categoryMappings := map[string][]int{
		"integrity":        {1, 6, 16, 21, 26, 31, 36},
		"customerOriented": {2, 7, 12, 17, 22, 27, 32, 37},
		"competitive":      {3, 8, 13, 18, 23, 28, 33, 38},
		"teamWork":         {4, 9, 14, 19, 24, 29, 34, 39},
		"visioner":         {5, 10, 15, 20, 25, 30, 35, 40},
	}

	categoryFactors := map[string]float64{
		"integrity":        24,
		"customerOriented": 12,
		"competitive":      31,
		"teamWork":         10,
		"visioner":         24,
	}

	categoryScores := make(map[string]float64)
	totalRawScore := 0

	for category, questionNumbers := range categoryMappings {
		categorySum := 0
		for _, questionNum := range questionNumbers {
			for questionId, questionNumber := range questionIdToNumber {
				if questionNumber == questionNum {
					if optionID, exists := answers[questionId]; exists {
						option, err := service.OptionRepository.FindById(db, optionID)
						if err != nil {
							service.Log.WithError(err).Errorf("Error finding option %d", optionID)
							continue
						}
						categorySum += option.Score
						totalRawScore += option.Score
					}
					break
				}
			}
		}
		// Calculate category score: (sum/40) * factor
		categoryScores[category] = (float64(categorySum) / 40.0) * categoryFactors[category]
	}

	// Calculate COREVA OCAI
	corevaOcai := categoryScores["integrity"] + categoryScores["customerOriented"] +
		categoryScores["competitive"] + categoryScores["teamWork"] + categoryScores["visioner"]

	categoryScoresJSON, err := json.Marshal(map[string]float64{
		"integrity":        categoryScores["integrity"],
		"customerOriented": categoryScores["customerOriented"],
		"competitive":      categoryScores["competitive"],
		"teamWork":         categoryScores["teamWork"],
		"visioner":         categoryScores["visioner"],
	})
	if err != nil {
		return err
	}

	assessmentResult.VA1RawScore = totalRawScore
	assessmentResult.VA1CategoryScores = string(categoryScoresJSON)
	assessmentResult.CorevaOcai = corevaOcai

	service.Log.Infof("VA1 Calculation - Total Raw Score: %d, COREVA OCAI: %f", totalRawScore, corevaOcai)
	service.Log.Infof("Category Scores: %s", string(categoryScoresJSON))

	return nil
}

func (service *assessmentResultServiceImpl) calculateVA2Scores(db *gorm.DB, assessmentResult *domain.AssessmentResult, answers map[int]int) error {
	totalScore := 0

	for _, optionID := range answers {
		option, err := service.OptionRepository.FindById(db, optionID)
		if err != nil {
			return err
		}
		totalScore += option.Score
	}

	assessmentResult.VA2RawScore = totalScore
	assessmentResult.AwareConverted = float64(totalScore)

	return nil
}

func (service *assessmentResultServiceImpl) calculateVA3Scores(db *gorm.DB, assessmentResult *domain.AssessmentResult, answers map[int]int) error {
	totalScore := 0

	for _, optionID := range answers {
		option, err := service.OptionRepository.FindById(db, optionID)
		if err != nil {
			return err
		}
		totalScore += option.Score
	}

	assessmentResult.VA3RawScore = totalScore
	assessmentResult.GritConverted = float64(totalScore)

	return nil
}

func (service *assessmentResultServiceImpl) calculateFinalScores(assessmentResult *domain.AssessmentResult) {
	assessmentResult.CorevaFinal = (assessmentResult.CorevaOcai / 100.0) * 40.0
	assessmentResult.AwareFinal = (assessmentResult.AwareConverted / 50.0) * 30.0
	assessmentResult.GritFinal = (assessmentResult.GritConverted / 48.0) * 30.0

	assessmentResult.TotalFinalScore = assessmentResult.CorevaFinal + assessmentResult.AwareFinal + assessmentResult.GritFinal

	if assessmentResult.VA1RawScore > 0 && assessmentResult.VA2RawScore > 0 && assessmentResult.VA3RawScore > 0 {
		assessmentResult.IsCompleted = true
		now := time.Now()
		assessmentResult.CompletedAt = &now
	}
}

func (service *assessmentResultServiceImpl) FindBySeafarerCode(db *gorm.DB, seafarerCode string) (*web.AssessmentResultData, error) {
	assessmentResult, err := service.AssessmentResultRepository.FindBySeafarerCode(db, seafarerCode)
	if err != nil {
		service.Log.WithError(err).Error("Error finding assessment result by seafarer code")
		return nil, err
	}

	return service.convertToAssessmentResultData(assessmentResult), nil
}

func (service *assessmentResultServiceImpl) convertToAssessmentResultData(assessmentResult *domain.AssessmentResult) *web.AssessmentResultData {
	return &web.AssessmentResultData{
		ID:                assessmentResult.ID,
		SeafarerCode:        assessmentResult.SeafarerCode,
		VA1RawScore:       assessmentResult.VA1RawScore,
		VA2RawScore:       assessmentResult.VA2RawScore,
		VA3RawScore:       assessmentResult.VA3RawScore,
		VA1CategoryScores: assessmentResult.VA1CategoryScores,
		CorevaOcai:        assessmentResult.CorevaOcai,
		AwareConverted:    assessmentResult.AwareConverted,
		GritConverted:     assessmentResult.GritConverted,
		CorevaFinal:       assessmentResult.CorevaFinal,
		AwareFinal:        assessmentResult.AwareFinal,
		GritFinal:         assessmentResult.GritFinal,
		TotalFinalScore:   assessmentResult.TotalFinalScore,
		IsCompleted:       assessmentResult.IsCompleted,
		CompletedAt:       assessmentResult.CompletedAt,
		CreatedAt:         assessmentResult.CreatedAt,
		UpdatedAt:         assessmentResult.UpdatedAt,
	}
}
