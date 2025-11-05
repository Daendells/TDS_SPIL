package repositories

import (
	"backend/internal/models/domain"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type TrainingScheduleRepository interface {
	GetAll() ([]domain.TrainingSchedule, error)
	GetByID(id int) (*domain.TrainingSchedule, error)
	GetByProgram(program string) ([]domain.TrainingSchedule, error)
	GetByProgramAndCompetency(program, competencyCode string) ([]domain.TrainingSchedule, error)
	GetByDateRange(startDate, endDate time.Time) ([]domain.TrainingSchedule, error)
	Create(schedule *domain.TrainingSchedule) error
	Update(schedule *domain.TrainingSchedule) error
	Delete(id int) error
	DeleteByProgram(program string) error
	CreateBatch(schedules []domain.TrainingSchedule) error
}

type trainingScheduleRepository struct {
	db  *gorm.DB
	log *logrus.Logger
}

func NewTrainingScheduleRepository(db *gorm.DB, log *logrus.Logger) TrainingScheduleRepository {
	return &trainingScheduleRepository{
		db:  db,
		log: log,
	}
}

func (r *trainingScheduleRepository) GetAll() ([]domain.TrainingSchedule, error) {
	var schedules []domain.TrainingSchedule

	if err := r.db.Order("scheduled_date ASC").Find(&schedules).Error; err != nil {
		r.log.WithError(err).Error("Failed to get all training schedules")
		return nil, err
	}

	return schedules, nil
}

func (r *trainingScheduleRepository) GetByID(id int) (*domain.TrainingSchedule, error) {
	var schedule domain.TrainingSchedule

	if err := r.db.First(&schedule, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		r.log.WithError(err).WithField("id", id).Error("Failed to get training schedule by ID")
		return nil, err
	}

	return &schedule, nil
}

func (r *trainingScheduleRepository) GetByProgram(program string) ([]domain.TrainingSchedule, error) {
	var schedules []domain.TrainingSchedule

	if err := r.db.Where("program = ?", program).Order("scheduled_date ASC").Find(&schedules).Error; err != nil {
		r.log.WithError(err).WithField("program", program).Error("Failed to get training schedules by program")
		return nil, err
	}

	return schedules, nil
}

func (r *trainingScheduleRepository) GetByProgramAndCompetency(program, competencyCode string) ([]domain.TrainingSchedule, error) {
	var schedules []domain.TrainingSchedule

	if err := r.db.Where("program = ? AND competency_code = ?", program, competencyCode).
		Order("material_type ASC, scheduled_date ASC").Find(&schedules).Error; err != nil {
		r.log.WithError(err).WithFields(logrus.Fields{
			"program":        program,
			"competencyCode": competencyCode,
		}).Error("Failed to get training schedules by program and competency")
		return nil, err
	}

	return schedules, nil
}

func (r *trainingScheduleRepository) GetByDateRange(startDate, endDate time.Time) ([]domain.TrainingSchedule, error) {
	var schedules []domain.TrainingSchedule

	if err := r.db.Where("scheduled_date BETWEEN ? AND ?", startDate, endDate).
		Order("scheduled_date ASC").Find(&schedules).Error; err != nil {
		r.log.WithError(err).WithFields(logrus.Fields{
			"startDate": startDate,
			"endDate":   endDate,
		}).Error("Failed to get training schedules by date range")
		return nil, err
	}

	return schedules, nil
}

func (r *trainingScheduleRepository) Create(schedule *domain.TrainingSchedule) error {
	if err := r.db.Create(schedule).Error; err != nil {
		r.log.WithError(err).Error("Failed to create training schedule")
		return err
	}

	return nil
}

func (r *trainingScheduleRepository) Update(schedule *domain.TrainingSchedule) error {
	if err := r.db.Save(schedule).Error; err != nil {
		r.log.WithError(err).WithField("id", schedule.ID).Error("Failed to update training schedule")
		return err
	}

	return nil
}

func (r *trainingScheduleRepository) Delete(id int) error {
	if err := r.db.Delete(&domain.TrainingSchedule{}, id).Error; err != nil {
		r.log.WithError(err).WithField("id", id).Error("Failed to delete training schedule")
		return err
	}

	return nil
}

func (r *trainingScheduleRepository) DeleteByProgram(program string) error {
	if err := r.db.Where("program = ?", program).Delete(&domain.TrainingSchedule{}).Error; err != nil {
		r.log.WithError(err).WithField("program", program).Error("Failed to delete training schedules by program")
		return err
	}

	return nil
}

func (r *trainingScheduleRepository) CreateBatch(schedules []domain.TrainingSchedule) error {
	if err := r.db.CreateInBatches(schedules, 100).Error; err != nil {
		r.log.WithError(err).Error("Failed to create training schedules in batch")
		return err
	}

	return nil
}
