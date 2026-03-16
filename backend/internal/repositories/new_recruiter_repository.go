package repositories

import (
	"backend/internal/models/domain"
	"strings"

	"gorm.io/gorm"
)

type NewRecruiterRepository interface {
	FindAll(db *gorm.DB) ([]domain.NewRecruiter, error)
	FindPage(db *gorm.DB, query string, batchID *uint64, anchorID *uint64, page string, pageSize int) ([]domain.NewRecruiter, error)
	Count(db *gorm.DB, query string, batchID *uint64) (int64, error)
	Search(db *gorm.DB, query string, batchID *uint64, cursorID *uint64, pageSize int) ([]domain.NewRecruiter, error)
	FindByID(db *gorm.DB, id uint64) (domain.NewRecruiter, error)
	Create(db *gorm.DB, data *domain.NewRecruiter) error
	Update(db *gorm.DB, data *domain.NewRecruiter) error
	BulkAssignBatch(db *gorm.DB, recruiterIDs []uint64, batchID *uint64) error
	Delete(db *gorm.DB, id uint64) error
	FindAssignments(db *gorm.DB) ([]domain.NewRecruiterAssignment, error)
	FindAssignmentsPage(db *gorm.DB, query string, batchID *uint64, anchorID *uint64, page string, pageSize int) ([]domain.NewRecruiterAssignment, error)
	CountAssignments(db *gorm.DB, query string, batchID *uint64) (int64, error)
	FindAssignmentByID(db *gorm.DB, id uint64) (domain.NewRecruiterAssignment, error)
	FindAssignmentByToken(db *gorm.DB, token string) (domain.NewRecruiterAssignment, error)
	FindAssignmentByRecruiterAndAssessment(db *gorm.DB, recruiterID uint64, assessmentTypeID uint64) (domain.NewRecruiterAssignment, error)
	CreateAssignment(db *gorm.DB, data *domain.NewRecruiterAssignment) error
	UpdateAssignment(db *gorm.DB, data *domain.NewRecruiterAssignment) error
	DeleteAssignment(db *gorm.DB, id uint64) error
	CreateAssessmentSubmission(db *gorm.DB, data *domain.NewRecruiterAssessmentSubmission) error
	CreateQuizAttempt(db *gorm.DB, data *domain.NewRecruiterQuizAttempt) error
}

type newRecruiterRepositoryImpl struct{}

func NewNewRecruiterRepository() NewRecruiterRepository {
	return &newRecruiterRepositoryImpl{}
}

func (r *newRecruiterRepositoryImpl) FindAll(db *gorm.DB) ([]domain.NewRecruiter, error) {
	var results []domain.NewRecruiter
	err := db.Preload("Batch").Order("id desc").Find(&results).Error
	return results, err
}

func (r *newRecruiterRepositoryImpl) FindPage(
	db *gorm.DB,
	query string,
	batchID *uint64,
	anchorID *uint64,
	page string,
	pageSize int,
) ([]domain.NewRecruiter, error) {
	var results []domain.NewRecruiter

	if pageSize <= 0 {
		pageSize = 10
	}

	tx := db.Preload("Batch")
	tx = applyNewRecruiterFilters(tx, query, batchID)

	if anchorID != nil && *anchorID > 0 {
		if page == "prev" {
			tx = tx.Where("id > ?", *anchorID).Order("id asc")
		} else {
			tx = tx.Where("id < ?", *anchorID).Order("id desc")
		}
	} else {
		tx = tx.Order("id desc")
	}

	if err := tx.Limit(pageSize + 1).Find(&results).Error; err != nil {
		return nil, err
	}

	if page == "prev" {
		for i, j := 0, len(results)-1; i < j; i, j = i+1, j-1 {
			results[i], results[j] = results[j], results[i]
		}
	}

	return results, nil
}

func (r *newRecruiterRepositoryImpl) Count(db *gorm.DB, query string, batchID *uint64) (int64, error) {
	var total int64
	tx := applyNewRecruiterFilters(db.Model(&domain.NewRecruiter{}), query, batchID)
	err := tx.Count(&total).Error
	return total, err
}

