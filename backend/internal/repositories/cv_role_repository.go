package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type CVRoleRepository struct {
	Repository[domain.CVRole]
	Log *logrus.Logger
}

func NewCVRoleRepository(log *logrus.Logger) *CVRoleRepository {
	return &CVRoleRepository{
		Log: log,
	}
}

func (r *CVRoleRepository) FindAll(db *gorm.DB) ([]domain.CVRole, error) {
	var roles []domain.CVRole
	err := db.Order("category ASC, name ASC").Find(&roles).Error
	return roles, err
}

func (r *CVRoleRepository) FindByID(db *gorm.DB, id int) (*domain.CVRole, error) {
	var role domain.CVRole
	err := db.Where("id = ?", id).First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *CVRoleRepository) FindByName(db *gorm.DB, name string) (*domain.CVRole, error) {
	var role domain.CVRole
	err := db.Where("name = ?", name).First(&role).Error
	if err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *CVRoleRepository) Create(db *gorm.DB, role *domain.CVRole) error {
	return db.Create(role).Error
}

func (r *CVRoleRepository) Update(db *gorm.DB, role *domain.CVRole) error {
	return db.Model(&domain.CVRole{}).Where("id = ?", role.ID).Updates(map[string]interface{}{
		"name":        role.Name,
		"description": role.Description,
		"category":    role.Category,
	}).Error
}

func (r *CVRoleRepository) Delete(db *gorm.DB, id int) error {
	return db.Where("id = ?", id).Delete(&domain.CVRole{}).Error
}
