package domain

import "time"

// tabel user_assessments
// tabel user_assessments

type UserAssessment struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement"`
	UserID       int64     `gorm:"not null"`
	AssessmentID uint64    `gorm:"not null"`
	Attempt      int       `gorm:"not null;default:1"`
	StartDate    time.Time `gorm:"not null"`
	EndDate      time.Time `gorm:"not null"`
	Status       string    `gorm:"type:enum('ASSIGNED','EXPIRED');default:'ASSIGNED'"`
	Note         *string   `gorm:"type:text"`

	CreatedAt time.Time
	UpdatedAt time.Time

	User       FullReport `gorm:"foreignKey:UserID;references:ID"`
	Assessment Assessment `gorm:"foreignKey:AssessmentID;references:ID"`
}
