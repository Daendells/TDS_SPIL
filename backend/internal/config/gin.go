package config

import (
	"net/http"

	"backend/internal/middlewares"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

func NewGin(config *viper.Viper, log *logrus.Logger) *gin.Engine {
	if viper.GetString("ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	app := gin.Default()
	app.Use(middlewares.PanicRecovery(log))
	app.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"code":   http.StatusNotFound,
			"status": "Not Found",
		})
	})

	return app
}
