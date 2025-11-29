package services

import (
	"backend/internal/models/domain"
	"backend/internal/repositories"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

// ApolloTrainingRequest represents the request body for Apollo API
type ApolloTrainingRequest struct {
	SeamanCode  string `json:"seamancode"`
	Tanggal     string `json:"tanggal"` // Always "-"
	CoursesName string `json:"coursesname"`
}

// ApolloTrainingResponse represents the response from Apollo API
type ApolloTrainingResponse struct {
	Success      bool                 `json:"success"`
	Data         []interface{}        `json:"data"`
	Cached       bool                 `json:"cached"`
	Timestamp    string               `json:"timestamp"`
	OutputParams ApolloOutputParams   `json:"outputParams"`
}

type ApolloOutputParams struct {
	IntRecords string                  `json:"intrecords"`
	CsrResult  []ApolloTrainingRecord  `json:"csrresult"`
	StrMessage string                  `json:"strmessage"`
}

type ApolloTrainingRecord struct {
	SeamanCode    string `json:"SEAMANCODE"`
	SeamanName    string `json:"SEAMANNAME"`
	VesselCode    string `json:"VESSELCODE"`
	RankName      string `json:"RANKNAME"`
	CoursesName   string `json:"COURSESNAME"`
	StartDate     string `json:"START_DATE"`
	FinishDate    string `json:"FINISH_DATE"`
	PretestDate   string `json:"PRETEST_DATE"`
	PointPre      int    `json:"POINT_PRE"`
	PostDate      string `json:"POST_DATE"`
	PointPost     int    `json:"POINT_POST"`
	MinimumPoint  int    `json:"MINIMUMPOINT"`
	CoursesHours  int    `json:"COURSESHOURS"`
}

type ApolloAPIService struct {
	DB        *gorm.DB
	Log       *logrus.Logger
	CacheRepo repositories.ApolloTrainingCacheRepository
	BaseURL   string // Apollo API base URL
	UseDummy  bool   // Set to true to use dummy data instead of real API
}

func NewApolloAPIService(
	db *gorm.DB,
	log *logrus.Logger,
	cacheRepo repositories.ApolloTrainingCacheRepository,
	baseURL string,
) *ApolloAPIService {
	if baseURL == "" {
		baseURL = "http://apollo.spil.co.id:3773" // Default Apollo API URL
	}
	
	// TESTING MODE: Set UseDummy to true to use dummy data (for testing without WiFi kantor)
	// Set to false when testing with real Apollo API
	useDummy := false // Real API mode - connected to Apollo
	
	return &ApolloAPIService{
		DB:        db,
		Log:       log,
		CacheRepo: cacheRepo,
		BaseURL:   baseURL,
		UseDummy:  useDummy,
	}
}

// GetTrainingData fetches training data from Apollo API with caching
func (s *ApolloAPIService) GetTrainingData(seamanCode, coursesName string) (*ApolloTrainingResponse, error) {
	s.Log.Infof("Fetching training data for seaman: %s, course: %s", seamanCode, coursesName)

	// TESTING MODE: Use dummy data if enabled
	if s.UseDummy {
		s.Log.Warnf("⚠️ DUMMY MODE ENABLED - Using fake data for seaman: %s, course: %s", seamanCode, coursesName)
		return s.getDummyTrainingData(seamanCode, coursesName), nil
	}

	// Check cache first
	cache, err := s.CacheRepo.Get(seamanCode, coursesName)
	if err != nil {
		s.Log.Warnf("Error checking cache: %v", err)
	}

	if cache != nil && !cache.IsExpired() {
		s.Log.Infof("Cache hit for seaman: %s, course: %s", seamanCode, coursesName)
		var response ApolloTrainingResponse
		if err := json.Unmarshal([]byte(cache.ResponseData), &response); err != nil {
			s.Log.Errorf("Failed to unmarshal cached data: %v", err)
		} else {
			return &response, nil
		}
	}

	// Cache miss or expired, hit Apollo API
	s.Log.Infof("Cache miss for seaman: %s, course: %s, hitting Apollo API", seamanCode, coursesName)
	response, err := s.callApolloAPI(seamanCode, coursesName)
	if err != nil {
		return nil, err
	}

	// Cache the response for 24 hours
	responseJSON, _ := json.Marshal(response)
	newCache := &domain.ApolloTrainingCache{
		SeamanCode:   seamanCode,
		CoursesName:  coursesName,
		ResponseData: string(responseJSON),
		RecordCount:  len(response.OutputParams.CsrResult),
		ExpiresAt:    time.Now().Add(24 * time.Hour),
	}

	if cache != nil {
		// Update existing cache
		newCache.ID = cache.ID
		if err := s.CacheRepo.Update(newCache); err != nil {
			s.Log.Warnf("Failed to update cache: %v", err)
		}
	} else {
		// Create new cache entry
		if err := s.CacheRepo.Create(newCache); err != nil {
			s.Log.Warnf("Failed to create cache: %v", err)
		}
	}

	return response, nil
}

// callApolloAPI makes the actual HTTP request to Apollo API
func (s *ApolloAPIService) callApolloAPI(seamanCode, coursesName string) (*ApolloTrainingResponse, error) {
	url := fmt.Sprintf("%s/pe/get-datatraining", s.BaseURL)

	requestBody := ApolloTrainingRequest{
		SeamanCode:  seamanCode,
		Tanggal:     "-",
		CoursesName: coursesName,
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	s.Log.Infof("Calling Apollo API: %s with body: %s", url, string(jsonData))

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to call Apollo API: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Apollo API returned status %d: %s", resp.StatusCode, string(body))
	}

	var response ApolloTrainingResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	s.Log.Infof("Apollo API response: success=%v, records=%d", response.Success, len(response.OutputParams.CsrResult))

	return &response, nil
}

// GetTrainingCountForMonth returns the count of trainings completed by a seafarer for a specific course in a given month
func (s *ApolloAPIService) GetTrainingCountForMonth(seamanCode, coursesName string, month time.Time) (int, error) {
	response, err := s.GetTrainingData(seamanCode, coursesName)
	if err != nil {
		return 0, err
	}

	if !response.Success {
		return 0, fmt.Errorf("Apollo API returned unsuccessful response")
	}

	count := 0
	startOfMonth := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.Local)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	for _, record := range response.OutputParams.CsrResult {
		// Parse finish date (format: "DD/MM/YYYY")
		finishDate, err := time.Parse("02/01/2006", record.FinishDate)
		if err != nil {
			s.Log.Warnf("Failed to parse finish date '%s': %v", record.FinishDate, err)
			continue
		}

		// Check if finish date is within the month
		if (finishDate.Equal(startOfMonth) || finishDate.After(startOfMonth)) &&
			(finishDate.Equal(endOfMonth) || finishDate.Before(endOfMonth)) {
			count++
		}
	}

	return count, nil
}

