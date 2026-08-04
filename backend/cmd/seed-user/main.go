package main

import (
	"backend/internal/config"
	"backend/internal/models/domain"
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	viperConfig := config.NewViper()
	logger := config.NewLogger(viperConfig)
	db := config.NewDatabase(viperConfig, logger)

	// Auto-migrate users table jika belum ada
	if err := db.AutoMigrate(&domain.User{}); err != nil {
		log.Fatalf("Failed to migrate users table: %v", err)
	}

	username := "davin"
	password := "davin"
	role := "admin"

	// Cek apakah user sudah ada
	var existingUser domain.User
	result := db.Where("username = ?", username).First(&existingUser)
	if result.Error == nil {
		fmt.Printf("User '%s' sudah ada (ID: %d). Mengupdate password...\n", username, existingUser.ID)

		// Hash password baru
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			log.Fatalf("Failed to hash password: %v", err)
		}

		// Update password
		if err := db.Model(&existingUser).Update("password", string(hashedPassword)).Error; err != nil {
			log.Fatalf("Failed to update password: %v", err)
		}

		fmt.Printf("Password user '%s' berhasil diupdate!\n", username)
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// Buat user baru
	user := &domain.User{
		Username: username,
		Password: string(hashedPassword),
		Role:     role,
	}

	if err := db.Create(user).Error; err != nil {
		log.Fatalf("Failed to create user: %v", err)
	}

	fmt.Printf("✅ User berhasil dibuat!\n")
	fmt.Printf("   Username : %s\n", username)
	fmt.Printf("   Password : %s\n", password)
	fmt.Printf("   Role     : %s\n", role)
	fmt.Printf("   ID       : %d\n", user.ID)
}
