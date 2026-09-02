package services

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"backend/internal/models/domain"
	"backend/internal/repositories"

	"github.com/sirupsen/logrus"
	"github.com/spf13/viper"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrSSONotConfigured = errors.New("sso is not configured")
	ErrInvalidState     = errors.New("invalid state parameter")
	ErrInvalidClientID  = errors.New("invalid client_id")
)

type SSOService struct {
	DB             *gorm.DB
	Config         *viper.Viper
	Log            *logrus.Logger
	UserRepository *repositories.UserReporsitory
	UserService    *UserService
	HTTPClient     *http.Client
}

type ssoOAuthTokenResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    struct {
		AccessToken string `json:"access_token"`
	} `json:"data"`
}

type ssoUserInfoResponse struct {
	Success bool            `json:"success"`
	Message string          `json:"message"`
	Data    json.RawMessage `json:"data"`
}

type ssoUserInfo struct {
	ID       string `json:"id"`
	Username string `json:"username"`
	Name     string `json:"name"`
	Role     string `json:"role"`
}

func NewSSOService(
	db *gorm.DB,
	config *viper.Viper,
	log *logrus.Logger,
	userRepository *repositories.UserReporsitory,
	userService *UserService,
) *SSOService {
	return &SSOService{
		DB:             db,
		Config:         config,
		Log:            log,
		UserRepository: userRepository,
		UserService:    userService,
		HTTPClient: &http.Client{
			Timeout: 20 * time.Second,
		},
	}
}

func (s *SSOService) IsConfigured() bool {
	return strings.TrimSpace(s.Config.GetString("SSO_BASE_URL")) != "" &&
		strings.TrimSpace(s.Config.GetString("SSO_FRONTEND_URL")) != "" &&
		strings.TrimSpace(s.Config.GetString("SSO_CLIENT_ID")) != "" &&
		strings.TrimSpace(s.Config.GetString("SSO_CLIENT_SECRET")) != "" &&
		strings.TrimSpace(s.Config.GetString("SSO_CALLBACK_URL")) != ""
}

func (s *SSOService) BuildInitiateRedirectURL(clientIDOverride string) (string, error) {
	if !s.IsConfigured() {
		return "", ErrSSONotConfigured
	}

	clientID, err := s.resolveClientID(clientIDOverride)
	if err != nil {
		return "", err
	}

	state, err := s.generateState()
	if err != nil {
		return "", err
	}

	redirectURI := strings.TrimSpace(s.Config.GetString("SSO_CALLBACK_URL"))
	ssoFrontendURL := strings.TrimRight(strings.TrimSpace(s.Config.GetString("SSO_FRONTEND_URL")), "/")

	params := url.Values{}
	params.Set("client_id", clientID)
	params.Set("redirect_uri", redirectURI)
	params.Set("response_type", "code")
	params.Set("state", state)

	return ssoFrontendURL + "/login?" + params.Encode(), nil
}

func (s *SSOService) HandleCallback(code, state string) (string, error) {
	if !s.IsConfigured() {
		return "", ErrSSONotConfigured
	}

	if code == "" {
		return "", errors.New("missing code")
	}

	if err := s.validateState(state); err != nil {
		return "", err
	}

	clientID := strings.TrimSpace(s.Config.GetString("SSO_CLIENT_ID"))
	clientSecret := strings.TrimSpace(s.Config.GetString("SSO_CLIENT_SECRET"))
	callbackURL := strings.TrimSpace(s.Config.GetString("SSO_CALLBACK_URL"))
	ssoBaseURL := strings.TrimRight(strings.TrimSpace(s.Config.GetString("SSO_BASE_URL")), "/")

	accessToken, err := s.exchangeAuthorizationCode(ssoBaseURL, clientID, clientSecret, callbackURL, code)
	if err != nil {
		return "", err
	}

	userInfo, err := s.fetchUserInfo(ssoBaseURL, accessToken)
	if err != nil {
		return "", err
	}

	localUser, err := s.findOrCreateUser(userInfo)
	if err != nil {
		return "", err
	}

	localToken, err := s.UserService.CreateAccessToken(localUser)
	if err != nil {
		return "", err
	}

	return localToken, nil
}

func (s *SSOService) BuildFrontendCallbackURL(localToken string) string {
	frontendURL := strings.TrimRight(strings.TrimSpace(s.Config.GetString("FRONTEND_URL")), "/")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	return frontendURL + "/auth/sso/callback?token=" + url.QueryEscape(localToken)
}

func (s *SSOService) BuildFrontendLoginErrorURL(msg string) string {
	frontendURL := strings.TrimRight(strings.TrimSpace(s.Config.GetString("FRONTEND_URL")), "/")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}
	return frontendURL + "/login?sso_error=" + url.QueryEscape(msg)
}

func (s *SSOService) resolveClientID(clientIDOverride string) (string, error) {
	defaultClientID := strings.TrimSpace(s.Config.GetString("SSO_CLIENT_ID"))
	override := strings.TrimSpace(clientIDOverride)
	if override == "" {
		return defaultClientID, nil
	}

	if override != defaultClientID {
		return "", ErrInvalidClientID
	}

	return override, nil
}

