package services

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"
	"encoding/json"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type QuizService interface {
	GetQuizData(db *gorm.DB, assessmentTypeId uint64) (web.QuizDataResponse, error)
	SubmitQuiz(db *gorm.DB, request web.QuizSubmitRequest) (web.QuizAttemptResponse, error)
	GetQuizHistory(db *gorm.DB, seamanCode string) ([]web.QuizAttemptResponse, error)
	GetQuizAttempt(db *gorm.DB, attemptId int) (web.QuizAttemptDetailResponse, error)
}

type quizServiceImpl struct {
	AssessmentTypeRepository repositories.AssessmentTypeRepository
	AssessmentRepository     repositories.AssessmentRepository
	QuestionRepository       repositories.QuestionRepository
	OptionRepository         repositories.OptionRepository
	Validate                 *validator.Validate
}

func NewQuizService(
	assessmentTypeRepository repositories.AssessmentTypeRepository,
	assessmentRepository repositories.AssessmentRepository,
	questionRepository repositories.QuestionRepository,
	optionRepository repositories.OptionRepository,
	validate *validator.Validate,
) QuizService {
	return &quizServiceImpl{
		AssessmentTypeRepository: assessmentTypeRepository,
		AssessmentRepository:     assessmentRepository,
		QuestionRepository:       questionRepository,
		OptionRepository:         optionRepository,
		Validate:                 validate,
	}
}

func (service *quizServiceImpl) GetQuizData(db *gorm.DB, assessmentTypeId uint64) (web.QuizDataResponse, error) {
	// 1. Fetch Assessment Type
	assessmentType, err := service.AssessmentTypeRepository.FindByID(db, assessmentTypeId)
	if err != nil {
		return web.QuizDataResponse{}, err
	}

	// 2. Fetch Assessments linked to this type
	var assessments []domain.Assessment
	err = db.Where("assess_type_id = ?", assessmentTypeId).Find(&assessments).Error
	if err != nil {
		return web.QuizDataResponse{}, err
	}

	var quizAssessments []web.QuizAssessmentSection
	totalQuestions := 0

	for _, assessment := range assessments {
		// 3. Fetch Questions for each Assessment
		questionsData, err := service.QuestionRepository.FindByAssessmentId(db, assessment.AssessmentID)
		if err != nil {
			// If error, maybe just continue or log? For now return error
			return web.QuizDataResponse{}, err
		}
		
		var webQuestions []web.QuestionOptionPublicResponse
		
		for _, q := range questionsData {
			// Fetch Options
			options, _ := service.OptionRepository.FindByQuestionId(db, q.QuestionID)
			
			var webOptions []web.OptionPublicResponse
			for _, opt := range options {
				webOptions = append(webOptions, web.OptionPublicResponse{
					OptionID:     opt.OptionID,
					OptionLetter: opt.OptionLetter,
					OptionText:   opt.OptionText,
					IsImage:      opt.IsImage,
					ImageUrl:     opt.ImageUrl,
				})
			}
			
			// Map QuestionType
			// QuestionType is string (enum) in domain, default 'single_choice'
			qType := q.QuestionType
			if qType == "" {
				qType = "single_choice"
			}
			
			webQuestions = append(webQuestions, web.QuestionOptionPublicResponse{
				QuestionId:   q.QuestionID,
				QuestionText: q.QuestionText,
				Category:     safeString(q.Category),
				IsImage:      safeString(q.IsImage),
				ImageUrl:     safeString(q.ImageURL),
				Options:      webOptions,
				QuestionType: qType,
			})
			totalQuestions++
		}
		
		timerLimit := uint64(0)
		if assessment.TimerLimitMinutes != nil {
			timerLimit = *assessment.TimerLimitMinutes
		}

		quizAssessments = append(quizAssessments, web.QuizAssessmentSection{
			AssessmentID:      assessment.AssessmentID,
			AssessmentName:    assessment.AssessmentName,
			UsingTimer:        assessment.UsingTimer,
			TimerLimitMinutes: &timerLimit,
			Questions:         webQuestions,
		})
	}

	return web.QuizDataResponse{
		AssessmentTypeID:   assessmentType.ID,
		AssessmentTypeName: assessmentType.AssessmentTypeName,
		Assessments:        quizAssessments,
		TotalQuestions:     totalQuestions,
	}, nil
}

