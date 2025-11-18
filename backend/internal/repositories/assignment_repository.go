package repositories

import (
	"backend/internal/models/domain"

	"gorm.io/gorm"
)

type AssignmentRepository interface {
	FindAllPaged(db *gorm.DB, search string, status string) ([]map[string]interface{}, error)
	FindAll(db *gorm.DB) ([]domain.SeafarerAssessment, error)
	FindByID(db *gorm.DB, id uint64) (domain.SeafarerAssessment, error)
	Create(db *gorm.DB, data *domain.SeafarerAssessment) error
	Update(db *gorm.DB, data *domain.SeafarerAssessment) error
	Delete(db *gorm.DB, id uint64) error
	Exists(db *gorm.DB, seafarerCode string, assessmentTypeID uint64) (bool, error)
	FindJoined(db *gorm.DB) ([]map[string]interface{}, error) // ← untuk list dengan nama
}

type assignmentRepositoryImpl struct{}

func NewAssignmentRepository() AssignmentRepository { return &assignmentRepositoryImpl{} }

func (r *assignmentRepositoryImpl) FindAll(db *gorm.DB) ([]domain.SeafarerAssessment, error) {
	var list []domain.SeafarerAssessment
	return list, db.Find(&list).Error
}

func (r *assignmentRepositoryImpl) FindByID(db *gorm.DB, id uint64) (domain.SeafarerAssessment, error) {
	var data domain.SeafarerAssessment
	return data, db.Where("id = ?", id).First(&data).Error
}

func (r *assignmentRepositoryImpl) Create(db *gorm.DB, data *domain.SeafarerAssessment) error {
	return db.Create(data).Error
}

func (r *assignmentRepositoryImpl) Update(db *gorm.DB, data *domain.SeafarerAssessment) error {
	return db.Save(data).Error
}

func (r *assignmentRepositoryImpl) Delete(db *gorm.DB, id uint64) error {
	return db.Delete(&domain.SeafarerAssessment{}, id).Error
}

func (r *assignmentRepositoryImpl) Exists(db *gorm.DB, seafarerCode string, assessmentTypeID uint64) (bool, error) {
	var count int64
	err := db.Table("seafarer_assessments").
		Where("seafarer_code = ? AND assessment_type_id = ?", seafarerCode, assessmentTypeID).
		Count(&count).Error
	return count > 0, err
}

// **PENTING**: join pakai seafarer_code; ambil assessment_type_name
func (r *assignmentRepositoryImpl) FindJoined(db *gorm.DB) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	err := db.Table("seafarer_assessments AS sa").
		Select(`
			sa.id,
			sa.seafarer_code,
			r.nama,
			at.assessment_type_name,
			at.id AS assessment_type_id,
			sa.status,
  CAST(sa.attempts_count AS UNSIGNED) AS attempts
		`).
		Joins("LEFT JOIN reports r ON sa.seafarer_code = r.seafarer_code").
		Joins("LEFT JOIN assessment_types at ON sa.assessment_type_id = at.id").
		Order("sa.id DESC").
		Scan(&results).Error
	return results, err
}

func (r *assignmentRepositoryImpl) FindAllPaged(db *gorm.DB, search string, status string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	query := db.Table("seafarer_assessments AS sa").
		Select(`
            sa.id,
            sa.seafarer_code,
            r.nama,
            at.assessment_type_name,
            at.id AS assessment_type_id,
            sa.status,
            CAST(sa.attempts_count AS UNSIGNED) AS attempts
        `).
		Joins("LEFT JOIN reports r ON sa.seafarer_code = r.seafarer_code").
		Joins("LEFT JOIN assessment_types at ON sa.assessment_type_id = at.id")

	if search != "" {
		like := "%" + search + "%"
		query = query.Where(`r.nama LIKE ? OR sa.seafarer_code LIKE ? OR at.assessment_type_name LIKE ?`, like, like, like)
	}

	if status != "" {
		query = query.Where("sa.status = ?", status)
	}

	err := query.Order("sa.id DESC").Scan(&results).Error
	return results, err
}
