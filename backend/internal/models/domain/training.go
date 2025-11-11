package domain

import "time"

type Training struct {
	No               int        `json:"no"             gorm:"column:no;primaryKey"`
	KodeAI           string     `json:"kode_ai"        gorm:"column:kode_ai"`
	Kompetensi       string     `json:"kompetensi"     gorm:"column:kompetensi"`
	Level            int        `json:"lvl"            gorm:"column:lvl"`
	DeskripsiPerilaku string    `json:"deskripsi_perilaku" gorm:"column:deskripsi_perilaku"`
	ToolsTraining    string     `json:"tools_training" gorm:"column:tools_training"`
	Kode             string     `json:"kode"           gorm:"column:kode"`
	TopikTraining    string     `json:"topik_training" gorm:"column:topik_training"`
	GeneratedFileURL *string    `json:"generated_file_url" gorm:"column:generated_file_url"`
	GeneratedAt      *time.Time `json:"generated_at"   gorm:"column:generated_at"`
}

func (Training) TableName() string {
	return "training" // sesuai nama tabel di MySQL Anda
}