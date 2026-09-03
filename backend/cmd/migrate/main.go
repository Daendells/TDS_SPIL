package main

import (
	_ "embed"
	"backend/internal/config"
	"backend/internal/models/domain"
	"backend/internal/repositories"
	"backend/internal/services"
	"fmt"
	"strings"

	"github.com/sirupsen/logrus"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

//go:embed seeds/rec_disc.csv
var defaultDISCCSV string

func main() {
	viperConfig := config.NewViper()
	log := config.NewLogger(viperConfig)
	db := config.NewDatabase(viperConfig, log)

	log.Info("Starting database migrations...")

	log.Info("Normalizing legacy column types...")
	if err := normalizeLegacySchema(db); err != nil {
		log.Fatalf("schema normalization failed: %v", err)
	}

	// Run GORM auto migration (handles role column automatically)
	log.Info("Running GORM auto migration...")
	if err := runAutoMigrate(db); err != nil {
		log.Fatalf("GORM migration failed: %v", err)
	}

	log.Info("Migration completed successfully")

	log.Info("Deduplicating duplicate reports by seaman_code...")
	if err := deduplicateReports(db); err != nil {
		log.Fatalf("reports deduplication failed: %v", err)
	}
	log.Info("Reports deduplicated successfully")

	log.Info("Deduplicating gap competencies...")
	if err := deduplicateGapCompetencies(db); err != nil {
		log.Fatalf("gap competencies deduplication failed: %v", err)
	}
	log.Info("Gap competencies deduplicated successfully")

	log.Info("Populating default referensi for existing trainings...")
	if err := populateDefaultReferensi(db); err != nil {
		log.Fatalf("populate default referensi failed: %v", err)
	}
	log.Info("Default referensi populated successfully")

	log.Info("Seeding default CV roles if empty...")
	if err := seedDefaultCVRoles(db); err != nil {
		log.Fatalf("seed default cv roles failed: %v", err)
	}
	log.Info("Default CV roles verified/seeded successfully")

	log.Info("Seeding default system accounts (Admin & User/Viewer)...")
	if err := seedDefaultAccounts(db); err != nil {
		log.Fatalf("seed default accounts failed: %v", err)
	}
	log.Info("Default system accounts verified/seeded successfully")

	log.Info("Seeding default DISC psychometric assessments if empty...")
	if err := seedDefaultDISCAssessments(db, log); err != nil {
		log.Fatalf("seed default DISC assessments failed: %v", err)
	}
	log.Info("Default DISC assessments verified/seeded successfully")

	log.Info("Running batch system migrations...")
	if err := runBatchMigrations(db); err != nil {
		log.Fatalf("Batch migration failed: %v", err)
	}
	log.Info("Batch migration completed successfully")

	log.Info("Creating database triggers...")
	if err := createTriggers(db); err != nil {
		if isIgnorableTriggerError(err) {
			log.Warnf("Skipping trigger creation because current DB user lacks privileges: %v", err)
		} else {
			log.Fatalf("trigger creation failed: %v", err)
		}
	} else {
		log.Info("Triggers created successfully")
	}

	log.Info("Updating existing records with calculated values...")
	if err := updateExistingRecords(db); err != nil {
		log.Fatalf("update existing records failed: %v", err)
	}
	log.Info("All migrations completed successfully")
}

func isIgnorableTriggerError(err error) bool {
	if err == nil {
		return false
	}

	message := err.Error()
	return strings.Contains(message, "Error 1419") ||
		strings.Contains(message, "SUPER privilege") ||
		strings.Contains(message, "log_bin_trust_function_creators")
}

func normalizeLegacySchema(db *gorm.DB) error {
	var reportsTableExists int64
	if err := db.Raw(`
		SELECT COUNT(*) FROM information_schema.tables
		WHERE table_schema = DATABASE()
		AND table_name = 'reports'
	`).Scan(&reportsTableExists).Error; err != nil {
		return err
	}

	if reportsTableExists == 0 {
		return nil
	}

	if err := db.Exec(`
		ALTER TABLE reports
		MODIFY COLUMN seaman_code VARCHAR(50) NULL
	`).Error; err != nil {
		return fmt.Errorf("failed to normalize reports.seaman_code column: %w", err)
	}

	var batchesTableExists int64
	if err := db.Raw(`
		SELECT COUNT(*) FROM information_schema.tables
		WHERE table_schema = DATABASE()
		AND table_name = 'batches'
	`).Scan(&batchesTableExists).Error; err != nil {
		return err
	}

	if batchesTableExists > 0 {
		var batchNameColumnExists int64
		if err := db.Raw(`
			SELECT COUNT(*) FROM information_schema.columns
			WHERE table_schema = DATABASE()
			AND table_name = 'batches'
			AND column_name = 'batch_name'
		`).Scan(&batchNameColumnExists).Error; err != nil {
			return err
		}

		if batchNameColumnExists == 0 {
			if err := db.Exec(`
				ALTER TABLE batches
				ADD COLUMN batch_name VARCHAR(150) NULL AFTER batch_no
			`).Error; err != nil {
				return fmt.Errorf("failed to add batches.batch_name column: %w", err)
			}
		}

		if err := db.Exec(`
			UPDATE batches
			SET batch_name = CONCAT('Batch ', batch_no)
			WHERE batch_name IS NULL OR batch_name = ''
		`).Error; err != nil {
			return fmt.Errorf("failed to backfill batches.batch_name: %w", err)
		}

		if err := db.Exec(`
			ALTER TABLE batches
			MODIFY COLUMN batch_name VARCHAR(150) NOT NULL
		`).Error; err != nil {
			return fmt.Errorf("failed to enforce batches.batch_name column definition: %w", err)
		}
	}

	var usersTableExists int64
	if err := db.Raw(`
		SELECT COUNT(*) FROM information_schema.tables
		WHERE table_schema = DATABASE()
		AND table_name = 'users'
	`).Scan(&usersTableExists).Error; err != nil {
		return err
	}

	if usersTableExists > 0 {
		if err := db.Exec(`
			ALTER TABLE users
			MODIFY COLUMN role ENUM('admin', 'viewer') NOT NULL DEFAULT 'viewer'
		`).Error; err != nil {
			return fmt.Errorf("failed to normalize users.role column: %w", err)
		}
	}

	var newRecruitersTableExists int64
	if err := db.Raw(`
		SELECT COUNT(*) FROM information_schema.tables
		WHERE table_schema = DATABASE()
		AND table_name = 'new_recruiters'
	`).Scan(&newRecruitersTableExists).Error; err != nil {
		return err
	}

	if newRecruitersTableExists > 0 {
		var recruiterBatchColumnExists int64
		if err := db.Raw(`
			SELECT COUNT(*) FROM information_schema.columns
			WHERE table_schema = DATABASE()
			AND table_name = 'new_recruiters'
			AND column_name = 'batch_id'
		`).Scan(&recruiterBatchColumnExists).Error; err != nil {
			return err
		}

		if recruiterBatchColumnExists == 0 {
			if err := db.Exec(`
				ALTER TABLE new_recruiters
				ADD COLUMN batch_id BIGINT NULL AFTER academy_name
			`).Error; err != nil {
				return fmt.Errorf("failed to add new_recruiters.batch_id column: %w", err)
			}
		}
	}

	return nil
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
		&domain.CVRole{},
		&domain.AssessmentType{},
		&domain.CompetencyType{},
		&domain.Report{},
		&domain.NewRecruiter{},
		&domain.ApolloTrainingCache{},
		&domain.SeamenCache{},
		&domain.MutationCache{},
		&domain.DISCAssessment{},

		// Tables with single dependency
		&domain.Assessment{},
		&domain.SeafarerAssessment{},
		&domain.NewRecruiterAssignment{},
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
		&domain.NewRecruiterAssessmentSubmission{},
		&domain.NewRecruiterQuizAttempt{},
		&domain.NewRecruiterReportScore{},

		// Final dependent tables
		&domain.ScoreResult{},
		&domain.ReportScore{},

		// Batch system tables
		&domain.ReportBatch{},
		&domain.BatchReportSnapshot{},
	}

	for _, model := range models {
		if err := db.AutoMigrate(model); err != nil {
			return err
		}
	}

	return nil
}

