package web

type TrainingUpdateRequest struct {
	Lvl                int    `json:"lvl" validate:"required"`
	Kode               string `json:"kode" validate:"required"`
	TopikTraining      string `json:"topik_training" validate:"required"`
	DeskripsiPerilaku  string `json:"deskripsi_perilaku"`
	ToolsTraining      string `json:"tools_training" validate:"required"`
}
