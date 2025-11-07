package controllers

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type CompetencyMappingController struct {
	db                             *gorm.DB
	log                            *logrus.Logger
	competencyProgramMappingRepo   repositories.CompetencyProgramMappingRepository
	trainingRepository             *repositories.TrainingRepository
}

func NewCompetencyMappingController(
	db *gorm.DB,
	log *logrus.Logger,
	competencyProgramMappingRepo repositories.CompetencyProgramMappingRepository,
	trainingRepository *repositories.TrainingRepository,
) *CompetencyMappingController {
	return &CompetencyMappingController{
		db:                           db,
		log:                          log,
		competencyProgramMappingRepo: competencyProgramMappingRepo,
		trainingRepository:           trainingRepository,
	}
}

// GetAllMappings handles GET /api/competency-mappings
func (c *CompetencyMappingController) GetAllMappings(ctx *gin.Context) {
	mappings, err := c.competencyProgramMappingRepo.GetAll()
	if err != nil {
		c.log.WithError(err).Error("Failed to get all competency mappings")
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   mappings,
	})
}

// GetMappingsByProgram handles GET /api/competency-mappings?program=SDP
func (c *CompetencyMappingController) GetMappingsByProgram(ctx *gin.Context) {
	program := ctx.Query("program")
	if program == "" {
		program = "SDP" // Default
	}

	mappings, err := c.competencyProgramMappingRepo.GetByProgram(program)
	if err != nil {
		c.log.WithError(err).WithField("program", program).Error("Failed to get competency mappings by program")
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   mappings,
	})
}

// CreateMapping handles POST /api/competency-mappings
func (c *CompetencyMappingController) CreateMapping(ctx *gin.Context) {
	var mapping domain.CompetencyProgramMapping
	if err := ctx.ShouldBindJSON(&mapping); err != nil {
		c.log.WithError(err).Error("Failed to bind JSON")
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	if err := c.competencyProgramMappingRepo.Create(&mapping); err != nil {
		c.log.WithError(err).Error("Failed to create competency mapping")
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, web.SuccessResponse{
		Code:   http.StatusCreated,
		Status: "Created",
		Data:   mapping,
	})
}

// UpdateMapping handles PUT /api/competency-mappings/:id
func (c *CompetencyMappingController) UpdateMapping(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "Invalid ID",
		})
		return
	}

	var mapping domain.CompetencyProgramMapping
	if err := ctx.ShouldBindJSON(&mapping); err != nil {
		c.log.WithError(err).Error("Failed to bind JSON")
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	mapping.ID = id
	if err := c.competencyProgramMappingRepo.Update(&mapping); err != nil {
		c.log.WithError(err).Error("Failed to update competency mapping")
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   mapping,
	})
}

// DeleteMapping handles DELETE /api/competency-mappings/:id
func (c *CompetencyMappingController) DeleteMapping(ctx *gin.Context) {
	id, err := strconv.Atoi(ctx.Param("id"))
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "Invalid ID",
		})
		return
	}

	if err := c.competencyProgramMappingRepo.Delete(id); err != nil {
		c.log.WithError(err).Error("Failed to delete competency mapping")
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   gin.H{"message": "Mapping deleted successfully"},
	})
}

// GetAllTrainings handles GET /api/trainings
func (c *CompetencyMappingController) GetAllTrainings(ctx *gin.Context) {
	var trainings []domain.Training
	if err := c.trainingRepository.FindAll(c.db, &trainings); err != nil {
		c.log.WithError(err).Error("Failed to get all trainings")
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   trainings,
	})
}