func deduplicateReports(db *gorm.DB) error {
	// Check if reports table has duplicates by seaman_code
	var dupCount int64
	db.Raw(`
		SELECT COUNT(*) FROM (
			SELECT seaman_code FROM reports
			WHERE seaman_code IS NOT NULL AND seaman_code != ''
			GROUP BY seaman_code HAVING COUNT(*) > 1
		) AS dups
	`).Scan(&dupCount)

	if dupCount == 0 {
		fmt.Println("No duplicate reports found, skipping deduplication")
	} else {
		fmt.Printf("Found %d seaman_codes with duplicate reports, cleaning up...\n", dupCount)

		// Step 1: Delete gap_competencies for duplicate reports (keep lowest ID per seaman_code)
		result := db.Exec(`
			DELETE gc FROM gap_competencies gc
			INNER JOIN reports r ON gc.report_id = r.id
			WHERE r.seaman_code IS NOT NULL AND r.seaman_code != ''
			AND r.id NOT IN (
				SELECT min_id FROM (
					SELECT MIN(id) as min_id FROM reports
					WHERE seaman_code IS NOT NULL AND seaman_code != ''
					GROUP BY seaman_code
				) AS kept
			)
			AND r.seaman_code IN (
				SELECT dup_code FROM (
					SELECT seaman_code AS dup_code FROM reports
					WHERE seaman_code IS NOT NULL AND seaman_code != ''
					GROUP BY seaman_code HAVING COUNT(*) > 1
				) AS dups
			)
		`)
		if result.Error != nil {
			return fmt.Errorf("failed to delete gap_competencies for duplicate reports: %w", result.Error)
		}
		if result.RowsAffected > 0 {
			fmt.Printf("Removed %d gap_competencies from duplicate reports\n", result.RowsAffected)
		}

		// Step 2: Delete report_scores for duplicate reports
		result = db.Exec(`
			DELETE rs FROM report_scores rs
			INNER JOIN reports r ON rs.report_id = r.id
			WHERE r.seaman_code IS NOT NULL AND r.seaman_code != ''
			AND r.id NOT IN (
				SELECT min_id FROM (
					SELECT MIN(id) as min_id FROM reports
					WHERE seaman_code IS NOT NULL AND seaman_code != ''
					GROUP BY seaman_code
				) AS kept
			)
			AND r.seaman_code IN (
				SELECT dup_code FROM (
					SELECT seaman_code AS dup_code FROM reports
					WHERE seaman_code IS NOT NULL AND seaman_code != ''
					GROUP BY seaman_code HAVING COUNT(*) > 1
				) AS dups
			)
		`)
		if result.Error != nil {
			return fmt.Errorf("failed to delete report_scores for duplicate reports: %w", result.Error)
		}
		if result.RowsAffected > 0 {
			fmt.Printf("Removed %d report_scores from duplicate reports\n", result.RowsAffected)
		}

		// Step 3: Delete duplicate reports (keep lowest ID per seaman_code)
		result = db.Exec(`
			DELETE r1 FROM reports r1
			INNER JOIN reports r2
			ON r1.seaman_code = r2.seaman_code AND r1.id > r2.id
			WHERE r1.seaman_code IS NOT NULL AND r1.seaman_code != ''
		`)
		if result.Error != nil {
			return fmt.Errorf("failed to delete duplicate reports: %w", result.Error)
		}
		if result.RowsAffected > 0 {
			fmt.Printf("Removed %d duplicate report records\n", result.RowsAffected)
		}
	}

	// Ensure unique index on seaman_code exists to prevent future duplicates
	// This prevents duplicate reports for the same seafarer
	db.Exec(`ALTER TABLE reports ADD UNIQUE INDEX idx_seaman_code (seaman_code)`)
	// Ignore error if index already exists
	fmt.Println("Ensured unique index on reports.seaman_code")

	return nil
}

