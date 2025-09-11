package middlewares

import (
	"fmt"
	"net/http"

	"backend/internal/models/web"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func PanicRecovery(log *logrus.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if err := recover(); err != nil {
				log.Errorf("%s \"%s\" - Panic occured: %+v", c.Request.Method, c.Request.URL, err)

				// Return a unified error response
				c.JSON(http.StatusInternalServerError, web.ErrorResponse{
					Code:   http.StatusInternalServerError,
					Status: "Internal Server Error",
					Error:  fmt.Sprintf("%v", err),
				})
				c.Abort()
			}
		}()
		c.Next()
	}
}
