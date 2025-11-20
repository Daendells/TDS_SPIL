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

	log.Info("Creating database triggers...")
	if err := createTriggers(db); err != nil {
		log.Fatalf("trigger creation failed: %v", err)
	}

	log.Info("Triggers created successfully")

	log.Info("Updating existing records with calculated values...")
	if err := updateExistingRecords(db); err != nil {
		log.Fatalf("update existing records failed: %v", err)
	}

	log.Info("All migrations and updates completed successfully")
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
		&domain.ReportScore{},
	}

	for _, model := range models {
		if err := db.AutoMigrate(model); err != nil {
			return err
		}
	}

	return nil
}

func createTriggers(db *gorm.DB) error {
	// Drop existing triggers if they exist
	db.Exec("DROP TRIGGER IF EXISTS calculate_readiness_before_insert")
	db.Exec("DROP TRIGGER IF EXISTS calculate_readiness_before_update")

	// Create BEFORE INSERT trigger
	triggerInsert := `
CREATE TRIGGER calculate_readiness_before_insert
BEFORE INSERT ON reports
FOR EACH ROW
BEGIN
    -- 1. Convert readiness string to readiness_month integer
    SET NEW.readiness_month = CASE 
        WHEN NEW.readiness = 'Ready Now' THEN 0
        WHEN NEW.readiness = '6 Months' THEN 6
        WHEN NEW.readiness = '7-12 Months' THEN 12
        WHEN NEW.readiness = '13-18 Months' THEN 18
        ELSE 0
    END;
    
    -- 2. Calculate education_fulfillment_months based on idp_program and certificate
    SET NEW.education_fulfillment_months = CASE 
        -- SDP Program (highest level)
        WHEN NEW.idp_program = 'SDP' THEN
            CASE 
                WHEN NEW.certificate IN ('ANT-I', 'ATT-I') THEN 0
                WHEN NEW.certificate IN ('ANT-II', 'ATT-II') THEN 5
                WHEN NEW.certificate IN ('ANT-III', 'ATT-III') THEN 8
                ELSE 0
            END
        -- MDP Program (middle level)
        WHEN NEW.idp_program = 'MDP' THEN
            CASE 
                WHEN NEW.certificate IN ('ANT-I', 'ATT-I', 'ANT-II', 'ATT-II') THEN 0
                WHEN NEW.certificate IN ('ANT-III', 'ATT-III') THEN 8
                ELSE 0
            END
        -- FDP Program (lowest level - all certificates result in 0)
        WHEN NEW.idp_program = 'FDP' THEN 0
        -- Default if program is not recognized
        ELSE 0
    END;
    
    -- 3. Calculate total_readiness_update_months (sum of readiness_month + education_fulfillment_months)
    SET NEW.total_readiness_update_months = 
        COALESCE(NEW.readiness_month, 0) + COALESCE(NEW.education_fulfillment_months, 0);
END`

	if err := db.Exec(triggerInsert).Error; err != nil {
		return err
	}

	// Create BEFORE UPDATE trigger
	triggerUpdate := `
CREATE TRIGGER calculate_readiness_before_update
BEFORE UPDATE ON reports
FOR EACH ROW
BEGIN
    -- 1. Convert readiness string to readiness_month integer
    SET NEW.readiness_month = CASE 
        WHEN NEW.readiness = 'Ready Now' THEN 0
        WHEN NEW.readiness = '6 Months' THEN 6
        WHEN NEW.readiness = '7-12 Months' THEN 12
        WHEN NEW.readiness = '13-18 Months' THEN 18
        ELSE 0
    END;
    
    -- 2. Calculate education_fulfillment_months based on idp_program and certificate
    SET NEW.education_fulfillment_months = CASE 
        -- SDP Program (highest level)
        WHEN NEW.idp_program = 'SDP' THEN
            CASE 
                WHEN NEW.certificate IN ('ANT-I', 'ATT-I') THEN 0
                WHEN NEW.certificate IN ('ANT-II', 'ATT-II') THEN 5
                WHEN NEW.certificate IN ('ANT-III', 'ATT-III') THEN 8
                ELSE 0
            END
        -- MDP Program (middle level)
        WHEN NEW.idp_program = 'MDP' THEN
            CASE 
                WHEN NEW.certificate IN ('ANT-I', 'ATT-I', 'ANT-II', 'ATT-II') THEN 0
                WHEN NEW.certificate IN ('ANT-III', 'ATT-III') THEN 8
                ELSE 0
            END
        -- FDP Program (lowest level - all certificates result in 0)
        WHEN NEW.idp_program = 'FDP' THEN 0
        -- Default if program is not recognized
        ELSE 0
    END;
    
    -- 3. Calculate total_readiness_update_months (sum of readiness_month + education_fulfillment_months)
    SET NEW.total_readiness_update_months = 
        COALESCE(NEW.readiness_month, 0) + COALESCE(NEW.education_fulfillment_months, 0);
END`

	if err := db.Exec(triggerUpdate).Error; err != nil {
		return err
	}

	return nil
}

func updateExistingRecords(db *gorm.DB) error {
	// Step 1: Update readiness_month based on readiness string
	updateReadinessMonth := `
UPDATE reports
SET readiness_month = CASE 
    WHEN readiness = 'Ready Now' THEN 0
    WHEN readiness = '6 Months' THEN 6
    WHEN readiness = '7-12 Months' THEN 12
    WHEN readiness = '13-18 Months' THEN 18
    ELSE 0
END
WHERE readiness_month IS NULL OR readiness_month = 0`

	if err := db.Exec(updateReadinessMonth).Error; err != nil {
		return err
	}

	// Step 2: Update education_fulfillment_months based on certificate and idp_program
	updateEducationMonths := `
UPDATE reports
SET education_fulfillment_months = CASE 
    -- SDP Program (highest level)
    WHEN idp_program = 'SDP' THEN
        CASE 
            WHEN certificate IN ('ANT-I', 'ATT-I') THEN 0
            WHEN certificate IN ('ANT-II', 'ATT-II') THEN 5
            WHEN certificate IN ('ANT-III', 'ATT-III') THEN 8
            ELSE 0
        END
    -- MDP Program (middle level)
    WHEN idp_program = 'MDP' THEN
        CASE 
            WHEN certificate IN ('ANT-I', 'ATT-I', 'ANT-II', 'ATT-II') THEN 0
            WHEN certificate IN ('ANT-III', 'ATT-III') THEN 8
            ELSE 0
        END
    -- FDP Program (lowest level - all certificates result in 0)
    WHEN idp_program = 'FDP' THEN 0
    -- Default if program is not recognized
    ELSE 0
END
WHERE education_fulfillment_months IS NULL`

	if err := db.Exec(updateEducationMonths).Error; err != nil {
		return err
	}

	// Step 3: Update total_readiness_update_months as sum of the two columns
	updateTotalMonths := `
UPDATE reports
SET total_readiness_update_months = 
    COALESCE(readiness_month, 0) + COALESCE(education_fulfillment_months, 0)
WHERE total_readiness_update_months IS NULL`

	if err := db.Exec(updateTotalMonths).Error; err != nil {
		return err
	}

	return nil
}
