package controllers

import (
	"fmt"
	"net/http"
	"os"

	"backend/internal/middlewares"
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/services"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type UserController struct {
	Log     *logrus.Logger
	Service *services.UserService
}

func NewUserController(service *services.UserService, log *logrus.Logger) *UserController {
	return &UserController{
		Log:     log,
		Service: service,
	}
}

func (c *UserController) Login(ctx *gin.Context) {
	// TODO: Validate the Request
	var request web.UserRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		ctx.Abort()
		return
	}

	// TODO: Find the user by username
	var user domain.User
	err := c.Service.UserReporsitory.FindByUsername(c.Service.DB, &user, request.Username)
	if err != nil {
		ctx.JSON(http.StatusNotFound, web.ErrorResponse{
			Code:   http.StatusNotFound,
			Status: "Not Found",
			Error:  "Username not found",
		})
		ctx.Abort()
		return
	}

	// TODO: Login
	response, err := c.Service.Login(&user, request.Password)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "Invalid username or password",
		})
		ctx.Abort()
		return
	}

	// TODO: Create Access Token
	tokenString, err := c.Service.CreateAccessToken(&user)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		ctx.Abort()
		return
	}

	// TODO: Create HTTP Only Cookie (optional, frontend will handle it)
	// In production with HTTPS, use secure=true
	isProduction := os.Getenv("ENV") == "production"
	ctx.SetSameSite(http.SameSiteLaxMode)  // Changed from None to Lax for same-site
	ctx.SetCookie(middlewares.TOKEN_COOKIE, tokenString, 3600*6, "/", "", isProduction, true)

	// Send token in response body for frontend to store
	userData := response.Data.(web.UserData)
	loginResponse := web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data: web.UserLoginResponse{
			ID:       userData.ID,
			Username: userData.Username,
			Token:    tokenString,
		},
	}

	ctx.JSON(http.StatusOK, loginResponse)
}

func (c *UserController) Logout(ctx *gin.Context) {
	middlewares.DeleteToken(ctx)

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Status: "OK",
		Code:   http.StatusOK,
		Data:   "Logged out successfully",
	})
}

// CreateUser membuat user baru (admin only)
func (c *UserController) CreateUser(ctx *gin.Context) {
	var request web.UserCreateRequest

	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	user, err := c.Service.CreateUser(&request)
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
		Status: "User created successfully",
		Data:   user,
	})
}

// GetAllUsers mengambil semua user (admin only)
func (c *UserController) GetAllUsers(ctx *gin.Context) {
	users, err := c.Service.GetAllUsers()
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
		Data:   users,
	})
}

// GetUserByID mengambil user berdasarkan ID (admin only)
func (c *UserController) GetUserByID(ctx *gin.Context) {
	userID := ctx.Param("id")

	var id int
	if _, err := fmt.Sscanf(userID, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "Invalid user ID",
		})
		return
	}

	user, err := c.Service.GetUserByID(id)
	if err != nil {
		ctx.JSON(http.StatusNotFound, web.ErrorResponse{
			Code:   http.StatusNotFound,
			Status: "Not Found",
			Error:  "User not found",
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   user,
	})
}

// UpdateUser update user (admin only)
func (c *UserController) UpdateUser(ctx *gin.Context) {
	userID := ctx.Param("id")

	var id int
	if _, err := fmt.Sscanf(userID, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "Invalid user ID",
		})
		return
	}

	var request web.UserUpdateRequest
	if err := ctx.ShouldBindJSON(&request); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  err.Error(),
		})
		return
	}

	user, err := c.Service.UpdateUser(id, &request)
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
		Status: "User updated successfully",
		Data:   user,
	})
}

// DeleteUser hapus user (admin only)
func (c *UserController) DeleteUser(ctx *gin.Context) {
	userID := ctx.Param("id")

	var id int
	if _, err := fmt.Sscanf(userID, "%d", &id); err != nil {
		ctx.JSON(http.StatusBadRequest, web.ErrorResponse{
			Code:   http.StatusBadRequest,
			Status: "Bad Request",
			Error:  "Invalid user ID",
		})
		return
	}

	if err := c.Service.DeleteUser(id); err != nil {
		ctx.JSON(http.StatusInternalServerError, web.ErrorResponse{
			Code:   http.StatusInternalServerError,
			Status: "Internal Server Error",
			Error:  err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "User deleted successfully",
		Data:   nil,
	})
}
