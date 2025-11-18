package repositories

import (
	"backend/internal/models/domain"

	"gorm.io/gorm"
)

type CompetencyTypeRepository interface {
	GetAll() ([]domain.CompetencyType, error)
	GetByID(id int) (*domain.CompetencyType, error)
	GetByCode(code string) (*domain.CompetencyType, error)
	GetActive() ([]domain.CompetencyType, error)
	Create(competencyType *domain.CompetencyType) error
	Update(competencyType *domain.CompetencyType) error
	Delete(id int) error
}

type competencyTypeRepository struct {
	db *gorm.DB
}

func NewCompetencyTypeRepository(db *gorm.DB) CompetencyTypeRepository {
	return &competencyTypeRepository{
		db: db,
	}
}

func (r *competencyTypeRepository) GetAll() ([]domain.CompetencyType, error) {
	var competencyTypes []domain.CompetencyType
	err := r.db.Find(&competencyTypes).Error
	return competencyTypes, err
}

func (r *competencyTypeRepository) GetByID(id int) (*domain.CompetencyType, error) {
	var competencyType domain.CompetencyType
	err := r.db.First(&competencyType, id).Error
	if err != nil {
		return nil, err
	}
	return &competencyType, nil
}

func (r *competencyTypeRepository) GetByCode(code string) (*domain.CompetencyType, error) {
	var competencyType domain.CompetencyType
	err := r.db.Where("code = ?", code).First(&competencyType).Error
	if err != nil {
		return nil, err
	}
	return &competencyType, nil
}

func (r *competencyTypeRepository) GetActive() ([]domain.CompetencyType, error) {
	var competencyTypes []domain.CompetencyType
	err := r.db.Where("is_active = ?", true).Order("code").Find(&competencyTypes).Error
	return competencyTypes, err
}

func (r *competencyTypeRepository) Create(competencyType *domain.CompetencyType) error {
	return r.db.Create(competencyType).Error
}

func (r *competencyTypeRepository) Update(competencyType *domain.CompetencyType) error {
	return r.db.Save(competencyType).Error
}

func (r *competencyTypeRepository) Delete(id int) error {
	return r.db.Delete(&domain.CompetencyType{}, id).Error
}
