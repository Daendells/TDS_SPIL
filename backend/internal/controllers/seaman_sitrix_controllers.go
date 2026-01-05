package controllers

import (
	"net/http"
	"strconv"

	"backend/internal/services"

	"github.com/gin-gonic/gin"
)

type SeamanController struct {
	service *services.SeamanService
}

func NewSeamanController(service *services.SeamanService) *SeamanController {
	return &SeamanController{service: service}
}

func (c *SeamanController) SearchAvailableSeamen(ctx *gin.Context) {
	query := ctx.Query("query")
	limitStr := ctx.DefaultQuery("limit", "10")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 10
	}

	results, err := c.service.SearchAvailableSeamen(query, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"code":   500,
			"status": "ERROR",
			"error":  "Failed to search seamen",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"code":   200,
		"status": "OK",
		"data":   results,
	})
}
