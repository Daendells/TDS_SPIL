package domain

import "time"

type CompetencyType struct {
	ID          int    `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	Code        string `json:"code" gorm:"column:code;not null;unique"`
	Name        string `json:"name" gorm:"column:name;not null"`
	Description string `json:"description" gorm:"column:description"`
	Category    string `json:"category" gorm:"column:category;type:enum('M','NM');default:'M'"`
	IsActive    bool   `json:"isActive" gorm:"column:is_active;default:true"`

	CreatedAt time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	GapCompetencies []GapCompetency `json:"gapCompetencies,omitempty" gorm:"foreignKey:CompetencyTypeID"`
}

func (CompetencyType) TableName() string {
	return "competency_types"
}

// Helper method to check if competency is mandatory
func (ct *CompetencyType) IsMandatory() bool {
	return ct.Category == "M"
}

// Helper method to get display name with code
func (ct *CompetencyType) GetDisplayName() string {
	return ct.Code + " - " + ct.Name
}