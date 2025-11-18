package domain

import "time"

type Assignment struct {
	ID                  uint      `gorm:"primaryKey"`
	AssessmentTypeID    uint      `gorm:"not null;index;uniqueIndex:uniq_assignment"`
	SeafarerCode        string    `gorm:"type:varchar(50);not null;index;uniqueIndex:uniq_assignment"`
	Nama                string    `gorm:"type:varchar(200);not null"`
	MaxAttemptsOverride *int      `gorm:"default:null"`
	AttemptsUsed        int       `gorm:"default:0;not null"`
	Active              bool      `gorm:"default:true;not null"`
	AssignedAt          time.Time `gorm:"autoCreateTime"`
	UpdatedAt           time.Time `gorm:"autoUpdateTime"`
}