func deduplicateGapCompetencies(db *gorm.DB) error {
	// Check if gap_competencies table has data
	var count int64
	if err := db.Table("gap_competencies").Count(&count).Error; err != nil {
		// Table might not exist yet on first run, skip
		return nil
	}

	if count == 0 {
		return nil
	}

	// Remove duplicates, keeping the row with the lowest ID for each (report_id, competency_type_id)
	result := db.Exec(`
		DELETE g1 FROM gap_competencies g1
		INNER JOIN gap_competencies g2
		ON g1.report_id = g2.report_id
		   AND g1.competency_type_id = g2.competency_type_id
		   AND g1.id > g2.id
	`)
	if result.Error != nil {
		return fmt.Errorf("failed to deduplicate gap competencies: %w", result.Error)
	}

	if result.RowsAffected > 0 {
		fmt.Printf("Removed %d duplicate gap competency records\n", result.RowsAffected)
	}

	// Ensure unique index exists (AutoMigrate may have failed if duplicates existed before)
	db.Exec(`ALTER TABLE gap_competencies ADD UNIQUE INDEX idx_report_competency (report_id, competency_type_id)`)
	// Ignore error if index already exists (created by AutoMigrate)

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

// runBatchMigrations performs the data migration for the new batch system:
// 1. Migrates existing reports.batch_id data to the report_batches junction table
// 2. Ensures the batches table has the new status and snapshotted_at columns
func runBatchMigrations(db *gorm.DB) error {
	db.Exec("ALTER TABLE batches MODIFY COLUMN type ENUM('crew','new_recruiter') NOT NULL DEFAULT 'crew'")
	if err := db.Exec("UPDATE batches SET type = 'crew' WHERE type IS NULL OR type = ''").Error; err != nil {
		return err
	}

	// Migrate existing reports.batch_id → report_batches (only if batch_id column still exists)
	var batchColExists int64
	db.Raw(`
		SELECT COUNT(*) FROM information_schema.columns
		WHERE table_schema = DATABASE()
		AND table_name = 'reports'
		AND column_name = 'batch_id'
	`).Scan(&batchColExists)

	if batchColExists > 0 {
		// Copy existing one-to-many data into the new junction table (ignore duplicates)
		if err := db.Exec(`
			INSERT IGNORE INTO report_batches (report_id, batch_id, assigned_at)
			SELECT id, batch_id, NOW()
			FROM reports
			WHERE batch_id IS NOT NULL
		`).Error; err != nil {
			return err
		}

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
		// Skip if this report already has gap_competencies (avoids duplicates on re-deploy)
		var existingCount int64
		db.Table("gap_competencies").Where("report_id = ?", report.ID).Count(&existingCount)
		if existingCount > 0 {
			continue
		}

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

func seedDefaultCVRoles(db *gorm.DB) error {
	var count int64
	if err := db.Model(&domain.CVRole{}).Count(&count).Error; err != nil {
		return err
	}

	if count > 0 {
		return nil
	}

	defaultRoles := []domain.CVRole{
		{Name: "NAKHODA", Category: "DECK", Description: "Master / Nakhoda kapal berijazah ANT-I, bertanggung jawab penuh atas keselamatan kapal, muatan, navigasi, dan seluruh kru kapal."},
		{Name: "EXTRA NAKHODA", Category: "DECK", Description: "Perwira navigasi senior berijazah ANT-I/ANT-II sebagai perbantuan komando dan operasional kapal."},
		{Name: "MUALIM I", Category: "DECK", Description: "Chief Officer / Chief Mate berijazah ANT-II/ANT-I, bertanggung jawab atas muatan kapal, stabilitas, dan pemeliharaan lambung/dek."},
		{Name: "EXT. MUALIM I", Category: "DECK", Description: "Perwira dek tambahan berijazah ANT-II membantu Chief Officer dalam operasional muatan dan stabilitas."},
		{Name: "MUALIM II", Category: "DECK", Description: "Second Officer berijazah ANT-III/ANT-II, perwira navigasi, pemeliharaan peralatan navigasi dan peta laut."},
		{Name: "EXT. MUALIM II", Category: "DECK", Description: "Perwira dek tambahan membantu Second Officer dalam tugas navigasi dan administrasi pelayaran."},
		{Name: "MUALIM III", Category: "DECK", Description: "Third Officer berijazah ANT-III/ANT-IV, bertanggung jawab atas peralatan keselamatan dan pemadam kebakaran kapal."},
		{Name: "EXT. MUALIM III", Category: "DECK", Description: "Perwira dek tambahan membantu Third Officer dalam pemeliharaan alat-alat keselamatan (LSA/FFA)."},
		{Name: "MUALIM IV", Category: "DECK", Description: "Junior Deck Officer berijazah ANT-IV membantu dinas jaga navigasi dan operasional dek."},
		{Name: "KKM", Category: "ENGINE", Description: "Chief Engineer / Kepala Kamar Mesin berijazah ATT-I, bertanggung jawab penuh atas seluruh permesinan, propulsi, dan kelistrikan kapal."},
		{Name: "EXTRA KKM", Category: "ENGINE", Description: "Perwira mesin senior berijazah ATT-I/ATT-II membantu manajemen kamar mesin dan overhaul mesin utama."},
		{Name: "MASINIS I", Category: "ENGINE", Description: "Second Engineer berijazah ATT-II/ATT-I, penanggung jawab operasional mesin induk (main engine) dan koordinasi harian tim mesin."},
		{Name: "EXT. MASINIS I", Category: "ENGINE", Description: "Perwira mesin tambahan membantu Second Engineer dalam pemeliharaan mesin induk dan instalasi mekanikal."},
		{Name: "MASINIS II", Category: "ENGINE", Description: "Third Engineer berijazah ATT-III/ATT-II, penanggung jawab generator (auxiliary engine), kompresor, dan pompa-pompa utama."},
		{Name: "EXT. MASINIS II", Category: "ENGINE", Description: "Perwira mesin tambahan membantu Third Engineer dalam perawatan auxiliary engine dan purifier."},
		{Name: "MASINIS III", Category: "ENGINE", Description: "Fourth Engineer berijazah ATT-III/ATT-IV, bertanggung jawab atas boiler, sistem refrigerasi, AC, dan water maker."},
		{Name: "MASINIS IV", Category: "ENGINE", Description: "Junior Engineer berijazah ATT-IV bertugas membantu dinas jaga mesin dan bunker kapal."},
		{Name: "ELECTRICIAN", Category: "ENGINE", Description: "Electro-Technical Officer (ETO) / Electrician berijazah ETO/Kelistrikan Maritim, bertanggung jawab atas seluruh sistem kelistrikan, otomasi, reefer container, dan navigasi elektronik kapal."},
		{Name: "MARKONIS", Category: "DECK", Description: "Radio Officer / GMDSS Operator bertugas menangani komunikasi radio maritim, satelit, dan keselamatan maritim."},
		{Name: "MANDOR MESIN", Category: "ENGINE", Description: "Engine Foreman / Bosun Mesin, mengoordinasikan rating mesin (juru minyak, fitter) dalam pekerjaan pemeliharaan kamar mesin."},
		{Name: "FITTER", Category: "ENGINE", Description: "Tukang Las & Bubut kapal, ahli fabrikasi, pemotongan, pengelasan pipa, dan perbaikan mekanikal darurat di atas kapal."},
		{Name: "JURU MINYAK", Category: "ENGINE", Description: "Oiler / Rating Engine berijazah COP Rating Forming Part of an Engine-room Watch, membantu pelumasan dan dinas jaga kamar mesin."},
		{Name: "SERANG", Category: "DECK", Description: "Boatswain (Bosun) / Kepala Rating Dek, memimpin rating dek dalam pemeliharaan kapal, pengecatan, olah gerak, dan tali-temali."},
		{Name: "JURU MUDI", Category: "DECK", Description: "Able Seaman Deck (AB) / Helmsman berijazah COP Rating Deck Watch, memegang kemudi saat olah gerak dan dinas jaga navigasi."},
		{Name: "KELASI", Category: "DECK", Description: "Ordinary Seaman (OS) berijazah COP Deck, membantu pekerjaan pembersihan, pengecatan, sandar-lepas kapal, dan bongkar muat."},
		{Name: "JURU MASAK I", Category: "CATERING", Description: "Chief Cook berijazah Ship's Cook Certificate, bertanggung jawab menyusun menu, mengelola bahan makanan, dan memasak untuk seluruh kru kapal."},
		{Name: "JURU MASAK II", Category: "CATERING", Description: "Second Cook membantu Chief Cook dalam persiapan makanan, kebersihan dapur galley, dan penataan messroom."},
		{Name: "PELAYAN", Category: "CATERING", Description: "Messman / Steward, bertanggung jawab atas kebersihan messroom, akomodasi perwira, dan penyajian makanan."},
		{Name: "KADET DEK", Category: "TRAINEE", Description: "Deck Cadet, taruna pelayaran jurusan nautika yang menjalani praktek laut (Prala) untuk persiapan ANT-III."},
		{Name: "KADET MESIN", Category: "TRAINEE", Description: "Engine Cadet, taruna pelayaran jurusan teknika yang menjalani praktek laut (Prala) untuk persiapan ATT-III."},
		{Name: "KADET ELECTRONIC", Category: "TRAINEE", Description: "Electro-Technical Cadet, taruna elektro maritim menjalani praktek lapangan sistem kelistrikan kapal."},
	}

	for _, role := range defaultRoles {
		if err := db.Create(&role).Error; err != nil {
			return err
		}
	}

	return nil
}

func seedDefaultAccounts(db *gorm.DB) error {
	defaultUsers := []struct {
		Username string
		Password string
		Role     string
	}{
		{Username: "admin", Password: "admin123", Role: "admin"},
		{Username: "user", Password: "user123", Role: "viewer"},
		{Username: "davin", Password: "davin", Role: "admin"},
	}

	for _, u := range defaultUsers {
		var existing domain.User
		err := db.Where("username = ?", u.Username).First(&existing).Error
		hashed, errHash := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if errHash != nil {
			return errHash
		}

		if err != nil && err == gorm.ErrRecordNotFound {
			newUser := domain.User{
				Username: u.Username,
				Password: string(hashed),
				Role:     u.Role,
				SSOID:    nil,
			}
			if err := db.Create(&newUser).Error; err != nil {
				return err
			}
		} else if err == nil {
			db.Model(&existing).Updates(map[string]interface{}{
				"password": string(hashed),
				"role":     u.Role,
			})
		}
	}

	return nil
}

func seedDefaultDISCAssessments(db *gorm.DB, log *logrus.Logger) error {
	repo := repositories.NewDISCRepository(log)
	count, err := repo.Count(db)
	if err != nil {
		return err
	}
	if count > 0 {
		return nil
	}

	service := services.NewDISCService(db, log, repo)
	imported, err := service.ImportCSV(defaultDISCCSV)
	if err != nil {
		return err
	}
	log.Infof("Successfully seeded %d DISC psychometric assessment records", imported)
	return nil
}

