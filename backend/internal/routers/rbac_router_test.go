package routers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"backend/internal/middlewares"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
)

func init() {
	gin.SetMode(gin.TestMode)
}

func createTestToken(secret, username, role string) string {
	claims := jwt.MapClaims{
		"username": username,
		"role":     role,
		"expired":  float64(time.Now().Add(time.Hour).Unix()),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte(secret))
	return tokenStr
}

func setupTestRBACRouter(secret string) *gin.Engine {
	app := gin.New()
	authMiddleware := middlewares.AuthMiddleware(secret)

	// 1. Health check & Public Routes
	app.GET("/health", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "ok"}) })
	app.POST("/assessment-results/submit", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "submitted"}) })

	// 2. Read-only routes for viewers & admin
	app.GET("/reports", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"data": []string{}}) })
	app.GET("/trainings", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"data": []string{}}) })
	app.GET("/api/training-plan", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"data": []string{}}) })
	app.GET("/api/competency-mappings", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"data": []string{}}) })
	app.GET("/mentoring-reports", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"data": []string{}}) })
	app.GET("/coaching-reports", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"data": []string{}}) })
	app.GET("/api/master-reports", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"data": []string{}}) })
	app.GET("/api/batches", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"data": []string{}}) })
	app.GET("/api/cv-roles", func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"data": []string{}}) })

	// 3. Admin-Only mutating routes
	adminRoutes := []struct {
		method string
		path   string
	}{
		{http.MethodPost, "/api/users"},
		{http.MethodPost, "/reports/upload"},
		{http.MethodPost, "/trainings"},
		{http.MethodPut, "/trainings/1"},
		{http.MethodDelete, "/trainings/1"},
		{http.MethodPost, "/api/training-plan/generate-schedules"},
		{http.MethodPut, "/api/training-plan/swap-schedules"},
		{http.MethodPost, "/api/competency-mappings"},
		{http.MethodPut, "/api/competency-mappings/1"},
		{http.MethodDelete, "/api/competency-mappings/1"},
		{http.MethodPost, "/mentoring-reports"},
		{http.MethodPost, "/coaching-reports"},
		{http.MethodPost, "/api/assessments"},
		{http.MethodDelete, "/api/assessments/1"},
		{http.MethodPost, "/api/assessment-types"},
		{http.MethodPost, "/api/questions"},
		{http.MethodDelete, "/api/questions/1"},
		{http.MethodPost, "/api/options"},
		{http.MethodPost, "/api/aspects"},
		{http.MethodPost, "/api/master-reports"},
		{http.MethodPut, "/api/master-reports/1"},
		{http.MethodDelete, "/api/master-reports/1"},
		{http.MethodPost, "/api/assignments"},
		{http.MethodPost, "/api/batches"},
		{http.MethodPut, "/api/scoring-config/1"},
		{http.MethodPost, "/api/cv-roles"},
		{http.MethodPut, "/api/cv-roles/1"},
		{http.MethodDelete, "/api/cv-roles/1"},
	}

	adminGroup := app.Group("").Use(authMiddleware, middlewares.AdminOnly())
	for _, r := range adminRoutes {
		route := r
		switch route.method {
		case http.MethodPost:
			adminGroup.POST(route.path, func(c *gin.Context) { c.JSON(http.StatusCreated, gin.H{"status": "created"}) })
		case http.MethodPut:
			adminGroup.PUT(route.path, func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "updated"}) })
		case http.MethodDelete:
			adminGroup.DELETE(route.path, func(c *gin.Context) { c.JSON(http.StatusOK, gin.H{"status": "deleted"}) })
		}
	}

	return app
}

func TestRBAC_PublicAndReadOnlyRoutes(t *testing.T) {
	secret := "secret-test"
	app := setupTestRBACRouter(secret)

	// Public health check
	req, _ := http.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	app.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)

	// Read-only endpoint without auth
	req, _ = http.NewRequest(http.MethodGet, "/reports", nil)
	w = httptest.NewRecorder()
	app.ServeHTTP(w, req)
	assert.Equal(t, http.StatusOK, w.Code)
}

