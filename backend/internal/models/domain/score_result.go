package domain

type ScoreResult struct {
	ID                 int `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	RawScore           int `json:"rawScore" gorm:"column:raw_score;not null"`
	FinalScore         int `json:"finalScore" gorm:"column:final_score;not null"`
	AssessmentResultID int64 `json:"assessmentResultId" gorm:"column:assessment_result_id;not null"`
	AspectID           int `json:"aspectId" gorm:"column:aspect_id;not null"`

	// Relations
	AssessmentResult *AssessmentResult `json:"assessmentResult,omitempty" gorm:"foreignKey:AssessmentResultID;references:ID"`
	Aspect           *Aspect           `json:"aspect,omitempty" gorm:"foreignKey:AspectID;references:ID"`
}

func (ScoreResult) TableName() string {
	return "score_results"
}
