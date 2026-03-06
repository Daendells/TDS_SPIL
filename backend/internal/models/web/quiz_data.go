package web

import "time"

// QuizSubmitRequest represents a quiz submission with answers for all question types
type QuizSubmitRequest struct {
	SeamanCode       string             `json:"seamanCode" validate:"required"`
	AssessmentTypeID uint64             `json:"assessmentTypeId" validate:"required"`
	Answers          []QuizAnswerSubmit `json:"answers" validate:"required"`
}

// QuizAnswerSubmit represents a single answer in a quiz submission
type QuizAnswerSubmit struct {
	QuestionID      int     `json:"questionId" validate:"required"`
	SelectedOptions []int   `json:"selectedOptions,omitempty"` // For single_choice, multiple_choice, match_choice
	TextAnswer      *string `json:"textAnswer,omitempty"`      // For short_answer
}

// QuizAttemptResponse represents a quiz attempt for history viewing
type QuizAttemptResponse struct {
	ID                   int       `json:"id"`
	SeamanCode           string    `json:"seamanCode"`
	AssessmentTypeID     uint64    `json:"assessmentTypeId"`
	AssessmentTypeName   string    `json:"assessmentTypeName"`
	TotalScore           float64   `json:"totalScore"`
	MaxScore             float64   `json:"maxScore"`
	PercentageScore      float64   `json:"percentageScore"`
	CompletedAt          time.Time `json:"completedAt"`
	CompletedAtFormatted string    `json:"completedAtFormatted"`
}

// QuizAttemptDetailResponse represents detailed quiz attempt with all answers
type QuizAttemptDetailResponse struct {
	ID                   int                       `json:"id"`
	SeamanCode           string                    `json:"seamanCode"`
	AssessmentTypeID     uint64                    `json:"assessmentTypeId"`
	AssessmentTypeName   string                    `json:"assessmentTypeName"`
	TotalScore           float64                   `json:"totalScore"`
	MaxScore             float64                   `json:"maxScore"`
	PercentageScore      float64                   `json:"percentageScore"`
	CompletedAt          time.Time                 `json:"completedAt"`
	CompletedAtFormatted string                    `json:"completedAtFormatted"`
	Answers              []QuizAnswerDetailResponse `json:"answers"`
}

// QuizAnswerDetailResponse represents a single answer with correctness info
type QuizAnswerDetailResponse struct {
	QuestionID       int                  `json:"questionId"`
	QuestionText     string               `json:"questionText"`
	QuestionType     string               `json:"questionType"`
	SelectedOptions  []int                `json:"selectedOptions,omitempty"`
	TextAnswer       *string              `json:"textAnswer,omitempty"`
	CorrectOptions   []int                `json:"correctOptions,omitempty"`   // For choice types
	AcceptableAnswers []string            `json:"acceptableAnswers,omitempty"` // For short_answer
	IsCorrect        bool                 `json:"isCorrect"`
	ScoreEarned      float64              `json:"scoreEarned"`
	MaxScore         float64              `json:"maxScore"`
	AssessmentID     int                  `json:"assessmentId"`
	AssessmentName   string               `json:"assessmentName"`
	Options          []OptionHistoryData  `json:"options,omitempty"`
}

// OptionHistoryData shows option with selection and correctness status
type OptionHistoryData struct {
	OptionID        int     `json:"optionId"`
	OptionLetter    string  `json:"optionLetter"`
	OptionText      string  `json:"optionText"`
	ImageUrl        string  `json:"imageUrl,omitempty"`
	IsSelected      bool    `json:"isSelected"`
	ScorePercentage float64 `json:"scorePercentage"`
	IsCorrect       bool    `json:"isCorrect"` // scorePercentage > 0
}

// QuizDataResponse represents quiz data for taking the quiz
type QuizDataResponse struct {
	AssessmentTypeID   uint64                   `json:"assessmentTypeId"`
	AssessmentTypeName string                   `json:"assessmentTypeName"`
	Assessments        []QuizAssessmentSection  `json:"assessments"`
	TotalQuestions     int                      `json:"totalQuestions"`
}

// QuizAssessmentSection represents one assessment section in a quiz
type QuizAssessmentSection struct {
	AssessmentID         uint64                         `json:"assessmentId"`
	AssessmentName       string                         `json:"assessmentName"`
	UsingTimer           bool                           `json:"usingTimer"`
	TimerLimitMinutes    *float64                       `json:"timerLimitMinutes"`
	TutorialContent      *string                        `json:"tutorialContent"`
	TutorialTimerMinutes *float64                       `json:"tutorialTimerMinutes"`
	Questions            []QuestionOptionPublicResponse `json:"questions"`
}
