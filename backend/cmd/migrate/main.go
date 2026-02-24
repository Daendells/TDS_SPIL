package main

import (
	"backend/internal/config"
	"backend/internal/models/domain"
	"strings"

	"gorm.io/gorm"
)

func main() {
	viperConfig := config.NewViper()
	log := config.NewLogger(viperConfig)
	db := config.NewDatabase(viperConfig, log)

	log.Info("Starting database migrations...")

	// Run GORM auto migration (handles role column automatically)
	log.Info("Running GORM auto migration...")
	if err := runAutoMigrate(db); err != nil {
		log.Fatalf("GORM migration failed: %v", err)
	}

	log.Info("Migration completed successfully")

	log.Info("Populating default referensi for existing trainings...")
	if err := populateDefaultReferensi(db); err != nil {
		log.Fatalf("populate default referensi failed: %v", err)
	}
	log.Info("Default referensi populated successfully")

	log.Info("Creating database triggers...")
	if err := createTriggers(db); err != nil {
		log.Fatalf("trigger creation failed: %v", err)
	}
	log.Info("Triggers created successfully")

	log.Info("Updating existing records with calculated values...")
	if err := updateExistingRecords(db); err != nil {
		log.Fatalf("update existing records failed: %v", err)
	}
	log.Info("All migrations completed successfully")
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
		&domain.ApolloTrainingCache{},
		&domain.SeamenCache{},
		&domain.MutationCache{},

		// Tables with single dependency
		&domain.Assessment{},
		&domain.SeafarerAssessment{},
		&domain.Training{},
		&domain.MentoringReport{},
		&domain.CoachingReport{},
		&domain.IDPTracking{}, // Depends on Report
		&domain.Batch{},       // Independent/Parent of Report (optional, but sticking to basics)


		// Tables with multiple dependencies
		&domain.CompetencyProgramMapping{}, // Depends on CompetencyType and Training
		&domain.Aspect{},
		&domain.TrainingSchedule{},
		&domain.GapCompetency{},
		&domain.MentoringReportRelation{},

		// Tables dependent on above
		&domain.Question{},
		&domain.Option{},
		&domain.AssessmentResult{},
		&domain.UserAnswer{},
		&domain.QuizAttempt{},

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

func populateDefaultReferensi(db *gorm.DB) error {
	// Populate default referensi for existing training records where referensi IS NULL
	// Uses exact format specified by user without modification
	updateReferensi := `
UPDATE training t
INNER JOIN competency_types ct ON t.competency_type_id = ct.id
SET t.referensi = CONCAT(
    'buatkan slide training online untuk judul ', t.topik_training, ' untuk mengungkap kompetensi ', ct.name, ' yaitu ', ct.description, ' terutama untuk level ', t.lvl, ' yang ', t.deskripsi_perilaku, '\n\n',
    'buatkan ppt antara 13-15 slide ini sebagai ppt video training online, dengan peserta trainingnya adalah perwira kapal container (SPIL) dengan susunan slidenya\n\n',
    'yaitu slide 1: judul, slide 2: objective, slide 3: konsep penjelasan detail topik training, slide 4: challenges/tantangan, slide 5-9: 1 tool yang mengungkap ', t.topik_training, ' (jelaskan steps2nya secara detail untuk perslide), slide 11: studi kasus, slide 12: pemecahan masalah dalam studi kasus menggunakan metode/tools yang dijelaskan, slide 13: penutup/closing.'
)
WHERE t.referensi IS NULL
   OR t.referensi = ''
   OR t.referensi = '-'`

	if err := db.Exec(updateReferensi).Error; err != nil {
		return err
	}

	return nil
}

func createTriggers(db *gorm.DB) error {
	db.Exec("DROP TRIGGER IF EXISTS calculate_readiness_before_insert")
	db.Exec("DROP TRIGGER IF EXISTS after_insert_report_create_report_scores")
	db.Exec("DROP TRIGGER IF EXISTS after_report_insert_populate_gaps")
	db.Exec("DROP TRIGGER IF EXISTS after_report_update_populate_gaps")

	triggerInsert := `
CREATE TRIGGER calculate_readiness_before_insert
BEFORE INSERT ON reports
FOR EACH ROW
BEGIN
    SET NEW.readiness_month = CASE 
        WHEN NEW.readiness = 'Ready Now' THEN 0
        WHEN NEW.readiness = '6 Months' THEN 6
        WHEN NEW.readiness = '7-12 Months' THEN 12
        WHEN NEW.readiness = '13-18 Months' THEN 18
        ELSE 0
    END;
    
    SET NEW.education_fulfillment_months = CASE 
        WHEN NEW.idp_program = 'SDP' THEN
            CASE 
                WHEN NEW.certificate IN ('ANT-I', 'ATT-I') THEN 0
                WHEN NEW.certificate IN ('ANT-II', 'ATT-II') THEN 5
                WHEN NEW.certificate IN ('ANT-III', 'ATT-III') THEN 8
                ELSE 0
            END
        WHEN NEW.idp_program = 'MDP' THEN
            CASE 
                WHEN NEW.certificate IN ('ANT-I', 'ATT-I', 'ANT-II', 'ATT-II') THEN 0
                WHEN NEW.certificate IN ('ANT-III', 'ATT-III') THEN 8
                ELSE 0
            END
        WHEN NEW.idp_program = 'FDP' THEN 0
        ELSE 0
    END;

    -- DISABLED: total_readiness_update_months is now read directly from Excel upload
    -- No longer auto-calculated by trigger
    -- SET NEW.total_readiness_update_months = 
    --     COALESCE(NEW.readiness_month, 0) + COALESCE(NEW.education_fulfillment_months, 0);
END`

	if err := db.Exec(triggerInsert).Error; err != nil {
		return err
	}

	triggerAfterInsert := `
CREATE TRIGGER after_insert_report_create_report_scores
AFTER INSERT ON reports
FOR EACH ROW
BEGIN
    DECLARE a_type_id BIGINT;

    IF NEW.value_assessment IS NOT NULL THEN
        SELECT id INTO a_type_id
        FROM assessment_types
        WHERE assessment_type_name = 'Value Assessment'
        LIMIT 1;

        IF a_type_id IS NOT NULL THEN
            INSERT INTO report_scores (report_id, assessment_type_id, score)
            VALUES (NEW.id, a_type_id, NEW.value_assessment);
        END IF;
    END IF;
END`

	if err := db.Exec(triggerAfterInsert).Error; err != nil {
		return err
	}

	triggerPopulateGapsInsert := `
CREATE TRIGGER after_report_insert_populate_gaps
AFTER INSERT ON reports
FOR EACH ROW
BEGIN
    DECLARE v_pos INT DEFAULT 1;
    DECLARE v_code VARCHAR(50);
    DECLARE v_competency_id INT;
    DECLARE v_gap_analysis TEXT;
    
    SET v_gap_analysis = REPLACE(NEW.competency_gap_analysis, ';', '; ');
    SET v_gap_analysis = REPLACE(v_gap_analysis, '  ', ' ');
    
    IF v_gap_analysis IS NOT NULL AND TRIM(v_gap_analysis) != '' THEN
        WHILE v_pos > 0 DO
            SET v_pos = LOCATE('; ', v_gap_analysis);
            
            IF v_pos > 0 THEN
                SET v_code = TRIM(SUBSTRING(v_gap_analysis, 1, v_pos - 1));
                SET v_gap_analysis = SUBSTRING(v_gap_analysis, v_pos + 2);
            ELSE
                SET v_code = TRIM(v_gap_analysis);
            END IF;
            
            IF v_code != '' AND LENGTH(v_code) <= 10 THEN
                SELECT id INTO v_competency_id 
                FROM competency_types 
                WHERE code = v_code 
                LIMIT 1;
                
                IF v_competency_id IS NOT NULL THEN
                    INSERT INTO gap_competencies (report_id, competency_type_id, gap_level, priority, created_at, updated_at)
                    VALUES (NEW.id, v_competency_id, 'MEDIUM', 1, NOW(), NOW())
                    ON DUPLICATE KEY UPDATE updated_at = NOW();

                    SET v_competency_id = NULL;
                END IF;
            END IF;
        END WHILE;
    END IF;
END`

	if err := db.Exec(triggerPopulateGapsInsert).Error; err != nil {
		return err
	}

	triggerPopulateGapsUpdate := `
CREATE TRIGGER after_report_update_populate_gaps
AFTER UPDATE ON reports
FOR EACH ROW
BEGIN
    DECLARE v_pos INT DEFAULT 1;
    DECLARE v_code VARCHAR(50);
    DECLARE v_competency_id INT;
    DECLARE v_gap_analysis TEXT;
    
    IF NEW.competency_gap_analysis != OLD.competency_gap_analysis THEN
        DELETE FROM gap_competencies WHERE report_id = NEW.id;
        
        SET v_gap_analysis = REPLACE(NEW.competency_gap_analysis, ';', '; ');
        SET v_gap_analysis = REPLACE(v_gap_analysis, '  ', ' ');
        
        IF v_gap_analysis IS NOT NULL AND TRIM(v_gap_analysis) != '' THEN
            WHILE v_pos > 0 DO
                SET v_pos = LOCATE('; ', v_gap_analysis);
                
                IF v_pos > 0 THEN
                    SET v_code = TRIM(SUBSTRING(v_gap_analysis, 1, v_pos - 1));
                    SET v_gap_analysis = SUBSTRING(v_gap_analysis, v_pos + 2);
                ELSE
                    SET v_code = TRIM(v_gap_analysis);
                END IF;
                
                IF v_code != '' AND LENGTH(v_code) <= 10 THEN
                    SELECT id INTO v_competency_id 
                    FROM competency_types 
                    WHERE code = v_code 
                    LIMIT 1;
                    
                    IF v_competency_id IS NOT NULL THEN
                        INSERT INTO gap_competencies (report_id, competency_type_id, gap_level, priority, created_at, updated_at)
                        VALUES (NEW.id, v_competency_id, 'MEDIUM', 1, NOW(), NOW())
                        ON DUPLICATE KEY UPDATE updated_at = NOW();

                        SET v_competency_id = NULL;
                    END IF;
                END IF;
            END WHILE;
        END IF;
    END IF;
END`

	if err := db.Exec(triggerPopulateGapsUpdate).Error; err != nil {
		return err
	}

	return nil
}

func updateExistingRecords(db *gorm.DB) error {
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

	updateEducationMonths := `
UPDATE reports
SET education_fulfillment_months = CASE 
    WHEN idp_program = 'SDP' THEN
        CASE 
            WHEN certificate IN ('ANT-I', 'ATT-I') THEN 0
            WHEN certificate IN ('ANT-II', 'ATT-II') THEN 5
            WHEN certificate IN ('ANT-III', 'ATT-III') THEN 8
            ELSE 0
        END
    WHEN idp_program = 'MDP' THEN
        CASE 
            WHEN certificate IN ('ANT-I', 'ATT-I', 'ANT-II', 'ATT-II') THEN 0
            WHEN certificate IN ('ANT-III', 'ATT-III') THEN 8
            ELSE 0
        END
    WHEN idp_program = 'FDP' THEN 0
    ELSE 0
END
WHERE education_fulfillment_months IS NULL`

	if err := db.Exec(updateEducationMonths).Error; err != nil {
		return err
	}

	updateTotalMonths := `
UPDATE reports
SET total_readiness_update_months = 
    COALESCE(readiness_month, 0) + COALESCE(education_fulfillment_months, 0)
WHERE total_readiness_update_months IS NULL`

	if err := db.Exec(updateTotalMonths).Error; err != nil {
		return err
	}

	type ReportGap struct {
		ID                    int
		CompetencyGapAnalysis string
	}

	var reports []ReportGap
	if err := db.Table("reports").
		Select("id, competency_gap_analysis").
		Where("competency_gap_analysis IS NOT NULL AND competency_gap_analysis != ''").
		Find(&reports).Error; err != nil {
		return err
	}

	for _, report := range reports {
		codes := strings.Split(report.CompetencyGapAnalysis, "; ")
		for _, code := range codes {
			code = strings.TrimSpace(code)
			if code == "" {
				continue
			}

			var competency domain.CompetencyType
			if err := db.Where("code = ?", code).First(&competency).Error; err != nil {
				continue
			}

			db.Exec(`INSERT INTO gap_competencies (report_id, competency_type_id, gap_level, priority, created_at, updated_at)
				VALUES (?, ?, 'MEDIUM', 1, NOW(), NOW())
				ON DUPLICATE KEY UPDATE updated_at = NOW()`,
				report.ID, competency.ID)
		}
	}

	return nil
}
