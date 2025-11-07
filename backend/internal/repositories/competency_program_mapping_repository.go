package repositories

import (
	"backend/internal/models/domain"
	"gorm.io/gorm"
)

type CompetencyProgramMappingRepository interface {
	GetAll() ([]domain.CompetencyProgramMapping, error)
	GetByProgram(program string) ([]domain.CompetencyProgramMapping, error)
	GetByCompetencyCodeAndProgram(competencyCode, program string) (*domain.CompetencyProgramMapping, error)
	Create(mapping *domain.CompetencyProgramMapping) error
	Update(mapping *domain.CompetencyProgramMapping) error
	Delete(id int) error
}

type competencyProgramMappingRepository struct {
	db *gorm.DB
}

func NewCompetencyProgramMappingRepository(db *gorm.DB) CompetencyProgramMappingRepository {
	return &competencyProgramMappingRepository{
		db: db,
	}
}

func (r *competencyProgramMappingRepository) GetAll() ([]domain.CompetencyProgramMapping, error) {
	var mappings []domain.CompetencyProgramMapping
	err := r.db.Find(&mappings).Error
	return mappings, err
}

func (r *competencyProgramMappingRepository) GetByProgram(program string) ([]domain.CompetencyProgramMapping, error) {
	var mappings []domain.CompetencyProgramMapping
	err := r.db.Where("program = ?", program).Find(&mappings).Error
	return mappings, err
}

func (r *competencyProgramMappingRepository) GetByCompetencyCodeAndProgram(competencyCode, program string) (*domain.CompetencyProgramMapping, error) {
	var mapping domain.CompetencyProgramMapping
	err := r.db.Where("competency_code = ? AND program = ?", competencyCode, program).First(&mapping).Error
	if err != nil {
		return nil, err
	}
	return &mapping, nil
}

func (r *competencyProgramMappingRepository) Create(mapping *domain.CompetencyProgramMapping) error {
	return r.db.Create(mapping).Error
}

func (r *competencyProgramMappingRepository) Update(mapping *domain.CompetencyProgramMapping) error {
	return r.db.Save(mapping).Error
}

func (r *competencyProgramMappingRepository) Delete(id int) error {
	return r.db.Delete(&domain.CompetencyProgramMapping{}, id).Error
}
