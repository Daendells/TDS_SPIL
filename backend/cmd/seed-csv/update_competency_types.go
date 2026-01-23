package main

import (
	"backend/internal/config"
	"backend/internal/models/domain"
	"encoding/csv"
	"fmt"
	"os"
	"strconv"
	"strings"

	"gorm.io/gorm"
)

func main() {
	viperConfig := config.NewViper()
	log := config.NewLogger(viperConfig)
	db := config.NewDatabase(viperConfig, log)

	log.Info("Starting Competency Types Update...")

	csvFile := "cmd/seed-csv/data/competency_types.csv"
	
	if _, err := os.Stat(csvFile); os.IsNotExist(err) {
		log.Fatalf("CSV file not found: %s", csvFile)
	}

	if err := updateCompetencyTypesFromCSV(db, csvFile, log); err != nil {
		log.Fatalf("Failed to update competency types: %v", err)
	}

	log.Info("Competency Types updated successfully!")
}

func updateCompetencyTypesFromCSV(db *gorm.DB, filePath string, log interface{ Infof(string, ...interface{}) }) error {
	records, err := readCompetencyTypesCSV(filePath)
	if err != nil {
		return fmt.Errorf("failed to read CSV: %w", err)
	}

	successCount := 0
	updateCount := 0
	createCount := 0

	for _, record := range records {
		if len(record) < 6 {
			continue
		}

		competencyType := domain.CompetencyType{
			ID:          parseIntHelper(record[0]),
			Code:        parseStringHelper(record[1]),
			Name:        parseStringHelper(record[2]),
			Description: parseStringHelper(record[3]),
			Category:    parseStringHelper(record[4]),
			IsActive:    parseBoolHelper(record[5]),
		}

		var existing domain.CompetencyType
		result := db.First(&existing, competencyType.ID)
		
		if result.Error == gorm.ErrRecordNotFound {
			if err := db.Create(&competencyType).Error; err != nil {
				log.Infof("Failed to create competency type ID %d (%s): %v", competencyType.ID, competencyType.Code, err)
				continue
			}
			createCount++
			log.Infof("Created: ID %d - %s (%s)", competencyType.ID, competencyType.Code, competencyType.Name)
		} else {
			if err := db.Model(&existing).Updates(map[string]interface{}{
				"code":        competencyType.Code,
				"name":        competencyType.Name,
				"description": competencyType.Description,
				"category":    competencyType.Category,
				"is_active":   competencyType.IsActive,
			}).Error; err != nil {
				log.Infof("Failed to update competency type ID %d (%s): %v", competencyType.ID, competencyType.Code, err)
				continue
			}
			updateCount++
			log.Infof("Updated: ID %d - %s (%s)", competencyType.ID, competencyType.Code, competencyType.Name)
		}
		
		successCount++
	}

	log.Infof("Summary: Total %d | Created %d | Updated %d", successCount, createCount, updateCount)
	return nil
}

func readCompetencyTypesCSV(filePath string) ([][]string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	reader.FieldsPerRecord = -1

	records, err := reader.ReadAll()
	if err != nil {
		return nil, err
	}

	if len(records) > 0 {
		records = records[1:]
	}

	return records, nil
}

func parseStringHelper(s string) string {
	s = strings.TrimSpace(s)
	if s == "" || s == "-" {
		return ""
	}
	return s
}

func parseIntHelper(s string) int {
	s = strings.TrimSpace(s)
	if s == "" {
		return 0
	}
	val, _ := strconv.Atoi(s)
	return val
}

func parseBoolHelper(s string) bool {
	s = strings.ToLower(strings.TrimSpace(s))
	return s == "true" || s == "1" || s == "yes"
}
