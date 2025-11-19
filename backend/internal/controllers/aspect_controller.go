package controllers

import (
	"backend/internal/models/web"
	"backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type AspectController struct {
	Log           *logrus.Logger
	AspectService *services.AspectService
}

func NewAspectController(log *logrus.Logger, aspectService *services.AspectService) *AspectController {
	return &AspectController{
		Log:           log,
		AspectService: aspectService,
	}
}

func (c *AspectController) Create(ctx *gin.Context) {
	var request web.AspectCreateRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		c.Log.Errorf("Failed to bind request: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	result, err := c.AspectService.Create(&request)
	if err != nil {
		c.Log.Errorf("Failed to create aspect: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create aspect"})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": result})
}

func (c *AspectController) Update(ctx *gin.Context) {
	idParam := ctx.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid aspect ID"})
		return
	}

	var request web.AspectUpdateRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		c.Log.Errorf("Failed to bind request: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	result, err := c.AspectService.Update(id, &request)
	if err != nil {
		if err.Error() == "aspect not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Aspect not found"})
			return
		}
		c.Log.Errorf("Failed to update aspect: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update aspect"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}

func (c *AspectController) Delete(ctx *gin.Context) {
	idParam := ctx.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid aspect ID"})
		return
	}

	err = c.AspectService.Delete(id)
	if err != nil {
		if err.Error() == "aspect not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Aspect not found"})
			return
		}
		c.Log.Errorf("Failed to delete aspect: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete aspect"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Aspect deleted successfully"})
}

func (c *AspectController) FindByID(ctx *gin.Context) {
	idParam := ctx.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid aspect ID"})
		return
	}

	result, err := c.AspectService.FindByID(id)
	if err != nil {
		if err.Error() == "aspect not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Aspect not found"})
			return
		}
		c.Log.Errorf("Failed to find aspect: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find aspect"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": result})
}

func (c *AspectController) FindAll(ctx *gin.Context) {
	results, err := c.AspectService.FindAll()
	if err != nil {
		c.Log.Errorf("Failed to find all aspects: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find aspects"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": results})
}

func (c *AspectController) FindByAssessmentID(ctx *gin.Context) {
	assessmentIDParam := ctx.Param("assessmentId")
	assessmentID, err := strconv.Atoi(assessmentIDParam)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid assessment ID"})
		return
	}

	results, err := c.AspectService.FindByAssessmentID(assessmentID)
	if err != nil {
		c.Log.Errorf("Failed to find aspects by assessment ID: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find aspects"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"data": results})
}

func (c *AspectController) AssignQuestionToAspect(ctx *gin.Context) {
	idParam := ctx.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid aspect ID"})
		return
	}

	var request struct {
		QuestionID int `json:"questionId" binding:"required"`
	}
	if err := ctx.ShouldBindJSON(&request); err != nil {
		c.Log.Errorf("Failed to bind request: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	err = c.AspectService.AssignQuestionToAspect(id, request.QuestionID)
	if err != nil {
		if err.Error() == "aspect not found" {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Aspect not found"})
			return
		}
		c.Log.Errorf("Failed to assign question to aspect: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign question to aspect"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"message": "Question assigned to aspect successfully"})
}
