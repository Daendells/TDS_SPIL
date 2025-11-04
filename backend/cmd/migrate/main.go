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

	if err := runSQLFile(db, "./documents/tds.sql"); err != nil {
		log.Fatalf("migration failed: %v", err)
	}

	log.Info("migration completed successfully")
}

func runSQLFile(db *gorm.DB, path string) error {
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
		// skip mysql client directives and comments
		if strings.HasPrefix(trim, "--") || strings.HasPrefix(trim, "/*") || strings.HasPrefix(trim, "USE ") || trim == "" {
			if err == io.EOF {
				break
			}
			if err == io.EOF {
				break
			}
			continue
		}

		sb.WriteString(line)
		if strings.HasSuffix(trim, ";") {
			stmt := sb.String()
			sb.Reset()
			stmt = strings.TrimSuffix(stmt, ";")
			stmt = strings.TrimSpace(stmt)
			if stmt == "" {
				if err == io.EOF {
					break
				}
				continue
			}

			if err := executeStatement(db, stmt); err != nil {
				return err
			}
		}

		if err == io.EOF {
			break
		}
	}

	return nil
}

func executeStatement(db *gorm.DB, stmt string) error {
	// log statement head for debugging
	head := stmt
	if len(head) > 100 {
		head = head[:100] + "..."
	}
	fmt.Printf("executing: %s\n", head)
	if err := db.Exec(stmt).Error; err != nil {
		return fmt.Errorf("exec statement failed: %w\nstatement: %s", err, stmt)
	}
	return nil
}
