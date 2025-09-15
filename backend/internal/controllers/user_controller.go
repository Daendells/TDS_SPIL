package controllers

import (
	"net/http"

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
			Error:  err.Error(),
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

	// TODO: Create HTTP Only Cookie
	ctx.SetSameSite(http.SameSiteNoneMode)
	ctx.SetCookie(middlewares.TOKEN_COOKIE, tokenString, 3600*6, "", "", false, true)

	ctx.JSON(http.StatusOK, response)
}

func (c *UserController) Logout(ctx *gin.Context) {
	middlewares.DeleteToken(ctx)

	ctx.JSON(http.StatusOK, web.SuccessResponse{
		Status: "OK",
		Code:   http.StatusOK,
		Data:   "Logged out successfully",
	})
}
