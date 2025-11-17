package controllers

import (
	"backend/internal/repositories"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type CompetencyTypeController struct {
	competencyTypeRepo repositories.CompetencyTypeRepository
	log                *logrus.Logger
}

func NewCompetencyTypeController(competencyTypeRepo repositories.CompetencyTypeRepository, log *logrus.Logger) *CompetencyTypeController {
	return &CompetencyTypeController{
		competencyTypeRepo: competencyTypeRepo,
		log:                log,
	}
}

// GetAll returns all competency types
func (c *CompetencyTypeController) GetAll(ctx *gin.Context) {
	competencyTypes, err := c.competencyTypeRepo.GetAll()
	if err != nil {
		c.log.WithError(err).Error("Failed to get all competency types")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve competency types",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": competencyTypes,
	})
}

// GetActive returns only active competency types
func (c *CompetencyTypeController) GetActive(ctx *gin.Context) {
	competencyTypes, err := c.competencyTypeRepo.GetActive()
	if err != nil {
		c.log.WithError(err).Error("Failed to get active competency types")
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to retrieve active competency types",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": competencyTypes,
	})
}

// GetByID returns a specific competency type by ID
func (c *CompetencyTypeController) GetByID(ctx *gin.Context) {
	idParam := ctx.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid ID format",
		})
		return
	}

	competencyType, err := c.competencyTypeRepo.GetByID(id)
	if err != nil {
		c.log.WithError(err).WithField("id", id).Error("Failed to get competency type by ID")
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "Competency type not found",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": competencyType,
	})
}

// GetByCode returns a specific competency type by code
func (c *CompetencyTypeController) GetByCode(ctx *gin.Context) {
	code := ctx.Param("code")

	competencyType, err := c.competencyTypeRepo.GetByCode(code)
	if err != nil {
		c.log.WithError(err).WithField("code", code).Error("Failed to get competency type by code")
		ctx.JSON(http.StatusNotFound, gin.H{
			"error": "Competency type not found",
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"data": competencyType,
	})
}
