package domain

import "time"

// IDPTracking stores monthly tracking data for each report's IDP progress
// Tracks training, coaching, and mentoring completion towards readiness targets
type IDPTracking struct {
	ID       int64     `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	ReportID int       `json:"reportId" gorm:"column:report_id;not null;index:idx_report_month"`
	Month    time.Time `json:"month" gorm:"column:month;type:date;not null;index:idx_report_month"` // First day of month

	// Competency tracking
	CompetencyTarget     string `json:"competencyTarget" gorm:"column:competency_target;type:text"`
	CompetencyDone       string `json:"competencyDone" gorm:"column:competency_done;type:text"`
	TotalCompetencyCount int    `json:"totalCompetencyCount" gorm:"column:total_competency_count;not null;default:0"`
	TotalTrainingNeeded  int    `json:"totalTrainingNeeded" gorm:"column:total_training_needed;not null;default:0"`

	// Target values (dynamically calculated based on program and readiness)
	TargetTraining  int `json:"targetTraining" gorm:"column:target_training;not null;default:0"`
	TargetCoaching  int `json:"targetCoaching" gorm:"column:target_coaching;not null;default:2"`
	TargetMentoring int `json:"targetMentoring" gorm:"column:target_mentoring;not null;default:5"`

	// Actual completion counts (fetched from Apollo API and coaching/mentoring reports)
	ActualTraining  int `json:"actualTraining" gorm:"column:actual_training;not null;default:0"`
	ActualCoaching  int `json:"actualCoaching" gorm:"column:actual_coaching;not null;default:0"`
	ActualMentoring int `json:"actualMentoring" gorm:"column:actual_mentoring;not null;default:0"`

	// Backlog from previous month
	BacklogTraining  int `json:"backlogTraining" gorm:"column:backlog_training;not null;default:0"`
	BacklogCoaching  int `json:"backlogCoaching" gorm:"column:backlog_coaching;not null;default:0"`
	BacklogMentoring int `json:"backlogMentoring" gorm:"column:backlog_mentoring;not null;default:0"`

	// Calculation results (percentages)
	TrainingRate  float64 `json:"trainingRate" gorm:"column:training_rate;type:decimal(5,2);not null;default:0.00"`  // (Actual / Target) * 33.34%
	CoachingRate  float64 `json:"coachingRate" gorm:"column:coaching_rate;type:decimal(5,2);not null;default:0.00"`  // (Actual / Target) * 33.34%
	MentoringRate float64 `json:"mentoringRate" gorm:"column:mentoring_rate;type:decimal(5,2);not null;default:0.00"` // (Actual / Target) * 33.34%
	ReadinessRate float64 `json:"readinessRate" gorm:"column:readiness_rate;type:decimal(5,2);not null;default:0.00"` // Average of above three

	// Readiness impact
	Gap                int     `json:"gap" gorm:"column:gap;not null;default:0"`                                  // 100 - ReadinessRate
	ReadinessReduction int     `json:"readinessReduction" gorm:"column:readiness_reduction;not null;default:0"`  // -1 if ReadinessRate >= 85%, else 0
	NewReadinessMonth  int     `json:"newReadinessMonth" gorm:"column:new_readiness_month;not null;default:0"`   // Updated readiness_month value
	IDPResult          float64 `json:"idpResult" gorm:"column:idp_result;type:decimal(5,2);not null;default:0"`  // ReadinessRate for display

	CreatedAt time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`

	// Relations
	Report *Report `json:"report,omitempty" gorm:"foreignKey:ReportID;references:ID"`
}

func (IDPTracking) TableName() string {
	return "idp_tracking"
}

// CalculateRates calculates all percentage rates based on actual vs target
func (t *IDPTracking) CalculateRates() {
	// Adjust targets with backlog
	adjustedTrainingTarget := t.TargetTraining + t.BacklogTraining
	adjustedCoachingTarget := t.TargetCoaching + t.BacklogCoaching
	adjustedMentoringTarget := t.TargetMentoring + t.BacklogMentoring

	// Calculate individual rates (each max 33%, NO DECIMALS)
	if adjustedTrainingTarget > 0 {
		percentage := (float64(t.ActualTraining) / float64(adjustedTrainingTarget)) * 100.0
		if percentage > 100 {
			percentage = 100
		}
		// Convert to rate out of 33 (integer, rounded)
		t.TrainingRate = percentage * 0.33
		if t.TrainingRate > 33 {
			t.TrainingRate = 33
		}
	}

	if adjustedCoachingTarget > 0 {
		percentage := (float64(t.ActualCoaching) / float64(adjustedCoachingTarget)) * 100.0
		if percentage > 100 {
			percentage = 100
		}
		// Convert to rate out of 33 (integer, rounded)
		t.CoachingRate = percentage * 0.33
		if t.CoachingRate > 33 {
			t.CoachingRate = 33
		}
	}

	if adjustedMentoringTarget > 0 {
		percentage := (float64(t.ActualMentoring) / float64(adjustedMentoringTarget)) * 100.0
		if percentage > 100 {
			percentage = 100
		}
		// Convert to rate out of 33 (integer, rounded)
		t.MentoringRate = percentage * 0.33
		if t.MentoringRate > 33 {
			t.MentoringRate = 33
		}
	}

	// Calculate overall readiness rate (sum of 3 rates, max 100%)
	// Each component max 33%, so total max = 99% (rounds to 100)
	t.ReadinessRate = t.TrainingRate + t.CoachingRate + t.MentoringRate
	if t.ReadinessRate > 100 {
		t.ReadinessRate = 100
	}

	// Calculate gap (100 - ReadinessRate)
	t.Gap = 100 - int(t.ReadinessRate)

	// Calculate readiness reduction: -1 month if >= 85%, else 0
	if t.ReadinessRate >= 85 {
		t.ReadinessReduction = -1
	} else {
		t.ReadinessReduction = 0
	}

	// IDP Result for display (same as ReadinessRate, rounded to integer)
	t.IDPResult = t.ReadinessRate
}

