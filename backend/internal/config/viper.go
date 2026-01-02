package config

import (
	"log"

	"github.com/spf13/viper"
)

func NewViper() *viper.Viper {
	config := viper.New()

	// Set default values (optional)
	config.SetDefault("DB_HOST", "localhost")
	config.SetDefault("DB_PORT", "3306")
	config.SetDefault("WEB_PORT", 8080)
	config.SetDefault("ENV", "development")

	// Try to read .env file (optional for Docker)
	config.SetConfigFile(".env")
	config.AddConfigPath("./../")
	config.AddConfigPath("./")
	
	err := config.ReadInConfig()
	if err != nil {
		// .env file not found - this is OK in Docker
		log.Printf("Warning: .env file not found, using environment variables: %v", err)
	}

	// AutomaticEnv will override .env values with environment variables
	// This is crucial for Docker where we inject env via docker-compose
	config.AutomaticEnv()

	return config
}
