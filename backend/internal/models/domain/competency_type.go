package domain

import "time"

type CompetencyType struct {
	ID          int    `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	Code        string `json:"code" gorm:"column:code;not null;unique"`
	Name        string `json:"name" gorm:"column:name;not null"`
	Description string `json:"description" gorm:"column:description"`
	IsActive    bool   `json:"isActive" gorm:"column:is_active;default:true"`

	CreatedAt time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	GapCompetencies []GapCompetency `json:"gapCompetencies,omitempty" gorm:"foreignKey:CompetencyTypeID"`
}

func (CompetencyType) TableName() string {
	return "competency_types"
}

// Note: Category (M/NM) is now dynamically calculated in training_plan_service.go based on >60% participant gaps

// Helper method to get display name with code
func (ct *CompetencyType) GetDisplayName() string {
	return ct.Code + " - " + ct.Name
}