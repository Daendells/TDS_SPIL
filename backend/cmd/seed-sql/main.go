package main

import (
	"bufio"
	"fmt"
	"io"
	"os"
	"strings"

	"backend/internal/config"

	"gorm.io/gorm"
)

// This seeder is for loading large data from SQL file
// Use this after running the Go-based seeder for core data
// This will load: questions, options, reports, training, gap_competencies, etc.

func main() {
	viperConfig := config.NewViper()
	log := config.NewLogger(viperConfig)
	db := config.NewDatabase(viperConfig, log)

	log.Info("Starting SQL-based seeding for large data tables...")

	// Seed by executing INSERT statements from seed_data.sql (new schema)
	if err := runInsertOnlySQL(db, "./cmd/seed-sql/seed_data.sql"); err != nil {
		log.Fatalf("SQL seeder failed: %v", err)
	}

	log.Info("SQL seeding completed successfully")
}

func runInsertOnlySQL(db *gorm.DB, path string) error {
	f, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("open sql file: %w", err)
	}
	defer f.Close()

	reader := bufio.NewReader(f)
	var sb strings.Builder
	insertCount := 0
	inStatement := false

	for {
		line, err := reader.ReadString('\n')
		if err != nil && err != io.EOF {
			return fmt.Errorf("read sql file: %w", err)
		}

		trim := strings.TrimSpace(line)

		// Skip empty lines and comments only if not in the middle of a statement
		if trim == "" || strings.HasPrefix(trim, "--") {
			if !inStatement {
				if err == io.EOF {
					break
				}
				continue
			}
		}

		// Check if this line starts a new statement
		upperTrim := strings.ToUpper(trim)
		if !inStatement && (strings.HasPrefix(upperTrim, "INSERT INTO") || strings.HasPrefix(upperTrim, "SET ")) {
			inStatement = true
		}

		// collect until semicolon
		if inStatement {
			sb.WriteString(line)
		}

		if strings.HasSuffix(trim, ";") && inStatement {
			stmt := sb.String()
			sb.Reset()
			inStatement = false
			stmtTrim := strings.TrimSpace(stmt)

			// Execute all INSERT and SET statements from the SQL file
			upperStmt := strings.ToUpper(stmtTrim)
			if strings.HasPrefix(upperStmt, "INSERT INTO") || strings.HasPrefix(upperStmt, "SET ") {
				if execErr := executeStatement(db, stmtTrim); execErr != nil {
					// Log error but continue with other inserts
					fmt.Printf("Warning: Failed to execute statement: %v\n", execErr)
				} else {
					if strings.HasPrefix(upperStmt, "INSERT INTO") {
						insertCount++
					}
				}
			}
		}

		if err == io.EOF {
			break
		}
	}

	fmt.Printf("Total inserts executed: %d\n", insertCount)
	return nil
}

func executeStatement(db *gorm.DB, stmt string) error {
	head := stmt
	if len(head) > 200 {
		head = head[:200] + "..."
	}
	fmt.Printf("executing insert: %s\n", head)
	if err := db.Exec(stmt).Error; err != nil {
		return fmt.Errorf("exec statement failed: %w\nstatement: %s", err, stmt)
	}
	return nil
}