func (r *newRecruiterRepositoryImpl) Search(
	db *gorm.DB,
	query string,
	batchID *uint64,
	cursorID *uint64,
	pageSize int,
) ([]domain.NewRecruiter, error) {
	var results []domain.NewRecruiter

	if pageSize <= 0 {
		pageSize = 20
	}

	tx := db.Preload("Batch").Order("id desc")

	if batchID != nil {
		tx = tx.Where("batch_id = ?", *batchID)
	}

	if cursorID != nil && *cursorID > 0 {
		tx = tx.Where("id < ?", *cursorID)
	}

	if trimmed := strings.TrimSpace(query); trimmed != "" {
		likeQuery := "%" + trimmed + "%"
		tx = tx.Where(
			"nama LIKE ? OR seafarer_code LIKE ? OR rank LIKE ? OR academy_name LIKE ?",
			likeQuery,
			likeQuery,
			likeQuery,
			likeQuery,
		)
	}

	err := tx.Limit(pageSize + 1).Find(&results).Error
	return results, err
}

func (r *newRecruiterRepositoryImpl) FindByID(db *gorm.DB, id uint64) (domain.NewRecruiter, error) {
	var result domain.NewRecruiter
	err := db.Preload("Batch").Where("id = ?", id).First(&result).Error
	return result, err
}

func (r *newRecruiterRepositoryImpl) Create(db *gorm.DB, data *domain.NewRecruiter) error {
	return db.Create(data).Error
}

func (r *newRecruiterRepositoryImpl) Update(db *gorm.DB, data *domain.NewRecruiter) error {
	return db.Save(data).Error
}

func (r *newRecruiterRepositoryImpl) BulkAssignBatch(db *gorm.DB, recruiterIDs []uint64, batchID *uint64) error {
	return db.Model(&domain.NewRecruiter{}).
		Where("id IN ?", recruiterIDs).
		Update("batch_id", batchID).Error
}

func (r *newRecruiterRepositoryImpl) Delete(db *gorm.DB, id uint64) error {
	return db.Delete(&domain.NewRecruiter{}, id).Error
}

func (r *newRecruiterRepositoryImpl) FindAssignments(db *gorm.DB) ([]domain.NewRecruiterAssignment, error) {
	var results []domain.NewRecruiterAssignment
	err := db.Preload("NewRecruiter").Preload("AssessmentType").Preload("Batch").Order("id desc").Find(&results).Error
	return results, err
}

func (r *newRecruiterRepositoryImpl) FindAssignmentsPage(
	db *gorm.DB,
	query string,
	batchID *uint64,
	anchorID *uint64,
	page string,
	pageSize int,
) ([]domain.NewRecruiterAssignment, error) {
	var results []domain.NewRecruiterAssignment

	if pageSize <= 0 {
		pageSize = 10
	}

	tx := db.Model(&domain.NewRecruiterAssignment{}).
		Preload("NewRecruiter").
		Preload("AssessmentType").
		Preload("Batch").
		Joins("LEFT JOIN new_recruiters ON new_recruiters.id = new_recruiter_assignments.new_recruiter_id").
		Joins("LEFT JOIN assessment_types ON assessment_types.id = new_recruiter_assignments.assessment_type_id")

	tx = applyNewRecruiterAssignmentFilters(tx, query, batchID)

	if anchorID != nil && *anchorID > 0 {
		if page == "prev" {
			tx = tx.Where("new_recruiter_assignments.id > ?", *anchorID).Order("new_recruiter_assignments.id asc")
		} else {
			tx = tx.Where("new_recruiter_assignments.id < ?", *anchorID).Order("new_recruiter_assignments.id desc")
		}
	} else {
		tx = tx.Order("new_recruiter_assignments.id desc")
	}

	if err := tx.Limit(pageSize + 1).Find(&results).Error; err != nil {
		return nil, err
	}

	if page == "prev" {
		for i, j := 0, len(results)-1; i < j; i, j = i+1, j-1 {
			results[i], results[j] = results[j], results[i]
		}
	}

	return results, nil
}

