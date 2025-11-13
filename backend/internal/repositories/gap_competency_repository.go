package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type GapCompetencyRepository interface {
	GetAll() ([]domain.GapCompetency, error)
	GetByID(id int) (*domain.GapCompetency, error)
	GetByReportID(reportID int) ([]domain.GapCompetency, error)
	GetByReportIDAndProgram(reportID int, program string) ([]domain.GapCompetency, error)
	GetByProgram(program string) ([]domain.GapCompetency, error)
	GetByCompetencyTypeID(competencyTypeID int) ([]domain.GapCompetency, error)
	Create(gapCompetency *domain.GapCompetency) error
	Update(gapCompetency *domain.GapCompetency) error
	Delete(id int) error
	DeleteByReportIDAndCompetencyTypeID(reportID, competencyTypeID int) error
	GetWithReports(program string) ([]domain.GapCompetency, error)
	GetWithReportsAndCompetencyTypes(program string) ([]domain.GapCompetency, error)
	GetGapCountByReportID(reportID int) (int64, error)
	GetGapsByReportIDGrouped(reportID int) (map[string][]domain.GapCompetency, error)
}

type gapCompetencyRepository struct {
	db  *gorm.DB
	log *logrus.Logger
}

func NewGapCompetencyRepository(db *gorm.DB, log *logrus.Logger) GapCompetencyRepository {
	return &gapCompetencyRepository{
		db:  db,
		log: log,
	}
}

func (r *gapCompetencyRepository) GetAll() ([]domain.GapCompetency, error) {
	var gapCompetencies []domain.GapCompetency

	if err := r.db.Find(&gapCompetencies).Error; err != nil {
		r.log.WithError(err).Error("Failed to get all gap competencies")
		return nil, err
	}

	return gapCompetencies, nil
}

func (r *gapCompetencyRepository) GetByID(id int) (*domain.GapCompetency, error) {
	var gapCompetency domain.GapCompetency

	if err := r.db.First(&gapCompetency, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		r.log.WithError(err).WithField("id", id).Error("Failed to get gap competency by ID")
		return nil, err
	}

	return &gapCompetency, nil
}

func (r *gapCompetencyRepository) GetByReportID(reportID int) ([]domain.GapCompetency, error) {
	var gapCompetencies []domain.GapCompetency

	if err := r.db.Preload("CompetencyType").Where("report_id = ?", reportID).Find(&gapCompetencies).Error; err != nil {
		r.log.WithError(err).WithField("reportID", reportID).Error("Failed to get gap competencies by report ID")
		return nil, err
	}

	return gapCompetencies, nil
}

func (r *gapCompetencyRepository) GetByReportIDAndProgram(reportID int, program string) ([]domain.GapCompetency, error) {
	var gapCompetencies []domain.GapCompetency

	// Join with reports table to filter by idp_program
	if err := r.db.Preload("CompetencyType").Preload("Report").
		Joins("JOIN reports ON reports.id = gap_competencies.report_id").
		Where("gap_competencies.report_id = ? AND reports.idp_program = ?", reportID, program).
		Find(&gapCompetencies).Error; err != nil {
		r.log.WithError(err).WithFields(logrus.Fields{
			"reportID": reportID,
			"program":  program,
		}).Error("Failed to get gap competencies by report ID and program")
		return nil, err
	}

	return gapCompetencies, nil
}

func (r *gapCompetencyRepository) GetByCompetencyTypeID(competencyTypeID int) ([]domain.GapCompetency, error) {
	var gapCompetencies []domain.GapCompetency

	if err := r.db.Preload("Report").Where("competency_type_id = ?", competencyTypeID).Find(&gapCompetencies).Error; err != nil {
		r.log.WithError(err).WithField("competencyTypeID", competencyTypeID).Error("Failed to get gap competencies by competency type ID")
		return nil, err
	}

	return gapCompetencies, nil
}

func (r *gapCompetencyRepository) GetByProgram(program string) ([]domain.GapCompetency, error) {
	var gapCompetencies []domain.GapCompetency

	// Join with reports table to filter by idp_program
	if err := r.db.Preload("Report").Preload("CompetencyType").
		Joins("JOIN reports ON reports.id = gap_competencies.report_id").
		Where("reports.idp_program = ?", program).
		Find(&gapCompetencies).Error; err != nil {
		r.log.WithError(err).WithField("program", program).Error("Failed to get gap competencies by program")
		return nil, err
	}

	return gapCompetencies, nil
}

