package domain

type Assessment struct {
	AssessmentID      uint64  `json:"assessmentId" gorm:"column:id;primaryKey"`
	Role              string  `json:"role" gorm:"size:100;column:role;not null"`
	UsingTimer        bool    `json:"usingTimer" gorm:"column:using_timer;not null;default:false"`
	TimerLimitMinutes *uint64 `json:"timerLimitMinutes" gorm:"column:time_limit_minutes;default:null"`
}

func (Assessment) TableName() string {
	return "assessments"
}