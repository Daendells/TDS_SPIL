package main

import (
	"strconv"

	"backend/internal/config"

	"github.com/gin-gonic/gin"
)

func main() {
	viperConfig := config.NewViper()
	log := config.NewLogger(viperConfig)
	validate := config.NewValidator()
	app := config.NewGin(viperConfig, log)
	db := config.NewDatabase(viperConfig, log)

	// Bootstrap all configs
	config.Bootstrap(&config.BootstrapConfig{
		DB:       db,
		App:      app,
		Log:      log,
		Validate: validate,
		Config:   viperConfig,
	})

	// Get the Web Port
	webPort := viperConfig.GetInt("WEB_PORT")

	if viperConfig.GetString("ENV") == "production" {
		log.Info("ON PRODUCTION ENVIRONTMENT")
		gin.SetMode(gin.ReleaseMode)
	}

	err := app.Run(":" + strconv.Itoa(webPort))
	if err != nil {
		log.Fatal("Something went wrong")
	}
}
