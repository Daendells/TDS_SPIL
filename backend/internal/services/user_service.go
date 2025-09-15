package services

import (
	"context"
	"time"

	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"gorm.io/gorm"
)

type UserService struct {
	DB              *gorm.DB
	Log             *logrus.Logger
	Validate        *validator.Validate
	Config          *viper.Viper
	UserReporsitory *repositories.UserReporsitory
}

func NewUserService(db *gorm.DB, log *logrus.Logger, validate *validator.Validate, config *viper.Viper, userRepository *repositories.UserReporsitory) *UserService {
	return &UserService{
		DB:              db,
		Log:             log,
		Validate:        validate,
		Config:          config,
		UserReporsitory: userRepository,
	}
}

func (service *UserService) CreateAccessToken(user domain.User) (string, error) {
	// TODO: Generate JWT Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      user.ID,
		"username": user.Username,
		"expired":  time.Now().Add(time.Hour * 6).Unix(), // 6 Hours
	})

	// TODO: Sign and Get the complete encoded token as a string using the secret key
	secretKey := service.Config.GetString("JWT_SECRET_KEY")

	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (service *UserService) Login(ctx *context.Context, user web.UserRequest) (web.UserData, error) {
	return web.UserData{}, nil
}

func (service *UserService) Logout(ctx *context.Context, token string) {
}
