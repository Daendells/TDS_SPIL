package domain

type Training struct {
	No            int    `json:"no"             gorm:"column:no;primaryKey"`
	KodeAI        string `json:"kode_ai"        gorm:"column:kode_ai"`
	Kompetensi    string `json:"kompetensi"     gorm:"column:kompetensi"`
	Level         int    `json:"lvl"            gorm:"column:lvl"`
	ToolsTraining string `json:"tools_training" gorm:"column:tools_training"`
	Kode          string `json:"kode"           gorm:"column:kode"`
	TopikTraining string `json:"topik_training" gorm:"column:topik_training"`
}

func (Training) TableName() string {
	return "training" // sesuai nama tabel di MySQL Anda
}