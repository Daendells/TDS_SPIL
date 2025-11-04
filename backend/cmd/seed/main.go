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

func main() {
	viperConfig := config.NewViper()
	log := config.NewLogger(viperConfig)
	db := config.NewDatabase(viperConfig, log)

	// Seed by executing INSERT statements from tds.sql (non-destructive)
	if err := runInsertOnlySQL(db, "./documents/tds.sql"); err != nil {
		log.Fatalf("seeder failed: %v", err)
	}

	log.Info("seeding completed successfully")
}

func runInsertOnlySQL(db *gorm.DB, path string) error {
	f, err := os.Open(path)
	if err != nil {
		return fmt.Errorf("open sql file: %w", err)
	}
	defer f.Close()

	reader := bufio.NewReader(f)
	var sb strings.Builder
	for {
		line, err := reader.ReadString('\n')
		if err != nil && err != io.EOF {
			return fmt.Errorf("read sql file: %w", err)
		}

		trim := strings.TrimSpace(line)
		if trim == "" {
			if err == io.EOF { break }
			continue
		}

		// collect until semicolon
		sb.WriteString(line)
		if strings.HasSuffix(trim, ";") {
			stmt := sb.String()
			sb.Reset()
			stmtTrim := strings.TrimSpace(stmt)
			// only execute INSERT statements
			if strings.HasPrefix(strings.ToUpper(stmtTrim), "INSERT INTO") {
				if err := executeStatement(db, stmtTrim); err != nil {
					return err
				}
			}
		}

		if err == io.EOF { break }
	}

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