func (r *newRecruiterRepositoryImpl) CountAssignments(db *gorm.DB, query string, batchID *uint64) (int64, error) {
	var total int64
	tx := db.Model(&domain.NewRecruiterAssignment{}).
		Joins("LEFT JOIN new_recruiters ON new_recruiters.id = new_recruiter_assignments.new_recruiter_id").
		Joins("LEFT JOIN assessment_types ON assessment_types.id = new_recruiter_assignments.assessment_type_id")
	tx = applyNewRecruiterAssignmentFilters(tx, query, batchID)
	err := tx.Count(&total).Error
	return total, err
}

func (r *newRecruiterRepositoryImpl) FindAssignmentByID(db *gorm.DB, id uint64) (domain.NewRecruiterAssignment, error) {
	var result domain.NewRecruiterAssignment
	err := db.Preload("NewRecruiter").Preload("AssessmentType").Preload("Batch").Where("id = ?", id).First(&result).Error
	return result, err
}

func (r *newRecruiterRepositoryImpl) FindAssignmentByToken(db *gorm.DB, token string) (domain.NewRecruiterAssignment, error) {
	var result domain.NewRecruiterAssignment
	err := db.Preload("NewRecruiter").Preload("AssessmentType").Preload("Batch").Where("token = ?", token).First(&result).Error
	return result, err
}

func (r *newRecruiterRepositoryImpl) FindAssignmentByRecruiterAndAssessment(db *gorm.DB, recruiterID uint64, assessmentTypeID uint64) (domain.NewRecruiterAssignment, error) {
	var result domain.NewRecruiterAssignment
	err := db.Where("new_recruiter_id = ? AND assessment_type_id = ?", recruiterID, assessmentTypeID).First(&result).Error
	return result, err
}

func (r *newRecruiterRepositoryImpl) CreateAssignment(db *gorm.DB, data *domain.NewRecruiterAssignment) error {
	return db.Create(data).Error
}

func (r *newRecruiterRepositoryImpl) UpdateAssignment(db *gorm.DB, data *domain.NewRecruiterAssignment) error {
	return db.Save(data).Error
}

func (r *newRecruiterRepositoryImpl) DeleteAssignment(db *gorm.DB, id uint64) error {
	return db.Delete(&domain.NewRecruiterAssignment{}, id).Error
}

func (r *newRecruiterRepositoryImpl) CreateAssessmentSubmission(db *gorm.DB, data *domain.NewRecruiterAssessmentSubmission) error {
	return db.Create(data).Error
}

func (r *newRecruiterRepositoryImpl) CreateQuizAttempt(db *gorm.DB, data *domain.NewRecruiterQuizAttempt) error {
	return db.Create(data).Error
}

func applyNewRecruiterFilters(tx *gorm.DB, query string, batchID *uint64) *gorm.DB {
	if batchID != nil {
		tx = tx.Where("batch_id = ?", *batchID)
	}

	if trimmed := strings.TrimSpace(query); trimmed != "" {
		likeQuery := "%" + trimmed + "%"
		tx = tx.Where(
			"nama LIKE ? OR seafarer_code LIKE ? OR rank LIKE ? OR academy_name LIKE ?",
			likeQuery,
			likeQuery,
			likeQuery,
			likeQuery,
		)
	}

	return tx
}

func applyNewRecruiterAssignmentFilters(tx *gorm.DB, query string, batchID *uint64) *gorm.DB {
	if batchID != nil {
		tx = tx.Where("new_recruiter_assignments.batch_id = ?", *batchID)
	}

	if trimmed := strings.TrimSpace(query); trimmed != "" {
		likeQuery := "%" + trimmed + "%"
		tx = tx.Where(
			`new_recruiters.nama LIKE ? OR
			new_recruiters.seafarer_code LIKE ? OR
			new_recruiter_assignments.token LIKE ? OR
			new_recruiter_assignments.status LIKE ? OR
			assessment_types.assessment_type_name LIKE ?`,
			likeQuery,
			likeQuery,
			likeQuery,
			likeQuery,
			likeQuery,
		)
	}

	return tx
}
