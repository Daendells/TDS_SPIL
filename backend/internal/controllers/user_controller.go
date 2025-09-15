package controllers

import (
	"backend/internal/services"

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