func (s *SSOService) generateState() (string, error) {
	ts := time.Now().UnixMilli()
	tsString := strconv.FormatInt(ts, 10)

	secret := strings.TrimSpace(s.Config.GetString("JWT_SECRET_KEY"))
	if secret == "" {
		return "", errors.New("missing JWT_SECRET_KEY for state signing")
	}

	mac := hmac.New(sha256.New, []byte(secret))
	if _, err := mac.Write([]byte(tsString)); err != nil {
		return "", err
	}

	signature := hex.EncodeToString(mac.Sum(nil))
	return tsString + "." + signature, nil
}

func (s *SSOService) validateState(state string) error {
	parts := strings.Split(state, ".")
	if len(parts) != 2 {
		return ErrInvalidState
	}

	tsString := parts[0]
	signatureHex := parts[1]
	if tsString == "" || signatureHex == "" {
		return ErrInvalidState
	}

	issuedAt, err := strconv.ParseInt(tsString, 10, 64)
	if err != nil {
		return ErrInvalidState
	}

	if time.Since(time.UnixMilli(issuedAt)) > 10*time.Minute {
		return ErrInvalidState
	}

	secret := strings.TrimSpace(s.Config.GetString("JWT_SECRET_KEY"))
	if secret == "" {
		return ErrInvalidState
	}

	mac := hmac.New(sha256.New, []byte(secret))
	if _, err := mac.Write([]byte(tsString)); err != nil {
		return ErrInvalidState
	}
	expected := mac.Sum(nil)

	received, err := hex.DecodeString(signatureHex)
	if err != nil {
		return ErrInvalidState
	}

	if !hmac.Equal(expected, received) {
		return ErrInvalidState
	}

	return nil
}

func (s *SSOService) exchangeAuthorizationCode(
	ssoBaseURL, clientID, clientSecret, callbackURL, code string,
) (string, error) {
	body := map[string]string{
		"grant_type":    "authorization_code",
		"code":          code,
		"redirect_uri":  callbackURL,
		"client_id":     clientID,
		"client_secret": clientSecret,
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest(http.MethodPost, ssoBaseURL+"/api/v1/oauth/token", strings.NewReader(string(payload)))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	res, err := s.HTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	rawBody, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return "", fmt.Errorf("oauth token exchange failed with status %d: %s", res.StatusCode, string(rawBody))
	}

	var tokenResponse ssoOAuthTokenResponse
	if err := json.Unmarshal(rawBody, &tokenResponse); err != nil {
		return "", err
	}

	if tokenResponse.Data.AccessToken == "" {
		return "", errors.New("missing access_token in oauth response")
	}

	return tokenResponse.Data.AccessToken, nil
}

func (s *SSOService) fetchUserInfo(ssoBaseURL, accessToken string) (*ssoUserInfo, error) {
	req, err := http.NewRequest(http.MethodGet, ssoBaseURL+"/api/v1/oauth/userinfo", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	res, err := s.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	rawBody, _ := io.ReadAll(res.Body)
	if res.StatusCode >= 400 {
		return nil, fmt.Errorf("oauth userinfo failed with status %d: %s", res.StatusCode, string(rawBody))
	}

	var userInfoResponse ssoUserInfoResponse
	if err := json.Unmarshal(rawBody, &userInfoResponse); err != nil {
		return nil, err
	}

	// Handle both data.user and data directly.
	var wrapped struct {
		User ssoUserInfo `json:"user"`
	}
	if err := json.Unmarshal(userInfoResponse.Data, &wrapped); err == nil && wrapped.User.Username != "" {
		return &wrapped.User, nil
	}

	var info ssoUserInfo
	if err := json.Unmarshal(userInfoResponse.Data, &info); err != nil {
		return nil, err
	}
	if info.ID == "" || info.Username == "" {
		return nil, errors.New("invalid user info payload")
	}

	return &info, nil
}

func (s *SSOService) findOrCreateUser(info *ssoUserInfo) (*domain.User, error) {
	userBySSO, err := s.UserRepository.FindBySSOID(s.DB, info.ID)
	if err == nil {
		return userBySSO, nil
	}

	var userByUsername domain.User
	if err := s.UserRepository.FindByUsername(s.DB, &userByUsername, info.Username); err == nil {
		userByUsername.SSOID = &info.ID
		if updateErr := s.DB.Model(&userByUsername).Update("sso_id", info.ID).Error; updateErr != nil {
			return nil, updateErr
		}
		return &userByUsername, nil
	}

	password, err := generateRandomPasswordHash()
	if err != nil {
		return nil, err
	}

	newUser := &domain.User{
		Username: info.Username,
		Password: password,
		Role:     "viewer",
		SSOID:    &info.ID,
	}

	if err := s.UserRepository.Create(s.DB, newUser); err != nil {
		// Fallback jika terjadi race condition / concurrent requests
		var existingUser domain.User
		if retryErr := s.UserRepository.FindByUsername(s.DB, &existingUser, info.Username); retryErr == nil {
			existingUser.SSOID = &info.ID
			_ = s.DB.Model(&existingUser).Update("sso_id", info.ID)
			return &existingUser, nil
		}
		return nil, err
	}

	return newUser, nil
}

func generateRandomPasswordHash() (string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(hex.EncodeToString(raw)), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashed), nil
}