func (service *quizServiceImpl) SubmitQuiz(db *gorm.DB, request web.QuizSubmitRequest) (web.QuizAttemptResponse, error) {
	err := service.Validate.Struct(request)
	if err != nil {
		return web.QuizAttemptResponse{}, err
	}

	// Calculate Score
	totalScore := 0.0
	maxScore := 0.0
	
	// Fetch Quiz Data to get structure (efficient way would be direct query but reuse implies consistency)
	// We need validation of questions and options.
	
	quizData, err := service.GetQuizData(db, request.AssessmentTypeID)
	if err != nil {
		return web.QuizAttemptResponse{}, err
	}

	// Refetching detailed data for validation and hidden fields (correct answers)
	var questionDetailsMap = make(map[int]domain.Question)
	var optionDetailsMap = make(map[int][]domain.Option)
	
	for _, section := range quizData.Assessments {
		for _, q := range section.Questions {
			qID := q.QuestionId
			var domainQ domain.Question
			if err := db.Where("question_id = ?", qID).First(&domainQ).Error; err == nil {
				questionDetailsMap[qID] = domainQ
			}
			
			options, _ := service.OptionRepository.FindByQuestionId(db, qID)
			optionDetailsMap[qID] = options
			
			// Each question is worth 100 points
			maxScore += 100.0
		}
	}
	
	// Process Answers
	var userAnswers []domain.UserAnswer
	
	for _, ans := range request.Answers {
		question, exists := questionDetailsMap[ans.QuestionID]
		if !exists {
			continue // Skip invalid questions
		}
		
		scoreEarned := 0.0
		isCorrect := false
		qType := question.QuestionType
		if qType == "" {
			qType = "single_choice"
		}
		
		if qType == "short_answer" {
			// Check text answer vs AcceptableAnswers (JSON array string)
			if ans.TextAnswer != nil && question.AcceptableAnswers != nil {
				var acceptable []string
				// Unmarshal the string content of AcceptableAnswers
				if err := json.Unmarshal([]byte(*question.AcceptableAnswers), &acceptable); err == nil {
					userText := strings.TrimSpace(strings.ToLower(*ans.TextAnswer))
					for _, acc := range acceptable {
						if strings.TrimSpace(strings.ToLower(acc)) == userText {
							scoreEarned = 100.0
							isCorrect = true
							break
						}
					}
				}
			}
		} else {
			// Choice-based questions
			options := optionDetailsMap[ans.QuestionID]
			
			// Identify correct option IDs (those with positive score or score percentage)
			var correctOptionIDs []int
			for _, opt := range options {
				if opt.ScorePercentage > 0 || opt.Score > 0 {
					correctOptionIDs = append(correctOptionIDs, opt.OptionID)
				}
			}

			if qType == "multiple_choice" || qType == "match_choice" {
				// Strict validation: 
				// 1. Count of selected must match count of correct options
				// 2. All selected must be in correctOptionIDs
				
				isAllCorrect := false
				if len(ans.SelectedOptions) == len(correctOptionIDs) {
					matchCount := 0
					for _, selID := range ans.SelectedOptions {
						for _, corrID := range correctOptionIDs {
							if selID == corrID {
								matchCount++
								break
							}
						}
					}
					if matchCount == len(correctOptionIDs) {
						isAllCorrect = true
					}
				}

				if isAllCorrect {
					scoreEarned = 100.0
					isCorrect = true
				} else {
					scoreEarned = 0.0
					isCorrect = false
				}
			} else {
				// Fallback (e.g. single_choice), just sum the scores
				// Usually single_choice has 1 correct option with 100 score
				tempScore := 0.0
				for _, selectedOptID := range ans.SelectedOptions {
					for _, opt := range options {
						if opt.OptionID == selectedOptID {
							if opt.ScorePercentage != 0 {
								tempScore += opt.ScorePercentage
							} else if opt.Score > 0 {
								tempScore += 100.0
							}
						}
					}
				}
				scoreEarned = tempScore
				if scoreEarned > 100 { scoreEarned = 100 }
				if scoreEarned < 0 { scoreEarned = 0 }
				
				if scoreEarned >= 100.0 {
					isCorrect = true
				}
			}
		}
		
		totalScore += scoreEarned
		
		// Create UserAnswer entry
		selectedOptionsBytes, _ := json.Marshal(ans.SelectedOptions)
		selectedOptionsStr := string(selectedOptionsBytes)
		
		// Handle nil AttemptID initially, will assign later
		// UserAnswer struct expects *int for AttemptID
		
		userAnswer := domain.UserAnswer{
			SeamanCode: request.SeamanCode,
			QuestionID: ans.QuestionID,
			// OptionLetter removed
			// AttemptID set later
			SelectedOptions: &selectedOptionsStr,
			TextAnswer: ans.TextAnswer,
			IsCorrect: isCorrect,
			ScoreEarned: scoreEarned,
			AnsweredAt: time.Now(),
		}
		userAnswers = append(userAnswers, userAnswer)
	}
	
	// Create Quiz Attempt
	quizAttempt := domain.QuizAttempt{
		SeamanCode:       request.SeamanCode,
		AssessmentTypeID: request.AssessmentTypeID,
		TotalScore:       totalScore,
		MaxScore:         maxScore,
		CompletedAt:      time.Now(),
	}
	
	err = db.Create(&quizAttempt).Error
	if err != nil {
		return web.QuizAttemptResponse{}, err
	}
	
	// Link answers to attempt and save
	attemptIDInt := int(quizAttempt.ID)
	for i := range userAnswers {
		userAnswers[i].AttemptID = &attemptIDInt
		db.Create(&userAnswers[i])
	}
	
	percentageScore := 0.0
	if maxScore > 0 {
		percentageScore = (totalScore / maxScore) * 100
	}

	return web.QuizAttemptResponse{
		ID:                   int(quizAttempt.ID),
		SeamanCode:           quizAttempt.SeamanCode,
		AssessmentTypeID:     quizAttempt.AssessmentTypeID,
		TotalScore:           totalScore,
		MaxScore:             maxScore,
		PercentageScore:      percentageScore,
		CompletedAt:          quizAttempt.CompletedAt,
		CompletedAtFormatted: quizAttempt.CompletedAt.Format("02 January 2006, 15:04"),
	}, nil
}

