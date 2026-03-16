package controllers

import (
	"backend/internal/models/web"
	"backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type NewRecruiterController struct {
	DB      *gorm.DB
	Service services.NewRecruiterService
}

func NewNewRecruiterController(db *gorm.DB, service services.NewRecruiterService) *NewRecruiterController {
	return &NewRecruiterController{DB: db, Service: service}
}

func (c *NewRecruiterController) FindAll(ctx *gin.Context) {
	var req web.NewRecruiterListRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data, err := c.Service.FindAll(c.DB, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": data})
}

func (c *NewRecruiterController) Search(ctx *gin.Context) {
	var req web.NewRecruiterSearchRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data, err := c.Service.Search(c.DB, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, data)
}

func (c *NewRecruiterController) Create(ctx *gin.Context) {
	var req web.NewRecruiterCreateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data, err := c.Service.Create(c.DB, &req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": data})
}

func (c *NewRecruiterController) Update(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	var req web.NewRecruiterUpdateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data, err := c.Service.Update(c.DB, id, &req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": data})
}

func (c *NewRecruiterController) BulkAssignBatch(ctx *gin.Context) {
	var req web.NewRecruiterBulkAssignBatchRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := c.Service.BulkAssignBatch(c.DB, &req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"status": "batch assigned"})
}

func (c *NewRecruiterController) Delete(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := c.Service.Delete(c.DB, id); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func (c *NewRecruiterController) FindAssignments(ctx *gin.Context) {
	var req web.NewRecruiterAssignmentListRequest
	if err := ctx.ShouldBindQuery(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data, err := c.Service.FindAssignments(c.DB, &req)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": data})
}

func (c *NewRecruiterController) CreateAssignment(ctx *gin.Context) {
	var req web.NewRecruiterAssignmentCreateRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data, err := c.Service.CreateAssignment(c.DB, &req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": data})
}

func (c *NewRecruiterController) DeleteAssignment(ctx *gin.Context) {
	id, err := strconv.ParseUint(ctx.Param("id"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	if err := c.Service.DeleteAssignment(c.DB, id); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"status": "deleted"})
}

func (c *NewRecruiterController) CheckAssignment(ctx *gin.Context) {
	token := ctx.Param("token")
	assessmentTypeID, err := strconv.ParseUint(ctx.Param("assessmentTypeId"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid assessment type id"})
		return
	}
	data, err := c.Service.CheckAssignment(c.DB, token, assessmentTypeID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !data.IsAssigned {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": data.Message})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": data})
}

func (c *NewRecruiterController) CheckAssignmentWithRole(ctx *gin.Context) {
	token := ctx.Param("token")
	role := ctx.Param("role")
	assessmentTypeID, err := strconv.ParseUint(ctx.Param("assessmentTypeId"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid assessment type id"})
		return
	}
	data, err := c.Service.CheckAssignmentWithRole(c.DB, token, assessmentTypeID, role)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !data.IsAssigned {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": data.Message})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": data})
}

func (c *NewRecruiterController) IncrementAttempts(ctx *gin.Context) {
	token := ctx.Param("token")
	assessmentTypeID, err := strconv.ParseUint(ctx.Param("assessmentTypeId"), 10, 64)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid assessment type id"})
		return
	}
	data, err := c.Service.IncrementAttempts(c.DB, token, assessmentTypeID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": data})
}

func (c *NewRecruiterController) SubmitAssessment(ctx *gin.Context) {
	var req web.NewRecruiterAssessmentSubmitRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data, err := c.Service.SubmitAssessment(c.DB, &req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": data})
}

func (c *NewRecruiterController) SubmitQuiz(ctx *gin.Context) {
	var req web.NewRecruiterQuizSubmitRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	data, err := c.Service.SubmitQuiz(c.DB, &req)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": data})
}
