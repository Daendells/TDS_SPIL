package middlewares

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func generateTestToken(secret string, username string, role string, expiredAt time.Time) string {
	claims := jwt.MapClaims{
		"username": username,
		"role":     role,
		"expired":  float64(expiredAt.Unix()),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte(secret))
	return tokenStr
}

func TestAuthMiddleware_MissingToken(t *testing.T) {
	secret := "test-secret"
	router := gin.New()
	router.Use(AuthMiddleware(secret))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "Missing Token")
}

func TestAuthMiddleware_InvalidSignature(t *testing.T) {
	secret := "test-secret"
	wrongSecret := "wrong-secret"
	token := generateTestToken(wrongSecret, "user1", "viewer", time.Now().Add(time.Hour))

	router := gin.New()
	router.Use(AuthMiddleware(secret))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "Invalid or Expired Token Signature")
}

func TestAuthMiddleware_ExpiredToken(t *testing.T) {
	secret := "test-secret"
	token := generateTestToken(secret, "user1", "viewer", time.Now().Add(-time.Hour))

	router := gin.New()
	router.Use(AuthMiddleware(secret))
	router.GET("/protected", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	assert.Contains(t, w.Body.String(), "Token Expired")
}

func TestAuthMiddleware_ValidBearerToken(t *testing.T) {
	secret := "test-secret"
	token := generateTestToken(secret, "davin_admin", "admin", time.Now().Add(time.Hour))

	router := gin.New()
	router.Use(AuthMiddleware(secret))
	router.GET("/protected", func(c *gin.Context) {
		user, _ := c.Get(USER_KEY)
		role, _ := c.Get(ROLE_KEY)
		c.JSON(http.StatusOK, gin.H{"user": user, "role": role})
	})

	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), `"user":"davin_admin"`)
	assert.Contains(t, w.Body.String(), `"role":"admin"`)
}

func TestAuthMiddleware_ValidCookieToken(t *testing.T) {
	secret := "test-secret"
	token := generateTestToken(secret, "seafarer_viewer", "viewer", time.Now().Add(time.Hour))

	router := gin.New()
	router.Use(AuthMiddleware(secret))
	router.GET("/protected", func(c *gin.Context) {
		user, _ := c.Get(USER_KEY)
		role, _ := c.Get(ROLE_KEY)
		c.JSON(http.StatusOK, gin.H{"user": user, "role": role})
	})

	req, _ := http.NewRequest(http.MethodGet, "/protected", nil)
	req.AddCookie(&http.Cookie{
		Name:  TOKEN_COOKIE,
		Value: token,
	})
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), `"user":"seafarer_viewer"`)
	assert.Contains(t, w.Body.String(), `"role":"viewer"`)
}

func TestAdminOnly_SuccessForAdmin(t *testing.T) {
	secret := "test-secret"
	token := generateTestToken(secret, "admin", "admin", time.Now().Add(time.Hour))

	router := gin.New()
	router.Use(AuthMiddleware(secret), AdminOnly())
	router.POST("/admin-only-action", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest(http.MethodPost, "/admin-only-action", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Body.String(), "success")
}

func TestAdminOnly_ForbiddenForViewer(t *testing.T) {
	secret := "test-secret"
	token := generateTestToken(secret, "viewer_user", "viewer", time.Now().Add(time.Hour))

	router := gin.New()
	router.Use(AuthMiddleware(secret), AdminOnly())
	router.POST("/admin-only-action", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest(http.MethodPost, "/admin-only-action", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, w.Body.String(), "Akses ditolak: Fitur ini hanya dapat diakses oleh Admin")
}

func TestAdminOnly_NoRoleInContext(t *testing.T) {
	router := gin.New()
	router.Use(AdminOnly())
	router.POST("/admin-only-action", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	})

	req, _ := http.NewRequest(http.MethodPost, "/admin-only-action", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, w.Body.String(), "Akses ditolak: Fitur ini hanya dapat diakses oleh Admin")
}
