package services

import (
	"fmt"
	"net/http"
	"time"

	"backend/internal/models/converter"
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
	"github.com/golang-jwt/jwt/v5"
	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
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

func (service *UserService) CreateAccessToken(user *domain.User) (string, error) {
	// TODO: Generate JWT Token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      user.ID,
		"username": user.Username,
		"expired":  time.Now().Add(time.Hour * 6).Unix(), // 6 Hours
	})

	// TODO: Sign and Get the complete encoded token as a string using the secret key
	secretKey := service.Config.GetString("JWT_SECRET_KEY")
	fmt.Println(secretKey)

	tokenString, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func (service *UserService) Login(user *domain.User, password string) (*web.SuccessResponse, error) {
	// TODO: Compare the password
	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password))
	if err != nil {
		return nil, err
	}

	// TODO: Convert domain into data
	userData := converter.ToUserData(user)
	response := &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   userData,
	}

	return response, nil
}

func (service *UserService) Logout(ctx *gin.Context, token string) {
}