func (r *gapCompetencyRepository) GetWithReports(program string) ([]domain.GapCompetency, error) {
	var gapCompetencies []domain.GapCompetency

	query := r.db.Preload("Report").Preload("CompetencyType")
	if program != "" {
		// Join with reports table to filter by idp_program
		query = query.Joins("JOIN reports ON reports.id = gap_competencies.report_id").
			Where("reports.idp_program = ?", program)
	}

	if err := query.Find(&gapCompetencies).Error; err != nil {
		r.log.WithError(err).WithField("program", program).Error("Failed to get gap competencies with reports")
		return nil, err
	}

	return gapCompetencies, nil
}

func (r *gapCompetencyRepository) GetWithReportsAndCompetencyTypes(program string) ([]domain.GapCompetency, error) {
	var gapCompetencies []domain.GapCompetency

	query := r.db.Preload("Report").Preload("CompetencyType")
	if program != "" {
		// Join with reports table to filter by idp_program
		query = query.Joins("JOIN reports ON reports.id = gap_competencies.report_id").
			Where("reports.idp_program = ?", program)
	}

	if err := query.Find(&gapCompetencies).Error; err != nil {
		r.log.WithError(err).WithField("program", program).Error("Failed to get gap competencies with reports and competency types")
		return nil, err
	}

	return gapCompetencies, nil
}

func (r *gapCompetencyRepository) DeleteByReportIDAndCompetencyTypeID(reportID, competencyTypeID int) error {
	if err := r.db.Where("report_id = ? AND competency_type_id = ?", reportID, competencyTypeID).Delete(&domain.GapCompetency{}).Error; err != nil {
		r.log.WithError(err).WithFields(logrus.Fields{
			"reportID":         reportID,
			"competencyTypeID": competencyTypeID,
		}).Error("Failed to delete gap competency by report ID and competency type ID")
		return err
	}

	return nil
}

func (r *gapCompetencyRepository) GetGapCountByReportID(reportID int) (int64, error) {
	var count int64

	if err := r.db.Model(&domain.GapCompetency{}).Where("report_id = ?", reportID).Count(&count).Error; err != nil {
		r.log.WithError(err).WithField("reportID", reportID).Error("Failed to get gap count by report ID")
		return 0, err
	}

	return count, nil
}

func (r *gapCompetencyRepository) GetGapsByReportIDGrouped(reportID int) (map[string][]domain.GapCompetency, error) {
	var gapCompetencies []domain.GapCompetency

	// Preload Report to get IDPProgram
	if err := r.db.Preload("CompetencyType").Preload("Report").Where("report_id = ?", reportID).Find(&gapCompetencies).Error; err != nil {
		r.log.WithError(err).WithField("reportID", reportID).Error("Failed to get gaps by report ID grouped")
		return nil, err
	}

	grouped := make(map[string][]domain.GapCompetency)
	for _, gap := range gapCompetencies {
		// Get program from Report.IDPProgram instead of gap.Program
		program := "Unknown"
		if gap.Report != nil {
			program = gap.Report.IDPProgram
		}
		grouped[program] = append(grouped[program], gap)
	}

	return grouped, nil
}

func (r *gapCompetencyRepository) Create(gapCompetency *domain.GapCompetency) error {
	if err := r.db.Create(gapCompetency).Error; err != nil {
		r.log.WithError(err).Error("Failed to create gap competency")
		return err
	}

	return nil
}

func (r *gapCompetencyRepository) Update(gapCompetency *domain.GapCompetency) error {
	if err := r.db.Save(gapCompetency).Error; err != nil {
		r.log.WithError(err).WithField("id", gapCompetency.ID).Error("Failed to update gap competency")
		return err
	}

	return nil
}

func (r *gapCompetencyRepository) Delete(id int) error {
	if err := r.db.Delete(&domain.GapCompetency{}, id).Error; err != nil {
		r.log.WithError(err).WithField("id", id).Error("Failed to delete gap competency")
		return err
	}

	return nil
}
