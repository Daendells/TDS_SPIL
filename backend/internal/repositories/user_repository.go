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

func (r *UserReporsitory) Create(db *gorm.DB, user *domain.User) error {
	return db.Create(user).Error
}

func (r *UserReporsitory) FindByID(db *gorm.DB, id int) (*domain.User, error) {
	var user domain.User
	err := db.Where("id = ?", id).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserReporsitory) FindBySSOID(db *gorm.DB, ssoID string) (*domain.User, error) {
	var user domain.User
	err := db.Where("sso_id = ?", ssoID).First(&user).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserReporsitory) FindAll(db *gorm.DB) ([]domain.User, error) {
	var users []domain.User
	err := db.Find(&users).Order("created_at DESC").Error
	return users, err
}

func (r *UserReporsitory) Update(db *gorm.DB, user *domain.User) error {
	return db.Model(&domain.User{}).Where("id = ?", user.ID).Updates(user).Error
}

func (r *UserReporsitory) Delete(db *gorm.DB, id int) error {
	return db.Where("id = ?", id).Delete(&domain.User{}).Error
}
