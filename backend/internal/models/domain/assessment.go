package domain

type Assessment struct {
	AssessmentID      uint64   `json:"assessmentId" gorm:"column:id;primaryKey;autoIncrement"`
	AssessTypeID      *uint64  `json:"assessTypeId" gorm:"column:assess_type_id"`
	Role              string   `json:"role" gorm:"size:100;column:role;not null;unique"`
	AssessmentName    string   `json:"assessmentName" gorm:"size:50;column:assessment_name;not null"`
	UsingTimer        bool     `json:"usingTimer" gorm:"column:using_timer;not null;default:false"`
	TimerLimitMinutes *float64 `json:"timerLimitMinutes" gorm:"column:time_limit_minutes;default:null"`

	// Relations - only BelongsTo, no HasMany to avoid reverse FK constraints
	AssessmentType *AssessmentType `json:"assessmentType,omitempty" gorm:"foreignKey:AssessTypeID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`
	// Note: Aspects relation removed to prevent migration issues. Load aspects manually using Preload if needed.
}

func (Assessment) TableName() string {
	return "assessments"
}