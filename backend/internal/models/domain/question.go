package domain

type Question struct {
	QuestionID        int     `json:"questionId" gorm:"column:question_id;primaryKey;autoIncrement"`
	Role              string  `json:"role" gorm:"column:role;type:text;not null"`
	QuestionText      string  `json:"questionText" gorm:"column:question_text;type:text;not null"`
	Category          *string `json:"category" gorm:"column:category;type:text"`
	IsImage           *string `json:"isImage" gorm:"column:is_image;type:text"`
	ImageURL          *string `json:"imageUrl" gorm:"column:image_url;size:500"`
	AssessmentID      *uint64 `json:"assessmentId" gorm:"column:assessment_id"`
	AspectID          *int64  `json:"aspectId" gorm:"column:aspect_id"`
	QuestionType      string  `json:"questionType" gorm:"column:question_type;type:enum('single_choice','multiple_choice','match_choice','short_answer');default:'single_choice'"`
	AcceptableAnswers *string `json:"acceptableAnswers" gorm:"column:acceptable_answers;type:json"` // JSON array for short_answer type

	// Relations - use constraint:false to prevent reverse FK constraints during migration
	Assessment *Assessment `json:"assessment,omitempty" gorm:"foreignKey:AssessmentID;references:AssessmentID;constraint:false"`
	Aspect     *Aspect     `json:"aspect,omitempty" gorm:"foreignKey:AspectID;references:ID;constraint:false"`
}

func (Question) TableName() string {
	return "questions"
}
