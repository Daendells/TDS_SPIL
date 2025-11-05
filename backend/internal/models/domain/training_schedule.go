package domain

import (
    "fmt"
    "time"
)

type TrainingSchedule struct {
	ID             int       `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	Program        string    `json:"program" gorm:"column:program;not null"`                // SDP, MDP, FDP
	CompetencyCode string    `json:"competencyCode" gorm:"column:competency_code;not null"` // LDC, DCM, etc.
	TrainingTopic  string    `json:"trainingTopic" gorm:"column:training_topic;not null"`   // Change Leadership, etc.
	Category       string    `json:"category" gorm:"column:category;not null"`              // M (Mandatory) or NM (Non-Mandatory)
	MaterialType   int       `json:"materialType" gorm:"column:material_type;not null"`     // 1 or 2 (Materi 1 or Materi 2)
	ScheduledDate  time.Time `json:"scheduledDate" gorm:"column:scheduled_date;not null"`

	CreatedAt time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

func (TrainingSchedule) TableName() string {
    return "training_schedules"
}

// Helper method to format date as Week-Month for display (I–IV)
func (ts *TrainingSchedule) GetFormattedDate() string {
    day := ts.ScheduledDate.Day()
    var week string
    switch {
    case day >= 1 && day <= 7:
        week = "I"
    case day >= 8 && day <= 14:
        week = "II"
    case day >= 15 && day <= 21:
        week = "III"
    default:
        week = "IV"
    }
    return fmt.Sprintf("%s-%d", week, int(ts.ScheduledDate.Month()))
}

// Training Plan Response structures for API
type TrainingPlanParticipant struct {
	No         int                    `json:"no"`
	VesselName string                 `json:"vesselName"`
	SeamanCode string                 `json:"seamanCode"`
	Name       string                 `json:"name"`
	Position   string                 `json:"position"`   // Added position field for jabatan
	Gaps       map[string]interface{} `json:"gaps"` // Will contain gap values (1, X, or empty)
	Total      int                    `json:"total"`
	Readiness  string                 `json:"readiness"`
}

type TrainingPlanSummary struct {
	Total           map[string]int     `json:"total"`           // Total participants with each gap
	PercentageGap   map[string]float64 `json:"percentageGap"`   // Percentage of participants with each gap
	Category        map[string]string  `json:"category"`        // M or NM for each competency
	TrainingMateri1 map[string]string  `json:"trainingMateri1"` // Scheduled dates for Materi 1
	TrainingMateri2 map[string]string  `json:"trainingMateri2"` // Scheduled dates for Materi 2
}

type TrainingPlanResponse struct {
	Participants []TrainingPlanParticipant `json:"participants"`
	Summary      TrainingPlanSummary       `json:"summary"`
	Program      string                    `json:"program"`
	TotalCount   int                       `json:"totalCount"`
}

// CompetencyMappingItem represents the structure for competency mapping
type CompetencyMappingItem struct {
	Name           string   `json:"name"`
	TrainingTopics []string `json:"training_topics"`
}