package domain

import "time"

type User struct {
	ID        int       `gorm:"column:id;primaryKey;autoIncrement"`
	Username  string    `gorm:"column:username;unique;size:100;not null"`
	Password  string    `gorm:"column:password;not null"`
	Role      string    `gorm:"column:role;type:enum('admin');default:'admin';not null"`
	SSOID     string    `gorm:"column:sso_id;uniqueIndex;size:100"`
	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime"`
}

func (User) TableName() string {
	return "users"
}