// CalculateNextMonthBacklog calculates backlog for the next month
func (t *IDPTracking) CalculateNextMonthBacklog() (trainingBacklog, coachingBacklog, mentoringBacklog int) {
	adjustedTrainingTarget := t.TargetTraining + t.BacklogTraining
	adjustedCoachingTarget := t.TargetCoaching + t.BacklogCoaching
	adjustedMentoringTarget := t.TargetMentoring + t.BacklogMentoring

	trainingBacklog = adjustedTrainingTarget - t.ActualTraining
	if trainingBacklog < 0 {
		trainingBacklog = 0
	}

	coachingBacklog = adjustedCoachingTarget - t.ActualCoaching
	if coachingBacklog < 0 {
		coachingBacklog = 0
	}

	mentoringBacklog = adjustedMentoringTarget - t.ActualMentoring
	if mentoringBacklog < 0 {
		mentoringBacklog = 0
	}

	return
}

// CalculateTrainingTarget calculates monthly training target based on program, readiness, and competency count
func CalculateTrainingTarget(program string, readinessMonth int, competencyCount int) int {
	if competencyCount == 0 {
		return 0
	}

	totalTrainingNeeded := competencyCount * 2
	var targetMonths int

	switch program {
	case "FDP":
		if readinessMonth == 0 {
			targetMonths = 1
		} else if readinessMonth == 6 {
			targetMonths = 3
		} else if readinessMonth >= 7 && readinessMonth <= 12 {
			targetMonths = 6
		} else if readinessMonth >= 13 && readinessMonth <= 18 {
			targetMonths = 12
		} else {
			targetMonths = 12
		}

	case "MDP", "SDP":
		if readinessMonth == 0 {
			targetMonths = 2
		} else if readinessMonth == 6 {
			targetMonths = 3
		} else if readinessMonth >= 7 && readinessMonth <= 12 {
			targetMonths = 6
		} else if readinessMonth >= 13 && readinessMonth <= 18 {
			targetMonths = 12
		} else {
			targetMonths = 12
		}

	default:
		targetMonths = 12
	}

	targetPerMonth := totalTrainingNeeded / targetMonths
	if totalTrainingNeeded%targetMonths > 0 {
		targetPerMonth++
	}

	return targetPerMonth
}

// CalculateMentoringTarget calculates monthly mentoring target based on program, readiness, and month number
// monthNumber is calculated from training start date (1 = first month of training)
func CalculateMentoringTarget(program string, readinessMonth int, monthNumber int) int {
	// All programs follow the same logic:
	// - Ready now (0): 1x kehadiran total
	// - Ready 6 months: Bulan 1-3 = 2x/bulan, Bulan 4-6 = 1x/bulan (TOTAL 9)
	// - Ready 7-12 months: Bulan 1-3 = 2x/bulan, Bulan 4-6 = 1x/bulan, Bulan 7-12 = 1x/bulan (TOTAL 12)
	// - Ready 13-18 months: Bulan 1-3 = 2x/bulan, Bulan 4-6 = 1x/bulan, Bulan 7-18 = 1x/bulan (TOTAL 18)
	
	if readinessMonth == 0 {
		// Ready now - only 1 kehadiran total, so only first month gets target
		if monthNumber == 1 {
			return 1
		}
		return 0
	}
	
	if readinessMonth == 6 {
		// Bulan 1-3: 2x/bulan, Bulan 4-6: 1x/bulan
		if monthNumber >= 1 && monthNumber <= 3 {
			return 2
		} else if monthNumber >= 4 && monthNumber <= 6 {
			return 1
		}
		return 0
	}
	
	if readinessMonth >= 7 && readinessMonth <= 12 {
		// Bulan 1-3: 2x/bulan, Bulan 4-6: 1x/bulan, Bulan 7-12: 1x/bulan
		if monthNumber >= 1 && monthNumber <= 3 {
			return 2
		} else if monthNumber >= 4 && monthNumber <= 12 {
			return 1
		}
		return 0
	}
	
	if readinessMonth >= 13 && readinessMonth <= 18 {
		// Bulan 1-3: 2x/bulan, Bulan 4-6: 1x/bulan, Bulan 7-18: 1x/bulan
		if monthNumber >= 1 && monthNumber <= 3 {
			return 2
		} else if monthNumber >= 4 && monthNumber <= 18 {
			return 1
		}
		return 0
	}
	
	// Default fallback
	return 1
}

// CalculateCoachingTarget calculates monthly coaching target
// For all programs and all readiness levels: 1 kehadiran per bulan
func CalculateCoachingTarget(program string, readinessMonth int, monthNumber int) int {
	// Simple: always 1 per month regardless of program or readiness
	return 1
}
