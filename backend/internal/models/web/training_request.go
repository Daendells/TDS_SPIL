package web

type TrainingCreateRequest struct {
	CompetencyTypeID  int    `json:"competency_type_id" validate:"required"`
	Kode              string `json:"kode" validate:"required"`
	TopikTraining     string `json:"topik_training" validate:"required"`
	Lvl               int    `json:"lvl" validate:"required,min=1,max=5"`
	ToolsTraining     string `json:"tools_training" validate:"required"`
	DeskripsiPerilaku string `json:"deskripsi_perilaku" validate:"required"`
}

type TrainingUpdateRequest struct {
	Lvl                int    `json:"lvl" validate:"required"`
	Kode               string `json:"kode" validate:"required"`
	TopikTraining      string `json:"topik_training" validate:"required"`
	DeskripsiPerilaku  string `json:"deskripsi_perilaku"`
	ToolsTraining      string `json:"tools_training" validate:"required"`
}
