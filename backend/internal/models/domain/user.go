package domain

type User struct {
	ID       int    `gorm:"column:id;primaryKey"`
	Username string `gorm:"column:username"`
	Password string `gorm:"column:password"`
}
