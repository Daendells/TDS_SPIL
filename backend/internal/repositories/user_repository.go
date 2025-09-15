package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type UserReporsitory struct {
	Repository[domain.User]
	Log *logrus.Logger
}

func NewUserReposiotry(log *logrus.Logger) *UserReporsitory {
	return &UserReporsitory{
		Log: log,
	}
}

func (r *Repository[T]) FindByUsername(db *gorm.DB, entity *T, username string) error {
	return db.Where("username = ?", username).Take(entity).Error
}
