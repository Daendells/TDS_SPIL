package domain

import "time"

// ApolloTrainingCache stores cached responses from Apollo API to avoid redundant API calls
// Cache is keyed by seamanCode + coursesName combination
type ApolloTrainingCache struct {
	ID          int64     `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	SeamanCode  string    `json:"seamanCode" gorm:"column:seaman_code;size:50;not null;index:idx_seaman_course"`
	CoursesName string    `json:"coursesName" gorm:"column:courses_name;size:255;not null;index:idx_seaman_course"`
	ResponseData string   `json:"responseData" gorm:"column:response_data;type:json"` // Store JSON response
	RecordCount int       `json:"recordCount" gorm:"column:record_count;not null;default:0"` // Number of records in response
	
	CreatedAt time.Time `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
	ExpiresAt time.Time `json:"expiresAt" gorm:"column:expires_at;not null;index"` // Cache expiration time
}

func (ApolloTrainingCache) TableName() string {
	return "apollo_training_cache"
}

// IsExpired checks if the cache entry has expired
func (c *ApolloTrainingCache) IsExpired() bool {
	return time.Now().After(c.ExpiresAt)
}
