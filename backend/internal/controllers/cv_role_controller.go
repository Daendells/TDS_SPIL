package controllers

import (
	"fmt"
	"net/http"

	"backend/internal/models/web"
	"backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type CVRoleController struct {
	Log     *logrus.Logger
	Service *services.CVRoleService
}

func NewCVRoleController(service *services.CVRoleService, log *logrus.Logger) *CVRoleController {
	return &CVRoleController{
		Log:     log,
		Service: service,
	}
}

// GetAll mengambil semua data CV roles (Public / Authenticated)
func (c *CVRoleController) GetAll(ctx *gin.Context) {
	roles, err := c.Service.GetAll()
	if err != nil {
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
		Data:   roles,
	})
}

// GetByID mengambil detail CV role berdasarkan ID
func (c *CVRoleController) GetByID(ctx *gin.Context) {
	idStr := ctx.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "Invalid role ID",
		})
		return
	}

	role, err := c.Service.GetByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, web.ErrorResponse{
			Code:   http.StatusNotFound,
			Status: "Not Found",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   role,
	})
}

// Create membuat CV role baru (Admin only)
func (c *CVRoleController) Create(ctx *gin.Context) {
	var request web.CVRoleCreateRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	role, err := c.Service.Create(&request)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusCreated, web.SuccessResponse{
		Code:   http.StatusCreated,
		Status: "CV Role created successfully",
		Data:   role,
	})
}

// Update mengupdate data CV role (Admin only)
func (c *CVRoleController) Update(ctx *gin.Context) {
	idStr := ctx.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "Invalid role ID",
		})
		return
	}

	var request web.CVRoleUpdateRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	role, err := c.Service.Update(id, &request)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "CV Role updated successfully",
		Data:   role,
	})
}

// Delete menghapus CV role (Admin only)
func (c *CVRoleController) Delete(ctx *gin.Context) {
	idStr := ctx.Param("id")
	var id int
	if _, err := fmt.Sscanf(idStr, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "Invalid role ID",
		})
		return
	}

	if err := c.Service.Delete(id); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "CV Role deleted successfully",
		Data:   nil,
	})
}
