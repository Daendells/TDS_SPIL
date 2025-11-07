package domain

import "time"

type CompetencyProgramMapping struct {
	ID                int    `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	CompetencyCode    string `json:"competencyCode" gorm:"column:competency_code;not null"`
	Program           string `json:"program" gorm:"column:program;not null"` // SDP, MDP, FDP
	TrainingMaterial1 string `json:"trainingMaterial1" gorm:"column:training_material_1;not null"`
	TrainingMaterial2 string `json:"trainingMaterial2" gorm:"column:training_material_2;not null"`
	Category          string `json:"category" gorm:"column:category;type:enum('M','NM');default:'M'"`

	CreatedAt time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

func (CompetencyProgramMapping) TableName() string {
	return "competency_program_mappings"
}

// Helper method to check if competency is mandatory for this program
func (cpm *CompetencyProgramMapping) IsMandatory() bool {
	return cpm.Category == "M"
}

// Helper method to get training material by type (1 or 2)
func (cpm *CompetencyProgramMapping) GetTrainingMaterial(materialType int) string {
	if materialType == 1 {
		return cpm.TrainingMaterial1
	}
	return cpm.TrainingMaterial2
}
