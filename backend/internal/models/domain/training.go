package domain

import "time"

type Training struct {
	No                int        `json:"no"                gorm:"column:no;primaryKey"`
	CompetencyTypeID  int        `json:"competencyTypeId"  gorm:"column:competency_type_id;not null"`
	Level             int        `json:"lvl"               gorm:"column:lvl"`
	DeskripsiPerilaku string     `json:"deskripsi_perilaku" gorm:"column:deskripsi_perilaku"`
	ToolsTraining     string     `json:"tools_training"    gorm:"column:tools_training"`
	Kode              string     `json:"kode"              gorm:"column:kode"`
	TopikTraining     string     `json:"topik_training"    gorm:"column:topik_training"`
	Referensi         *string    `json:"referensi"         gorm:"column:referensi"`
	GeneratedFileURL  *string    `json:"generated_file_url" gorm:"column:generated_file_url"`
	GeneratedPdfURL   *string    `json:"generated_pdf_url"  gorm:"column:generated_pdf_url"`
	GeneratedQuizURL  *string    `json:"generated_quiz_url" gorm:"column:generated_quiz_url"`
	GeneratedAt       *time.Time `json:"generated_at"      gorm:"column:generated_at"`

	// Relations
	CompetencyType *CompetencyType `json:"competencyType,omitempty" gorm:"foreignKey:CompetencyTypeID;references:ID"`
}

func (Training) TableName() string {
	return "training" // sesuai nama tabel di MySQL Anda
}