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
	err := r.db.Preload("CompetencyType").Preload("TrainingMaterial1").Preload("TrainingMaterial2").Find(&mappings).Error
	return mappings, err
}

func (r *competencyProgramMappingRepository) GetByProgram(program string) ([]domain.CompetencyProgramMapping, error) {
	var mappings []domain.CompetencyProgramMapping
	err := r.db.Preload("CompetencyType").Preload("TrainingMaterial1").Preload("TrainingMaterial2").Where("program = ?", program).Find(&mappings).Error
	return mappings, err
}

func (r *competencyProgramMappingRepository) GetByCompetencyCodeAndProgram(competencyCode, program string) (*domain.CompetencyProgramMapping, error) {
	var mapping domain.CompetencyProgramMapping
	// Join with competency_types to filter by code
	err := r.db.Preload("CompetencyType").Preload("TrainingMaterial1").Preload("TrainingMaterial2").
		Joins("JOIN competency_types ON competency_types.id = competency_program_mappings.competency_type_id").
		Where("competency_types.code = ? AND competency_program_mappings.program = ?", competencyCode, program).
		First(&mapping).Error
	if err != nil {
		return nil, err
	}
	return &mapping, nil
}

func (r *competencyProgramMappingRepository) Create(mapping *domain.CompetencyProgramMapping) error {
	return r.db.Create(mapping).Error
}

func (r *competencyProgramMappingRepository) Update(mapping *domain.CompetencyProgramMapping) error {
	// Use Updates instead of Save to avoid updating created_at
	// Also use Select to explicitly specify which fields to update
	return r.db.Model(&domain.CompetencyProgramMapping{}).
		Where("id = ?", mapping.ID).
		Updates(map[string]interface{}{
			"competency_type_id":      mapping.CompetencyTypeID,
			"program":                 mapping.Program,
			"training_material_1_id":  mapping.TrainingMaterial1ID,
			"training_material_2_id":  mapping.TrainingMaterial2ID,
			"category":                mapping.Category,
		}).Error
}

func (r *competencyProgramMappingRepository) Delete(id int) error {
	return r.db.Delete(&domain.CompetencyProgramMapping{}, id).Error
}
