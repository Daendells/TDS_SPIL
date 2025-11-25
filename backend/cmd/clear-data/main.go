package main

import (
	"backend/internal/config"
)

func main() {
	viperConfig := config.NewViper()
	logger := config.NewLogger(viperConfig)
	db := config.NewDatabase(viperConfig, logger)

	logger.Info("Clearing all tables...")

	// Disable foreign key checks
	db.Exec("SET FOREIGN_KEY_CHECKS = 0")

	// List of tables to truncate in reverse dependency order
	tables := []string{
		"report_score",
		"score_results",
		"user_answers",
		"assessment_results",
		"options",
		"questions",
		"aspects",
		"gap_competencies",
		"reports",
		"seafarer_assessments",
		"mentoring_report_relations",
		"mentoring_reports",
		"training_schedules",
		"competency_program_mappings",
		"training",
		"competency_types",
		"assessments",
		"assessment_types",
		"users",
	}

	for _, table := range tables {
		result := db.Exec("TRUNCATE TABLE " + table)
		if result.Error != nil {
			logger.Warnf("Failed to truncate %s: %v (table might not exist)", table, result.Error)
		} else {
			logger.Infof("Truncated table: %s", table)
			// Reset AUTO_INCREMENT
			db.Exec("ALTER TABLE " + table + " AUTO_INCREMENT = 1")
		}
	}

	// Re-enable foreign key checks
	db.Exec("SET FOREIGN_KEY_CHECKS = 1")

	logger.Info("All tables cleared successfully")
}
