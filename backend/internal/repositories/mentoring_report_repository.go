package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type MentoringReportRepository struct {
	Repository[domain.MentoringReport]
	Log *logrus.Logger
}

func NewMentoringReportRepository(log *logrus.Logger) *MentoringReportRepository {
	return &MentoringReportRepository{
		Log: log,
	}
}

func (r *MentoringReportRepository) FindAll(db *gorm.DB, mentoringReports *[]domain.MentoringReport) error {
	return db.Find(mentoringReports).Error
}

func (r *MentoringReportRepository) FindByMenteeName(db *gorm.DB, mentoringReports *[]domain.MentoringReport, menteeName string) error {
	return db.Where("mentee_names LIKE ?", "%\""+menteeName+"\"%").Find(mentoringReports).Error
}

func (r *MentoringReportRepository) FindByMentorName(db *gorm.DB, mentoringReports *[]domain.MentoringReport, mentorName string) error {
	return db.Where("mentor_name = ?", mentorName).Find(mentoringReports).Error
}

func (r *MentoringReportRepository) FindByPeriod(db *gorm.DB, mentoringReports *[]domain.MentoringReport, period string) error {
	return db.Where("period = ?", period).Find(mentoringReports).Error
}

func (r *MentoringReportRepository) CountByMenteeName(db *gorm.DB, menteeName string) (int64, error) {
	var total int64
	err := db.Model(&domain.MentoringReport{}).Where("mentee_names LIKE ?", "%\""+menteeName+"\"%").Count(&total).Error
	return total, err
}

func (r *MentoringReportRepository) FindByReportID(db *gorm.DB, mentoringReports *[]domain.MentoringReport, reportID string) error {
	return db.Where("report_ids LIKE ? OR report_ids LIKE ? OR report_ids LIKE ? OR report_ids LIKE ?",
		"["+reportID+"]",
		"["+reportID+",%",
		"%,"+reportID+"]",
		"%,"+reportID+",%").Find(mentoringReports).Error
}