func TestRBAC_AllMutatingRoutes_ForbiddenForViewer(t *testing.T) {
	secret := "secret-test"
	app := setupTestRBACRouter(secret)
	viewerToken := createTestToken(secret, "viewer_user", "viewer")

	mutatingEndpoints := []struct {
		method string
		path   string
	}{
		{http.MethodPost, "/api/users"},
		{http.MethodPost, "/reports/upload"},
		{http.MethodPost, "/trainings"},
		{http.MethodPut, "/trainings/1"},
		{http.MethodDelete, "/trainings/1"},
		{http.MethodPost, "/api/training-plan/generate-schedules"},
		{http.MethodPut, "/api/training-plan/swap-schedules"},
		{http.MethodPost, "/api/competency-mappings"},
		{http.MethodPut, "/api/competency-mappings/1"},
		{http.MethodDelete, "/api/competency-mappings/1"},
		{http.MethodPost, "/mentoring-reports"},
		{http.MethodPost, "/coaching-reports"},
		{http.MethodPost, "/api/assessments"},
		{http.MethodDelete, "/api/assessments/1"},
		{http.MethodPost, "/api/assessment-types"},
		{http.MethodPost, "/api/questions"},
		{http.MethodDelete, "/api/questions/1"},
		{http.MethodPost, "/api/options"},
		{http.MethodPost, "/api/aspects"},
		{http.MethodPost, "/api/master-reports"},
		{http.MethodPut, "/api/master-reports/1"},
		{http.MethodDelete, "/api/master-reports/1"},
		{http.MethodPost, "/api/assignments"},
		{http.MethodPost, "/api/batches"},
		{http.MethodPut, "/api/scoring-config/1"},
		{http.MethodPost, "/api/cv-roles"},
		{http.MethodPut, "/api/cv-roles/1"},
		{http.MethodDelete, "/api/cv-roles/1"},
	}

	for _, ep := range mutatingEndpoints {
		t.Run("Viewer_Forbidden_"+ep.method+"_"+strings.ReplaceAll(ep.path, "/", "_"), func(t *testing.T) {
			req, _ := http.NewRequest(ep.method, ep.path, nil)
			req.Header.Set("Authorization", "Bearer "+viewerToken)
			w := httptest.NewRecorder()
			app.ServeHTTP(w, req)

			assert.Equal(t, http.StatusForbidden, w.Code, "Expected 403 Forbidden for viewer on %s %s", ep.method, ep.path)
			assert.Contains(t, w.Body.String(), "Akses ditolak: Fitur ini hanya dapat diakses oleh Admin")
		})
	}
}

func TestRBAC_AllMutatingRoutes_AllowedForAdmin(t *testing.T) {
	secret := "secret-test"
	app := setupTestRBACRouter(secret)
	adminToken := createTestToken(secret, "admin", "admin")

	mutatingEndpoints := []struct {
		method string
		path   string
	}{
		{http.MethodPost, "/api/users"},
		{http.MethodPost, "/reports/upload"},
		{http.MethodPost, "/trainings"},
		{http.MethodPut, "/trainings/1"},
		{http.MethodDelete, "/trainings/1"},
		{http.MethodPost, "/api/training-plan/generate-schedules"},
		{http.MethodPut, "/api/training-plan/swap-schedules"},
		{http.MethodPost, "/api/competency-mappings"},
		{http.MethodPut, "/api/competency-mappings/1"},
		{http.MethodDelete, "/api/competency-mappings/1"},
		{http.MethodPost, "/mentoring-reports"},
		{http.MethodPost, "/coaching-reports"},
		{http.MethodPost, "/api/assessments"},
		{http.MethodDelete, "/api/assessments/1"},
		{http.MethodPost, "/api/assessment-types"},
		{http.MethodPost, "/api/questions"},
		{http.MethodDelete, "/api/questions/1"},
		{http.MethodPost, "/api/options"},
		{http.MethodPost, "/api/aspects"},
		{http.MethodPost, "/api/master-reports"},
		{http.MethodPut, "/api/master-reports/1"},
		{http.MethodDelete, "/api/master-reports/1"},
		{http.MethodPost, "/api/assignments"},
		{http.MethodPost, "/api/batches"},
		{http.MethodPut, "/api/scoring-config/1"},
		{http.MethodPost, "/api/cv-roles"},
		{http.MethodPut, "/api/cv-roles/1"},
		{http.MethodDelete, "/api/cv-roles/1"},
	}

	for _, ep := range mutatingEndpoints {
		t.Run("Admin_Allowed_"+ep.method+"_"+strings.ReplaceAll(ep.path, "/", "_"), func(t *testing.T) {
			req, _ := http.NewRequest(ep.method, ep.path, nil)
			req.Header.Set("Authorization", "Bearer "+adminToken)
			w := httptest.NewRecorder()
			app.ServeHTTP(w, req)

			assert.NotEqual(t, http.StatusForbidden, w.Code, "Admin must NOT receive 403 Forbidden on %s %s", ep.method, ep.path)
			assert.NotEqual(t, http.StatusUnauthorized, w.Code, "Admin must NOT receive 401 Unauthorized on %s %s", ep.method, ep.path)
		})
	}
}
