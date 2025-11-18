package main

import (
	"backend/internal/config"
	"backend/internal/models/domain"

	"gorm.io/gorm"
)

func main() {
	viperConfig := config.NewViper()
	log := config.NewLogger(viperConfig)
	db := config.NewDatabase(viperConfig, log)

	log.Info("Starting GORM auto migration...")

	if err := runAutoMigrate(db); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	log.Info("Migration completed successfully")
}

func runAutoMigrate(db *gorm.DB) error {
	// Disable foreign key checks during migration
	db.Exec("SET FOREIGN_KEY_CHECKS = 0")
	defer db.Exec("SET FOREIGN_KEY_CHECKS = 1")

	// Order matters due to foreign key constraints
	// Tables with no dependencies first
	models := []interface{}{
		// Independent tables
		&domain.User{},
		&domain.AssessmentType{},
		&domain.CompetencyType{},
		&domain.Report{},

		// Tables with single dependency
		&domain.Assessment{},
		&domain.SeafarerAssessment{},
		&domain.Training{},
		&domain.MentoringReport{},

		// Tables with multiple dependencies
		&domain.Aspect{},
		&domain.CompetencyProgramMapping{},
		&domain.TrainingSchedule{},
		&domain.GapCompetency{},
		&domain.MentoringReportRelation{},

		// Tables dependent on above
		&domain.Question{},
		&domain.Option{},
		&domain.AssessmentResult{},
		&domain.UserAnswer{},

		// Final dependent tables
		&domain.ScoreResult{},
	}

	for _, model := range models {
		if err := db.AutoMigrate(model); err != nil {
			return err
		}
	}

	return nil
}
