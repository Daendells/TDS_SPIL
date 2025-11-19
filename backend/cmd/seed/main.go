package main

import (
	"backend/internal/config"
	"backend/internal/models/domain"
	"fmt"
	"time"

	"gorm.io/gorm"
)

func main() {
	viperConfig := config.NewViper()
	log := config.NewLogger(viperConfig)
	db := config.NewDatabase(viperConfig, log)

	log.Info("Starting database seeding...")

	// Seed in order of dependencies
	seeders := []struct {
		name string
		fn   func(*gorm.DB) error
	}{
		{"Users", seedUsers},
		{"AssessmentTypes", seedAssessmentTypes},
		{"Assessments", seedAssessments},
		{"CompetencyTypes", seedCompetencyTypes},
		{"Trainings", seedTrainings},
		// Note: CompetencyProgramMappings requires Training data to be seeded first via SQL
		// Run `go run cmd/seed-sql/main.go` after this to seed large data tables
		{"SeafarerAssessments", seedSeafarerAssessments},
	}

	for _, seeder := range seeders {
		log.Infof("Seeding %s...", seeder.name)
		if err := seeder.fn(db); err != nil {
			log.Fatalf("Failed to seed %s: %v", seeder.name, err)
		}
		log.Infof("Successfully seeded %s", seeder.name)
	}

	log.Info("Database seeding completed successfully")
}

