package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type MasterRepository struct {
	Log *logrus.Logger
}

func NewMasterRepository(log *logrus.Logger) *MasterRepository {
	return &MasterRepository{Log: log}
}

// Get all master reports
func (r *MasterRepository) FindAll(db *gorm.DB, masters *[]domain.MasterReport) error {
	return db.Find(masters).Error
}

// Get one by ID
func (r *MasterRepository) FindById(db *gorm.DB, master *domain.FullReport, id uint) error {
	return db.First(master, id).Error
}

// Create new master report
func (r *MasterRepository) Create(db *gorm.DB, master *domain.FullReport) error {
	return db.Create(master).Error
}

// Update existing master report
func (r *MasterRepository) Update(db *gorm.DB, report *domain.FullReport) error {
	if err := db.Save(report).Error; err != nil {
		r.Log.WithError(err).Warn("failed to update master report")
		return err
	}
	return nil
}

// Delete master report
func (r *MasterRepository) Delete(db *gorm.DB, master *domain.FullReport) error {
	return db.Delete(master).Error
}
