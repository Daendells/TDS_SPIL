package web

import "time"

type AssessmentResultData struct {
	ID              int64      `json:"id"`
	SeafarerCode    string     `json:"seafarerCode"`
	AssessmentID    int64      `json:"assessmentId"`
	IsCompleted     int8       `json:"isCompleted"`
	CompletedAt     *time.Time `json:"completedAt"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
	ValueAssessment int        `json:"valueAssessment"`

	// Optional relations
	ScoreResults []ScoreResultData `json:"scoreResults,omitempty"`
}

type ScoreResultData struct {
	ID                 int   `json:"id"`
	RawScore           int   `json:"rawScore"`
	FinalScore         int   `json:"finalScore"`
	AssessmentResultID int64 `json:"assessmentResultId"`
	AspectID           int   `json:"aspectId"`

	// Optional relations
	Aspect *AspectData `json:"aspect,omitempty"`
}

type AspectData struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Weight       int    `json:"weight"`
	AssessmentID int    `json:"assessmentId"`
	QuestionID   *int   `json:"questionId,omitempty"`
}
