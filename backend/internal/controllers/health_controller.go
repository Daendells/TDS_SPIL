package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthCheck handles health check requests for Docker/Kubernetes
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
		"service": "tds-backend",
	})
}
