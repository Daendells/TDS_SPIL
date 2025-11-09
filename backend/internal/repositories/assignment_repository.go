package repositories

import (
	"backend/internal/models/domain"
	"time"

	"gorm.io/gorm"
)

type AssignmentRepository struct{}

func NewAssignmentRepository() *AssignmentRepository { return &AssignmentRepository{} }

func (r *AssignmentRepository) Create(db *gorm.DB, ua *domain.UserAssessment) error {
	return db.Create(ua).Error
}

func (r *AssignmentRepository) GetLastAttempt(db *gorm.DB, userID int64, assessmentID uint64) (int, error) {
	var last domain.UserAssessment
	err := db.Where("user_id = ? AND assessment_id = ?", userID, assessmentID).
		Order("attempt DESC").
		First(&last).Error
	if err == gorm.ErrRecordNotFound {
		return 0, nil
	}
	return last.Attempt, err
}

func (r *AssignmentRepository) ExistsOverlappingAssignment(
	db *gorm.DB,
	userID int64,
	assessmentID uint64,
	startDate, endDate time.Time,
) (bool, error) {
	var count int64
	err := db.
		Model(&domain.UserAssessment{}).
		Where("user_id = ? AND assessment_id = ?", userID, assessmentID).
		Where(`
            (start_date <= ? AND end_date >= ?) OR
            (start_date <= ? AND end_date >= ?) OR
            (? <= start_date AND ? >= end_date)
        `,
			startDate, startDate,
			endDate, endDate,
			startDate, endDate,
		).
		Count(&count).Error
	return count > 0, err
}

func (r *AssignmentRepository) Update(db *gorm.DB, ua *domain.UserAssessment) error {
	return db.Save(ua).Error
}

func (r *AssignmentRepository) Delete(db *gorm.DB, id uint64) error {
	return db.Delete(&domain.UserAssessment{}, id).Error
}

//
// ===================== Core Query Methods =====================
//

// ✅ Load assignments for a specific user, preloading user (FullReport) + assessment
func (r *AssignmentRepository) FindByUserID(db *gorm.DB, userID int64) ([]domain.UserAssessment, error) {
	var assignments []domain.UserAssessment

	err := db.
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "nama", "seaman_code")
		}).
		Preload("Assessment").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&assignments).Error

	if err != nil {
		return nil, err
	}
	return assignments, nil
}

// ✅ Find by ID with preloaded User and Assessment
func (r *AssignmentRepository) FindByID(db *gorm.DB, id uint64) (*domain.UserAssessment, error) {
	var assignment domain.UserAssessment

	err := db.
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "nama", "seaman_code")
		}).
		Preload("Assessment").
		First(&assignment, id).Error

	if err != nil {
		return nil, err
	}
	return &assignment, nil
}

// ✅ If you only want partial fields (id + nama) for smaller payloads
func (r *AssignmentRepository) FindByUserIDWithFields(db *gorm.DB, userID int64) ([]domain.UserAssessment, error) {
	var assignments []domain.UserAssessment

	err := db.
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "nama", "seaman_code")
		}).
		Preload("Assessment", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "name")
		}).
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&assignments).Error

	if err != nil {
		return nil, err
	}
	return assignments, nil
}

// ✅ Fetch limited number of assignments (dashboard view, etc.)
func (r *AssignmentRepository) FindWithLimit(db *gorm.DB, limit int) ([]domain.UserAssessment, error) {
	var assignments []domain.UserAssessment

	err := db.
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "nama", "seaman_code")
		}).
		Preload("Assessment").
		Order("created_at DESC").
		Limit(limit).
		Find(&assignments).Error

	if err != nil {
		return nil, err
	}
	return assignments, nil
}

// ✅ Fetch all assignments (for admin or full list)
func (r *AssignmentRepository) FindAll(db *gorm.DB, limit int) ([]domain.UserAssessment, error) {
	var assignments []domain.UserAssessment

	err := db.
		Preload("User", func(db *gorm.DB) *gorm.DB {
			return db.Select("id", "nama", "seaman_code")
		}).
		Preload("Assessment").
		Order("created_at DESC").
		Limit(limit).
		Find(&assignments).Error

	if err != nil {
		return nil, err
	}
	return assignments, nil
}
