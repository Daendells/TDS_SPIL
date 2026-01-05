package domain

type Seaman struct {
	ID         uint   `gorm:"primaryKey"`
	Nama       string `gorm:"column:name"`
	SeamanCode string `gorm:"column:seaman_code"`
}

func (Seaman) TableName() string {
	return "seamen_cache"
}
