package domain

import "time"

type CompetencyProgramMapping struct {
	ID                   int    `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	CompetencyTypeID     int    `json:"competencyTypeId" gorm:"column:competency_type_id;not null"`
	Program              string `json:"program" gorm:"column:program;not null"` // SDP, MDP, FDP
	TrainingMaterial1ID  *int   `json:"trainingMaterial1Id" gorm:"column:training_material_1_id"`
	TrainingMaterial2ID  *int   `json:"trainingMaterial2Id" gorm:"column:training_material_2_id"`
	Category             string `json:"category" gorm:"column:category;type:enum('M','NM');default:'M'"`

	CreatedAt time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	CompetencyType    *CompetencyType `json:"competencyType,omitempty" gorm:"foreignKey:CompetencyTypeID;references:ID"`
	TrainingMaterial1 *Training       `json:"trainingMaterial1,omitempty" gorm:"foreignKey:TrainingMaterial1ID;references:No"`
	TrainingMaterial2 *Training       `json:"trainingMaterial2,omitempty" gorm:"foreignKey:TrainingMaterial2ID;references:No"`
}

func (CompetencyProgramMapping) TableName() string {
	return "competency_program_mappings"
}

// Helper method to check if competency is mandatory for this program
func (cpm *CompetencyProgramMapping) IsMandatory() bool {
	return cpm.Category == "M"
}

// Helper method to get training material name by type (1 or 2)
func (cpm *CompetencyProgramMapping) GetTrainingMaterialName(materialType int) string {
	if materialType == 1 && cpm.TrainingMaterial1 != nil {
		return cpm.TrainingMaterial1.TopikTraining
	}
	if materialType == 2 && cpm.TrainingMaterial2 != nil {
		return cpm.TrainingMaterial2.TopikTraining
	}
	return ""
}
