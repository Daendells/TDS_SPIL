package middlewares

import (
	"net/http"
	"time"

	"backend/internal/models/web"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var (
	TOKEN_COOKIE = "Authorization"
	TOKEN_KEY    = "TOKEN"
	USER_KEY     = "USER"
	ROLE_KEY     = "ROLE"
)

func DeleteToken(ctx *gin.Context) {
	ctx.SetCookie(TOKEN_COOKIE, "delete", -1, "", "", false, true)
}

func AuthMiddleware(secret string) gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var tokenString string
		var err error

		// First try to get token from cookie
		tokenString, err = ctx.Cookie(TOKEN_COOKIE)

		// If no cookie, try Authorization header
		if err != nil || tokenString == "" {
			authHeader := ctx.GetHeader("Authorization")
			if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				tokenString = authHeader[7:] // Remove "Bearer " prefix
			} else {
				ctx.JSON(http.StatusUnauthorized, web.ErrorResponse{
					Code:   http.StatusUnauthorized,
					Status: "Unauthorized",
					Error:  "Missing Token",
				})
				ctx.Abort()
				return
			}
		}

		// Decode and Validate JWT
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			return []byte(secret), nil
		}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))

		if err != nil {
			ctx.JSON(http.StatusUnauthorized, web.ErrorResponse{
				Code:   http.StatusUnauthorized,
				Status: "Unauthorized",
				Error:  "Invalid or Expired Token Signature",
			})
			ctx.Abort()
			return
		}

		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			// Check expiration
			if exp, ok := claims["expired"].(float64); ok {
				if float64(time.Now().Unix()) > exp {
					DeleteToken(ctx)
					ctx.JSON(http.StatusUnauthorized, web.ErrorResponse{
						Code:   http.StatusUnauthorized,
						Status: "Unauthorized",
						Error:  "Token Expired",
					})
					ctx.Abort()
					return
				}
			}

			// Extract User Info & Role
			role := "viewer"
			if r, ok := claims["role"].(string); ok && r != "" {
				role = r
			}

			username := ""
			if u, ok := claims["username"].(string); ok {
				username = u
			}

			ctx.Set(TOKEN_KEY, tokenString)
			ctx.Set(USER_KEY, username)
			ctx.Set(ROLE_KEY, role)

			ctx.Next()
		} else {
			ctx.JSON(http.StatusUnauthorized, web.ErrorResponse{
				Code:   http.StatusUnauthorized,
				Status: "Unauthorized",
				Error:  "Failed to claim token",
			})
			ctx.Abort()
			return
		}
	}
}

// AdminOnly middleware memastikan bahwa request hanya dapat dilakukan oleh pengguna dengan role 'admin'
func AdminOnly() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		roleVal, exists := ctx.Get(ROLE_KEY)
		if !exists || roleVal != "admin" {
			ctx.JSON(http.StatusForbidden, web.ErrorResponse{
				Code:   http.StatusForbidden,
				Status: "Forbidden",
				Error:  "Akses ditolak: Fitur ini hanya dapat diakses oleh Admin",
			})
			ctx.Abort()
			return
		}
		ctx.Next()
	}
}
