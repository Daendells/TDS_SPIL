package repositories

import (
	"backend/internal/models/domain"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type ApolloTrainingCacheRepository interface {
	Get(seamanCode, coursesName string) (*domain.ApolloTrainingCache, error)
	Create(cache *domain.ApolloTrainingCache) error
	Update(cache *domain.ApolloTrainingCache) error
	DeleteExpired() error
	InvalidateForSeamanCode(seamanCode string) error
}

type apolloTrainingCacheRepository struct {
	db  *gorm.DB
	log *logrus.Logger
}

func NewApolloTrainingCacheRepository(db *gorm.DB, log *logrus.Logger) ApolloTrainingCacheRepository {
	return &apolloTrainingCacheRepository{
		db:  db,
		log: log,
	}
}

func (r *apolloTrainingCacheRepository) Get(seamanCode, coursesName string) (*domain.ApolloTrainingCache, error) {
	var cache domain.ApolloTrainingCache
	err := r.db.Where("seaman_code = ? AND courses_name = ? AND expires_at > ?", 
		seamanCode, coursesName, time.Now()).
		First(&cache).Error
	
	if err == gorm.ErrRecordNotFound {
		return nil, nil
	}
	return &cache, err
}

func (r *apolloTrainingCacheRepository) Create(cache *domain.ApolloTrainingCache) error {
	return r.db.Create(cache).Error
}

func (r *apolloTrainingCacheRepository) Update(cache *domain.ApolloTrainingCache) error {
	return r.db.Save(cache).Error
}

func (r *apolloTrainingCacheRepository) DeleteExpired() error {
	return r.db.Where("expires_at <= ?", time.Now()).
		Delete(&domain.ApolloTrainingCache{}).Error
}

func (r *apolloTrainingCacheRepository) InvalidateForSeamanCode(seamanCode string) error {
	return r.db.Where("seaman_code = ?", seamanCode).
		Delete(&domain.ApolloTrainingCache{}).Error
}
