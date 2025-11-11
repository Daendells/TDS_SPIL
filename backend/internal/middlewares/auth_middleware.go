package middlewares

import (
	"fmt"
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
)

func DeleteToken(ctx *gin.Context) {
	ctx.SetCookie(TOKEN_COOKIE, "delete", -1, "", "", false, true)
}

func AuthMiddleware(secret string) gin.HandlerFunc {
	fmt.Println("AuthMiddleware initialized with secret:", secret)
	return func(ctx *gin.Context) {
		fmt.Printf("[AUTH] Method: %s, Path: %s\n", ctx.Request.Method, ctx.Request.URL.Path)

		var tokenString string
		var err error

		// First try to get token from cookie
		tokenString, err = ctx.Cookie(TOKEN_COOKIE)
		fmt.Printf("[AUTH] Cookie attempt - Error: %v, Token: %s\n", err, tokenString)

		// If no cookie, try Authorization header
		if err != nil {
			authHeader := ctx.GetHeader("Authorization")
			fmt.Printf("[AUTH] Authorization header: '%s'\n", authHeader)

			if authHeader != "" && len(authHeader) > 7 && authHeader[:7] == "Bearer " {
				tokenString = authHeader[7:] // Remove "Bearer " prefix
				fmt.Printf("[AUTH] Token extracted from header: %s\n", tokenString)
			} else {
				fmt.Printf("[AUTH] No valid authorization header found\n")
				ctx.JSON(http.StatusUnauthorized, web.ErrorResponse{
					Code:   http.StatusUnauthorized,
					Status: "Unauthorized",
					Error:  "Missing Token",
				})
				ctx.Abort()
				return
			}
		}

		fmt.Println("[AUTH] Final token to validate:", tokenString)

		// TODO: Decode and Validate it
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (any, error) {
			return []byte(secret), nil
		}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
		//! IF the signature is different
		if err != nil {
			//! Delete Token
			// DeleteToken(ctx)
			ctx.JSON(http.StatusUnauthorized, web.ErrorResponse{
				Code:   http.StatusUnauthorized,
				Status: "Unauthorized",
				Error:  "Signature Failed",
				// Error: err.Error(),
			})
			ctx.Abort()
			return
		}

		// TODO: Claim the JWT
		if claims, ok := token.Claims.(jwt.MapClaims); ok {
			fmt.Println(claims)
			// TODO: Check the expired time
			if float64(time.Now().Unix()) > claims["expired"].(float64) {
				//! Delete the Cookie
				DeleteToken(ctx)
				ctx.JSON(http.StatusUnauthorized, web.ErrorResponse{
					Code:   http.StatusUnauthorized,
					Status: "Unauthorized",
					Error:  "Token Expired",
				})
				ctx.Abort()
				return
			}

			// TODO: Find the user with Token Sub
			// var user domain.User
			fmt.Println(claims)

			// TODO: Set the User

			// TODO: Set the Token (for logout)
			ctx.Set(TOKEN_KEY, tokenString)

			// Continue
			ctx.Next()

		} else {
			ctx.JSON(http.StatusUnauthorized, web.ErrorResponse{
				Code:   http.StatusUnauthorized,
				Status: "Unauthorized",
				Error:  "Failed to Claim",
			})
			ctx.Abort()
			return
		}
		// fmt.Println(tokenString)
		// ctx.Next()
	}
}
