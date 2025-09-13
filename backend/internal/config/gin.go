package config

import (
	"net/http"
	"time"

	"backend/internal/middlewares"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

func NewGin(config *viper.Viper, log *logrus.Logger) *gin.Engine {
	if viper.GetString("ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	app := gin.Default()
	// CORS config
	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000"}, // your Next.js app
		AllowMethods:     []string{"POST", "GET", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"*"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	app.Use(middlewares.PanicRecovery(log))
	app.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"code":   http.StatusNotFound,
			"status": "Not Found",
		})
	})

	return app
}