func (service *quizServiceImpl) GetQuizHistory(db *gorm.DB, seamanCode string) ([]web.QuizAttemptResponse, error) {
	var attempts []domain.QuizAttempt
	query := db.Preload("AssessmentType").Order("completed_at desc")
	
	if seamanCode != "" {
		query = query.Where("seaman_code = ?", seamanCode)
	}
	
	if err := query.Find(&attempts).Error; err != nil {
		return nil, err
	}
	
	var responses []web.QuizAttemptResponse
	for _, att := range attempts {
		pScore := 0.0
		if att.MaxScore > 0 {
			pScore = (att.TotalScore / att.MaxScore) * 100
		}
		
		responses = append(responses, web.QuizAttemptResponse{
			ID:                   int(att.ID),
			SeamanCode:           att.SeamanCode,
			AssessmentTypeID:     att.AssessmentTypeID,
			AssessmentTypeName:   att.AssessmentType.AssessmentTypeName, // Needs Preload
			TotalScore:           att.TotalScore,
			MaxScore:             att.MaxScore,
			PercentageScore:      pScore,
			CompletedAt:          att.CompletedAt,
			CompletedAtFormatted: att.CompletedAt.Format("02 Jan 2006, 15:04"),
		})
	}
	
	return responses, nil
}

func (service *quizServiceImpl) GetQuizAttempt(db *gorm.DB, attemptId int) (web.QuizAttemptDetailResponse, error) {
	var attempt domain.QuizAttempt
	if err := db.Preload("AssessmentType").First(&attempt, attemptId).Error; err != nil {
		return web.QuizAttemptDetailResponse{}, err
	}
	
	var userAnswers []domain.UserAnswer
	// Preload Question to get text and type
	if err := db.Preload("Question").Where("attempt_id = ?", attemptId).Find(&userAnswers).Error; err != nil {
		return web.QuizAttemptDetailResponse{}, err
	}
	
	var answerDetails []web.QuizAnswerDetailResponse
	
	for _, ans := range userAnswers {
		q := ans.Question
		if q == nil {
			continue
		}
		
		// Unmarshal selected options
		var selectedOpts []int
		if ans.SelectedOptions != nil {
			json.Unmarshal([]byte(*ans.SelectedOptions), &selectedOpts)
		}
		
		// Get Options for display (and correctness Check)
		options, _ := service.OptionRepository.FindByQuestionId(db, q.QuestionID)
		var optionHistory []web.OptionHistoryData
		
		var correctOpts []int
		for _, opt := range options {
			isSelected := false
			for _, sel := range selectedOpts {
				if sel == opt.OptionID {
					isSelected = true
					break
				}
			}
			
			isCorrect := opt.ScorePercentage > 0 || opt.Score > 0
			if isCorrect {
				correctOpts = append(correctOpts, opt.OptionID)
			}
			
			optionHistory = append(optionHistory, web.OptionHistoryData{
				OptionID:        opt.OptionID,
				OptionLetter:    opt.OptionLetter,
				OptionText:      opt.OptionText,
				ImageUrl:        opt.ImageUrl,
				IsSelected:      isSelected,
				ScorePercentage: opt.ScorePercentage,
				IsCorrect:       isCorrect,
			})
		}
		
		// Acceptable answers for short answer
		var acceptable []string
		if q.AcceptableAnswers != nil {
			json.Unmarshal([]byte(*q.AcceptableAnswers), &acceptable)
		}
		
		qType := q.QuestionType
		if qType == "" { qType = "single_choice" }

		answerDetails = append(answerDetails, web.QuizAnswerDetailResponse{
			QuestionID:        q.QuestionID,
			QuestionText:      q.QuestionText,
			QuestionType:      qType,
			SelectedOptions:   selectedOpts,
			TextAnswer:        ans.TextAnswer,
			CorrectOptions:    correctOpts,
			AcceptableAnswers: acceptable,
			IsCorrect:         ans.IsCorrect,
			ScoreEarned:       ans.ScoreEarned,
			MaxScore:          100.0, // Hardcoded per question
			Options:           optionHistory,
		})
	}
	
	pScore := 0.0
	if attempt.MaxScore > 0 {
		pScore = (attempt.TotalScore / attempt.MaxScore) * 100
	}
	
	return web.QuizAttemptDetailResponse{
		ID:                   int(attempt.ID),
		SeamanCode:           attempt.SeamanCode,
		AssessmentTypeID:     attempt.AssessmentTypeID,
		AssessmentTypeName:   attempt.AssessmentType.AssessmentTypeName,
		TotalScore:           attempt.TotalScore,
		MaxScore:             attempt.MaxScore,
		PercentageScore:      pScore,
		CompletedAt:          attempt.CompletedAt,
		CompletedAtFormatted: attempt.CompletedAt.Format("02 Jan 2006, 15:04"),
		Answers:              answerDetails,
	}, nil
}

func safeString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