func seedUsers(db *gorm.DB) error {
	users := []domain.User{
		{ID: 1, Username: "admin", Password: "$2a$10$i73dulm0qkkUwHfbgW80AuisPWji64sPnEwziy8mTiMOKxSOYcdMy"},
	}

	for _, user := range users {
		if err := db.FirstOrCreate(&user, domain.User{Username: user.Username}).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedAssessmentTypes(db *gorm.DB) error {
	parseTime := func(s string) *time.Time {
		t, _ := time.Parse("2006-01-02 15:04:05", s)
		return &t
	}

	types := []domain.AssessmentType{
		{ID: 1, AssessmentTypeName: "Value Assessment", StartTime: parseTime("2025-01-01 08:00:00"), EndTime: parseTime("2025-12-31 17:00:00"), MaxAttempts: intPtr(3)},
		{ID: 2, AssessmentTypeName: "CES", StartTime: parseTime("2025-02-01 08:00:00"), EndTime: parseTime("2025-12-31 17:00:00"), MaxAttempts: intPtr(2)},
	}

	for _, t := range types {
		if err := db.FirstOrCreate(&t, domain.AssessmentType{ID: t.ID}).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedAssessments(db *gorm.DB) error {
	assessments := []domain.Assessment{
		{AssessmentID: 1, AssessTypeID: uint64Ptr(1), Role: "va_1", AssessmentName: "COREVA", UsingTimer: true, TimerLimitMinutes: uint64Ptr(0)},
		{AssessmentID: 2, AssessTypeID: uint64Ptr(1), Role: "va_2", AssessmentName: "AWARE", UsingTimer: true, TimerLimitMinutes: uint64Ptr(0)},
		{AssessmentID: 3, AssessTypeID: uint64Ptr(1), Role: "va_3", AssessmentName: "GRIT", UsingTimer: true, TimerLimitMinutes: uint64Ptr(15)},
		{AssessmentID: 4, AssessTypeID: uint64Ptr(2), Role: "kkm", AssessmentName: "KKM", UsingTimer: false, TimerLimitMinutes: nil},
		{AssessmentID: 5, AssessTypeID: uint64Ptr(2), Role: "masinis_2", AssessmentName: "Masinis 2", UsingTimer: false, TimerLimitMinutes: nil},
		{AssessmentID: 6, AssessTypeID: uint64Ptr(2), Role: "masinis_3", AssessmentName: "Masinis 3", UsingTimer: false, TimerLimitMinutes: nil},
		{AssessmentID: 7, AssessTypeID: uint64Ptr(2), Role: "masinis_4", AssessmentName: "Masinis 4", UsingTimer: false, TimerLimitMinutes: nil},
		{AssessmentID: 8, AssessTypeID: uint64Ptr(2), Role: "mualim_1", AssessmentName: "Mualim 1", UsingTimer: false, TimerLimitMinutes: nil},
		{AssessmentID: 9, AssessTypeID: uint64Ptr(2), Role: "mualim_2", AssessmentName: "Mualim 2", UsingTimer: false, TimerLimitMinutes: nil},
		{AssessmentID: 10, AssessTypeID: uint64Ptr(2), Role: "mualim_3", AssessmentName: "Mualim 3", UsingTimer: false, TimerLimitMinutes: nil},
		{AssessmentID: 11, AssessTypeID: uint64Ptr(2), Role: "nahkoda", AssessmentName: "Nahkoda", UsingTimer: false, TimerLimitMinutes: nil},
	}

	for _, a := range assessments {
		if err := db.FirstOrCreate(&a, domain.Assessment{AssessmentID: a.AssessmentID}).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedCompetencyTypes(db *gorm.DB) error {
	types := []domain.CompetencyType{
		{ID: 1, Code: "LDC", Name: "Leading Change", Category: "M", IsActive: true},
		{ID: 2, Code: "DCM", Name: "Decision Making", Category: "M", IsActive: true},
		{ID: 3, Code: "CIO", Name: "Continous Improvement", Category: "M", IsActive: true},
		{ID: 4, Code: "SIO", Name: "Self Improvement Orientation", Category: "M", IsActive: true},
		{ID: 5, Code: "FLX", Name: "Flexibility", Category: "M", IsActive: true},
		{ID: 6, Code: "LAG", Name: "Learning Agility", Category: "M", IsActive: true},
		{ID: 7, Code: "RSC", Name: "Resilience", Category: "M", IsActive: true},
		{ID: 8, Code: "CSO", Name: "Customer Orientation", Category: "M", IsActive: true},
		{ID: 9, Code: "COM", Name: "Communication", Category: "M", IsActive: true},
		{ID: 10, Code: "EMP", Name: "Empathy", Category: "M", IsActive: true},
		{ID: 11, Code: "TOR", Name: "Team Orientation", Category: "M", IsActive: true},
		{ID: 12, Code: "LDP", Name: "Leadership", Category: "M", IsActive: true},
		{ID: 13, Code: "PNO", Name: "Planning & Organizing", Category: "M", IsActive: true},
		{ID: 14, Code: "DIR", Name: "Directiveness", Category: "M", IsActive: true},
		{ID: 15, Code: "ACH", Name: "Achivement Orientation", Category: "M", IsActive: true},
		{ID: 16, Code: "ACT", Name: "Accountability", Category: "M", IsActive: true},
		{ID: 17, Code: "IDS", Name: "Instructional Discipline", Category: "M", IsActive: true},
		{ID: 18, Code: "CFO", Name: "Concern for Order", Category: "M", IsActive: true},
		{ID: 19, Code: "RBG", Name: "Relationship Building", Category: "M", IsActive: true},
		{ID: 20, Code: "ING", Name: "Integrity", Category: "M", IsActive: true},
		{ID: 21, Code: "RSF", Name: "Resourcesfulness", Category: "M", IsActive: true},
		{ID: 22, Code: "BAC", Name: "Business Acumen", Category: "M", IsActive: true},
		{ID: 23, Code: "PSG", Name: "Problem Solving", Category: "M", IsActive: true},
	}

	for _, t := range types {
		if err := db.FirstOrCreate(&t, domain.CompetencyType{ID: t.ID}).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedTrainings(db *gorm.DB) error {
	// This is a simplified version - in production you would load from CSV or SQL file
	// The training table has a lot of data (180+ records)
	// For now, we'll just create empty seeders - real data should come from tds.sql
	fmt.Println("Note: Training data should be seeded from SQL file due to large volume")
	return nil
}

func seedCompetencyProgramMappings(db *gorm.DB) error {
	mappings := []domain.CompetencyProgramMapping{
		// SDP mappings
		{ID: 1, CompetencyTypeID: 1, Program: "SDP", TrainingMaterial1ID: intPtr(113), TrainingMaterial2ID: intPtr(114), Category: "M"},
		{ID: 2, CompetencyTypeID: 2, Program: "SDP", TrainingMaterial1ID: intPtr(57), TrainingMaterial2ID: intPtr(58), Category: "M"},
		{ID: 3, CompetencyTypeID: 3, Program: "SDP", TrainingMaterial1ID: intPtr(41), TrainingMaterial2ID: intPtr(42), Category: "M"},
		{ID: 4, CompetencyTypeID: 4, Program: "SDP", TrainingMaterial1ID: intPtr(169), TrainingMaterial2ID: intPtr(170), Category: "M"},
		{ID: 5, CompetencyTypeID: 5, Program: "SDP", TrainingMaterial1ID: intPtr(81), TrainingMaterial2ID: intPtr(82), Category: "M"},
		{ID: 6, CompetencyTypeID: 6, Program: "SDP", TrainingMaterial1ID: intPtr(121), TrainingMaterial2ID: intPtr(122), Category: "M"},
		{ID: 7, CompetencyTypeID: 7, Program: "SDP", TrainingMaterial1ID: intPtr(153), TrainingMaterial2ID: intPtr(154), Category: "M"},
		{ID: 8, CompetencyTypeID: 8, Program: "SDP", TrainingMaterial1ID: intPtr(49), TrainingMaterial2ID: intPtr(50), Category: "M"},
		{ID: 9, CompetencyTypeID: 9, Program: "SDP", TrainingMaterial1ID: intPtr(25), TrainingMaterial2ID: intPtr(26), Category: "M"},
		{ID: 10, CompetencyTypeID: 10, Program: "SDP", TrainingMaterial1ID: intPtr(73), TrainingMaterial2ID: intPtr(74), Category: "M"},
		{ID: 11, CompetencyTypeID: 11, Program: "SDP", TrainingMaterial1ID: intPtr(177), TrainingMaterial2ID: intPtr(178), Category: "M"},
		{ID: 12, CompetencyTypeID: 12, Program: "SDP", TrainingMaterial1ID: intPtr(105), TrainingMaterial2ID: intPtr(106), Category: "M"},
		{ID: 13, CompetencyTypeID: 13, Program: "SDP", TrainingMaterial1ID: intPtr(129), TrainingMaterial2ID: intPtr(130), Category: "M"},
		{ID: 14, CompetencyTypeID: 14, Program: "SDP", TrainingMaterial1ID: intPtr(65), TrainingMaterial2ID: intPtr(66), Category: "M"},
		{ID: 15, CompetencyTypeID: 15, Program: "SDP", TrainingMaterial1ID: intPtr(9), TrainingMaterial2ID: intPtr(10), Category: "M"},
		{ID: 16, CompetencyTypeID: 16, Program: "SDP", TrainingMaterial1ID: intPtr(1), TrainingMaterial2ID: intPtr(2), Category: "M"},
		{ID: 17, CompetencyTypeID: 17, Program: "SDP", TrainingMaterial1ID: intPtr(89), TrainingMaterial2ID: intPtr(90), Category: "M"},
		{ID: 18, CompetencyTypeID: 18, Program: "SDP", TrainingMaterial1ID: intPtr(33), TrainingMaterial2ID: intPtr(34), Category: "M"},
		{ID: 19, CompetencyTypeID: 19, Program: "SDP", TrainingMaterial1ID: intPtr(145), TrainingMaterial2ID: intPtr(146), Category: "M"},
		{ID: 20, CompetencyTypeID: 20, Program: "SDP", TrainingMaterial1ID: intPtr(97), TrainingMaterial2ID: intPtr(98), Category: "M"},
		{ID: 21, CompetencyTypeID: 21, Program: "SDP", TrainingMaterial1ID: intPtr(161), TrainingMaterial2ID: intPtr(162), Category: "M"},
		{ID: 22, CompetencyTypeID: 22, Program: "SDP", TrainingMaterial1ID: intPtr(17), TrainingMaterial2ID: intPtr(18), Category: "M"},
		// MDP mappings
		{ID: 23, CompetencyTypeID: 6, Program: "MDP", TrainingMaterial1ID: intPtr(121), TrainingMaterial2ID: intPtr(122), Category: "M"},
		{ID: 24, CompetencyTypeID: 4, Program: "MDP", TrainingMaterial1ID: intPtr(169), TrainingMaterial2ID: intPtr(170), Category: "M"},
		{ID: 25, CompetencyTypeID: 2, Program: "MDP", TrainingMaterial1ID: intPtr(59), TrainingMaterial2ID: intPtr(60), Category: "M"},
		{ID: 26, CompetencyTypeID: 10, Program: "MDP", TrainingMaterial1ID: intPtr(73), TrainingMaterial2ID: intPtr(74), Category: "M"},
		{ID: 27, CompetencyTypeID: 5, Program: "MDP", TrainingMaterial1ID: intPtr(81), TrainingMaterial2ID: intPtr(82), Category: "M"},
		{ID: 28, CompetencyTypeID: 8, Program: "MDP", TrainingMaterial1ID: intPtr(49), TrainingMaterial2ID: intPtr(50), Category: "M"},
		{ID: 29, CompetencyTypeID: 11, Program: "MDP", TrainingMaterial1ID: intPtr(177), TrainingMaterial2ID: intPtr(178), Category: "M"},
		{ID: 30, CompetencyTypeID: 1, Program: "MDP", TrainingMaterial1ID: intPtr(115), TrainingMaterial2ID: intPtr(116), Category: "M"},
		{ID: 31, CompetencyTypeID: 7, Program: "MDP", TrainingMaterial1ID: intPtr(153), TrainingMaterial2ID: intPtr(154), Category: "M"},
		{ID: 32, CompetencyTypeID: 15, Program: "MDP", TrainingMaterial1ID: intPtr(9), TrainingMaterial2ID: intPtr(10), Category: "M"},
		{ID: 33, CompetencyTypeID: 3, Program: "MDP", TrainingMaterial1ID: intPtr(43), TrainingMaterial2ID: intPtr(44), Category: "M"},
		{ID: 34, CompetencyTypeID: 19, Program: "MDP", TrainingMaterial1ID: intPtr(147), TrainingMaterial2ID: intPtr(148), Category: "M"},
		{ID: 35, CompetencyTypeID: 21, Program: "MDP", TrainingMaterial1ID: intPtr(163), TrainingMaterial2ID: intPtr(164), Category: "M"},
		{ID: 36, CompetencyTypeID: 12, Program: "MDP", TrainingMaterial1ID: intPtr(107), TrainingMaterial2ID: intPtr(108), Category: "M"},
		{ID: 37, CompetencyTypeID: 14, Program: "MDP", TrainingMaterial1ID: intPtr(67), TrainingMaterial2ID: intPtr(68), Category: "M"},
		{ID: 38, CompetencyTypeID: 9, Program: "MDP", TrainingMaterial1ID: intPtr(27), TrainingMaterial2ID: intPtr(28), Category: "M"},
		{ID: 39, CompetencyTypeID: 22, Program: "MDP", TrainingMaterial1ID: intPtr(19), TrainingMaterial2ID: intPtr(20), Category: "M"},
		{ID: 40, CompetencyTypeID: 18, Program: "MDP", TrainingMaterial1ID: intPtr(35), TrainingMaterial2ID: intPtr(36), Category: "M"},
		// FDP mappings
		{ID: 41, CompetencyTypeID: 10, Program: "FDP", TrainingMaterial1ID: intPtr(75), TrainingMaterial2ID: intPtr(76), Category: "M"},
		{ID: 42, CompetencyTypeID: 6, Program: "FDP", TrainingMaterial1ID: intPtr(124), TrainingMaterial2ID: intPtr(123), Category: "M"},
		{ID: 43, CompetencyTypeID: 2, Program: "FDP", TrainingMaterial1ID: intPtr(61), TrainingMaterial2ID: intPtr(62), Category: "M"},
		{ID: 44, CompetencyTypeID: 7, Program: "FDP", TrainingMaterial1ID: intPtr(155), TrainingMaterial2ID: intPtr(156), Category: "M"},
		{ID: 45, CompetencyTypeID: 5, Program: "FDP", TrainingMaterial1ID: intPtr(83), TrainingMaterial2ID: intPtr(84), Category: "M"},
		{ID: 46, CompetencyTypeID: 4, Program: "FDP", TrainingMaterial1ID: intPtr(171), TrainingMaterial2ID: intPtr(172), Category: "M"},
		{ID: 47, CompetencyTypeID: 11, Program: "FDP", TrainingMaterial1ID: intPtr(179), TrainingMaterial2ID: intPtr(180), Category: "M"},
		{ID: 48, CompetencyTypeID: 3, Program: "FDP", TrainingMaterial1ID: intPtr(43), TrainingMaterial2ID: intPtr(44), Category: "M"},
		{ID: 49, CompetencyTypeID: 19, Program: "FDP", TrainingMaterial1ID: intPtr(147), TrainingMaterial2ID: intPtr(148), Category: "M"},
		{ID: 50, CompetencyTypeID: 8, Program: "FDP", TrainingMaterial1ID: intPtr(51), TrainingMaterial2ID: intPtr(52), Category: "M"},
		{ID: 51, CompetencyTypeID: 15, Program: "FDP", TrainingMaterial1ID: intPtr(11), TrainingMaterial2ID: intPtr(12), Category: "M"},
		{ID: 52, CompetencyTypeID: 16, Program: "FDP", TrainingMaterial1ID: intPtr(3), TrainingMaterial2ID: intPtr(4), Category: "M"},
		{ID: 53, CompetencyTypeID: 17, Program: "FDP", TrainingMaterial1ID: intPtr(91), TrainingMaterial2ID: intPtr(92), Category: "M"},
		{ID: 54, CompetencyTypeID: 9, Program: "FDP", TrainingMaterial1ID: intPtr(29), TrainingMaterial2ID: intPtr(30), Category: "M"},
	}

	for _, m := range mappings {
		if err := db.FirstOrCreate(&m, domain.CompetencyProgramMapping{ID: m.ID}).Error; err != nil {
			return err
		}
	}
	return nil
}

func seedSeafarerAssessments(db *gorm.DB) error {
	// Sample seafarer assignments
	assignments := []domain.SeafarerAssessment{
		{ID: 1, SeafarerCode: "6201095355", AssessmentTypeID: 1, Status: "assigned", AttemptsCount: 1},
		{ID: 2, SeafarerCode: "6200521998", AssessmentTypeID: 1, Status: "assigned", AttemptsCount: 2},
		{ID: 3, SeafarerCode: "6200402427", AssessmentTypeID: 1, Status: "assigned", AttemptsCount: 1},
		{ID: 4, SeafarerCode: "6200159366", AssessmentTypeID: 1, Status: "completed", AttemptsCount: 1},
		{ID: 5, SeafarerCode: "6201572177", AssessmentTypeID: 1, Status: "assigned", AttemptsCount: 2},
		{ID: 6, SeafarerCode: "1234567890", AssessmentTypeID: 1, Status: "assigned", AttemptsCount: 1},
	}

	for _, a := range assignments {
		if err := db.FirstOrCreate(&a, domain.SeafarerAssessment{ID: a.ID}).Error; err != nil {
			return err
		}
	}
	return nil
}

// Helper functions
func intPtr(i int) *int {
	return &i
}

func uint64Ptr(i uint64) *uint64 {
	return &i
}