// InvalidateCache removes cached data for a specific seaman code
func (s *ApolloAPIService) InvalidateCache(seamanCode string) error {
	return s.CacheRepo.InvalidateForSeamanCode(seamanCode)
}

// CleanExpiredCache removes all expired cache entries
func (s *ApolloAPIService) CleanExpiredCache() error {
	return s.CacheRepo.DeleteExpired()
}

// getDummyTrainingData returns dummy training data for testing without WiFi kantor
// This simulates the Apollo API response structure
func (s *ApolloAPIService) getDummyTrainingData(seamanCode, coursesName string) *ApolloTrainingResponse {
	// Generate dummy training records (simulating completed trainings in current month)
	currentMonth := time.Now()
	dummyRecords := []ApolloTrainingRecord{
		{
			SeamanCode:   seamanCode,
			SeamanName:   "DUMMY SEAFARER",
			VesselCode:   "MV-TEST-001",
			RankName:     "Chief Officer",
			CoursesName:  coursesName,
			StartDate:    currentMonth.AddDate(0, 0, -10).Format("02/01/2006"),
			FinishDate:   currentMonth.AddDate(0, 0, -8).Format("02/01/2006"),
			PretestDate:  currentMonth.AddDate(0, 0, -10).Format("02/01/2006"),
			PointPre:     75,
			PostDate:     currentMonth.AddDate(0, 0, -8).Format("02/01/2006"),
			PointPost:    85,
			MinimumPoint: 70,
			CoursesHours: 8,
		},
		{
			SeamanCode:   seamanCode,
			SeamanName:   "DUMMY SEAFARER",
			VesselCode:   "MV-TEST-001",
			RankName:     "Chief Officer",
			CoursesName:  coursesName,
			StartDate:    currentMonth.AddDate(0, 0, -5).Format("02/01/2006"),
			FinishDate:   currentMonth.AddDate(0, 0, -3).Format("02/01/2006"),
			PretestDate:  currentMonth.AddDate(0, 0, -5).Format("02/01/2006"),
			PointPre:     80,
			PostDate:     currentMonth.AddDate(0, 0, -3).Format("02/01/2006"),
			PointPost:    90,
			MinimumPoint: 70,
			CoursesHours: 8,
		},
	}

	response := &ApolloTrainingResponse{
		Success:   true,
		Data:      []interface{}{},
		Cached:    false,
		Timestamp: time.Now().Format("2006-01-02 15:04:05"),
		OutputParams: ApolloOutputParams{
			IntRecords: fmt.Sprintf("%d", len(dummyRecords)),
			CsrResult:  dummyRecords,
			StrMessage: "DUMMY DATA - Success",
		},
	}

	return response
}
