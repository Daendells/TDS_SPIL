package domain

type Aspect struct {
	ID           int    `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	Name         string `json:"name" gorm:"column:name;size:50;not null"`
	Weight       int    `json:"weight" gorm:"column:weight;not null"`
	AssessmentID int    `json:"assessmentId" gorm:"column:assessment_id;not null"`
	QuestionID   *int   `json:"questionId" gorm:"column:question_id"`

	// Relations - use constraint:false to prevent reverse FK constraints during migration
	Assessment   *Assessment   `json:"assessment,omitempty" gorm:"foreignKey:AssessmentID;references:AssessmentID;constraint:false"`
	Questions    []Question    `json:"questions,omitempty" gorm:"foreignKey:AspectID;references:ID;constraint:false"`
	ScoreResults []ScoreResult `json:"scoreResults,omitempty" gorm:"foreignKey:AspectID;references:ID;constraint:false"`
}

func (Aspect) TableName() string {
	return "aspect"
}
