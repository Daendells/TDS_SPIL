package config

import (
	"fmt"
	"net/http"

	"backend/internal/models/web"

	// "backend/internal/middlewares"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
)

func PanicRecovery(log *logrus.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Errorf("%s \"%s\" - Panic occured: %+v", c.Request.Method, c.Request.URL, err)

				// Return a unified error response
				c.JSON(http.StatusInternalServerError, web.ErrorResponse{
					Code:   http.StatusInternalServerError,
					Status: "Internal Server Error",
					Error:  fmt.Sprintf("%v", err),
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}

func NewGin(config *viper.Viper, log *logrus.Logger) *gin.Engine {
	if viper.GetString("ENV") == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	app := gin.Default()
	// CORS config
	app.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://127.0.0.1:3000", "http://tds_frontend:3000", "http://localhost:3001", "https://xh6bfsn9-3000.asse.devtunnels.ms"}, // your Next.js app
		AllowMethods:     []string{"POST", "GET", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	// app.Use(middlewares.PanicRecovery(log))
	app.Use(PanicRecovery(log))
	app.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"code":   http.StatusNotFound,
			"status": "Not Found",
		})
	})

	return app
}
