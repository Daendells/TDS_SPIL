package domain

import "time"

type CVRole struct {
	ID          int       `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"column:name;unique;size:100;not null" json:"name"`
	Description string    `gorm:"column:description;type:text" json:"description"`
	Category    string    `gorm:"column:category;size:50;default:'GENERAL'" json:"category"`
	CreatedAt   time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (CVRole) TableName() string {
	return "cv_roles"
}
