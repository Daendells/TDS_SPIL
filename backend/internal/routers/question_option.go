package routers

import (
	"backend/internal/controllers"

	"github.com/gin-gonic/gin"
)

type QuestionOptionRouterConfig struct {
	App                      *gin.Engine
	QuestionOptionController *controllers.QuestionOptionController
	AuthMiddleware           gin.HandlerFunc
}

func (c *QuestionOptionRouterConfig) Setup() {
	c.SetupAuthRouter()
}

func (c *QuestionOptionRouterConfig) SetupAuthRouter() {
	// This router config is not used anymore
	// All question-option routes are now defined in router.go
	// Keeping this for future use if needed
}