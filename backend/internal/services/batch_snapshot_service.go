package services

import (
	"backend/internal/models/domain"
	"backend/internal/repositories"
	"fmt"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type BatchSnapshotService struct {
	DB                     *gorm.DB
	Log                    *logrus.Logger
	BatchRepository        *repositories.BatchRepository
	BatchSnapshotRepository *repositories.BatchSnapshotRepository
}

func NewBatchSnapshotService(
	db *gorm.DB,
	log *logrus.Logger,
	batchRepo *repositories.BatchRepository,
	snapshotRepo *repositories.BatchSnapshotRepository,
) *BatchSnapshotService {
	return &BatchSnapshotService{
		DB:                     db,
		Log:                    log,
		BatchRepository:        batchRepo,
		BatchSnapshotRepository: snapshotRepo,
	}
}

// SnapshotAndCloseBatch performs (in a transaction):
//  1. Fetches all reports assigned to the batch via report_batches
//  2. Copies each report into batch_report_snapshots
//  3. Deletes all report_scores for those reports
//  4. Resets score columns on reports to 0
//  5. Resets seafarer_assessments.attempts_count = 0, status = 'assigned'
//  6. Marks the batch as completed with snapshotted_at = now()
func (s *BatchSnapshotService) SnapshotAndCloseBatch(batchID int) error {
	now := time.Now()

	return s.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Get the batch
		batch, err := s.BatchRepository.FindByID(tx, batchID)
		if err != nil {
			return fmt.Errorf("batch %d not found: %w", batchID, err)
		}
		if batch.Status == "completed" {
			s.Log.Infof("Batch %d already completed, skipping snapshot", batchID)
			return nil
		}

		// 2. Fetch report IDs for this batch
		reportIDs, err := s.BatchRepository.GetReportIDsForBatch(tx, batchID)
		if err != nil {
			return fmt.Errorf("failed to get report IDs for batch %d: %w", batchID, err)
		}

		if len(reportIDs) == 0 {
			s.Log.Warnf("Batch %d has no reports; marking completed without snapshot", batchID)
		} else {
			// 3. Load full report rows
			var reports []domain.Report
			if err := tx.Where("id IN ?", reportIDs).Find(&reports).Error; err != nil {
				return fmt.Errorf("failed to load reports for batch %d: %w", batchID, err)
			}

			// 4. Build snapshot rows
			snapshots := make([]domain.BatchReportSnapshot, 0, len(reports))
			for _, r := range reports {
				snapshots = append(snapshots, domain.BatchReportSnapshot{
					BatchID:    batchID,
					ReportID:   r.ID,
					SnapshotAt: now,

					SeamanCode:   r.SeamanCode,
					SeafarerCode: r.SeafarerCode,
					Nama:         r.Nama,
					IDP:          r.IDP,
					Jabatan:      r.Jabatan,
					VesselName:   r.VesselName,
					Certificate:  r.Certificate,
					Age:          r.Age,
					TanggalLahir: r.TanggalLahir,

					WarningLetter: r.WarningLetter,
					CaseHistory:   r.CaseHistory,
					YearOfCase:    r.YearOfCase,
					VesselHistory: r.VesselHistory,

					KonditeReview:         r.KonditeReview,
					KpiVessel:             r.KpiVessel,
					PerformanceScore:      r.PerformanceScore,
					ValueAssessment:       r.ValueAssessment,
					AssessmentCenter:      r.AssessmentCenter,
					PotentialScore:        r.PotentialScore,
					HavQuadran:            r.HavQuadran,
					HavMapping:            r.HavMapping,
					CompetencyGapAnalysis: r.CompetencyGapAnalysis,
					TotalGap:              r.TotalGap,
					Strength:              r.Strength,
					TalentClassified:      r.TalentClassified,
					IDPProgram:            r.IDPProgram,
					HavQuadran2:           r.HavQuadran2,
					TalentClassified2:     r.TalentClassified2,
					Readiness:             r.Readiness,
					CertificateEligible:   r.CertificateEligible,

					TrainingCompleted:  r.TrainingCompleted,
					TrainingPlanned:    r.TrainingPlanned,
					MentoringCompleted: r.MentoringCompleted,
					MentoringPlanned:   r.MentoringPlanned,
					CoachingCompleted:  r.CoachingCompleted,
					CoachingPlanned:    r.CoachingPlanned,

					DataIncumbent:    r.DataIncumbent,
					SuccessionVessel: r.SuccessionVessel,
					SuccessionRank:   r.SuccessionRank,

					IDPStart:  r.IDPStart,
					IDPMentor: r.IDPMentor,
					IDPCoach:  r.IDPCoach,

					User:                       r.User,
					Keterangan:                 r.Keterangan,
					TMNM:                       r.TMNM,
					ReadinessMonth:             r.ReadinessMonth,
					EducationFulfillmentMonths: r.EducationFulfillmentMonths,
					TotalReadinessUpdateMonths: r.TotalReadinessUpdateMonths,
					StartDate:                  r.StartDate,
				})
			}

			if err := s.BatchSnapshotRepository.BulkCreate(tx, snapshots); err != nil {
				return fmt.Errorf("failed to create snapshots for batch %d: %w", batchID, err)
			}

			// 5. Delete report_scores for those reports
			if err := tx.Where("report_id IN ?", reportIDs).Delete(&domain.ReportScore{}).Error; err != nil {
				return fmt.Errorf("failed to delete report_scores for batch %d: %w", batchID, err)
			}

			// 6. Reset score columns on reports to 0
			scoreZero := map[string]interface{}{
				"kondite_review":    0,
				"kpi_vessel":        0,
				"performance_score": 0,
				"value_assessment":  0,
				"assessment_center": 0,
				"potential_score":   0,
				"hav_quadran":       0,
				"total_gap":         0,
				"hav_quadran2":      0,
				"updated_at":        now,
			}
			if err := tx.Model(&domain.Report{}).Where("id IN ?", reportIDs).Updates(scoreZero).Error; err != nil {
				return fmt.Errorf("failed to reset report scores for batch %d: %w", batchID, err)
			}

			// 7. Reset seafarer_assessments for those reports (join via seafarer_code)
			var seafarerCodes []string
			if err := tx.Model(&domain.Report{}).
				Select("seafarer_code").
				Where("id IN ?", reportIDs).
				Pluck("seafarer_code", &seafarerCodes).Error; err != nil {
				return fmt.Errorf("failed to get seafarer codes for batch %d: %w", batchID, err)
			}
			if len(seafarerCodes) > 0 {
				if err := tx.Table("seafarer_assessments").
					Where("seafarer_code IN ?", seafarerCodes).
					Updates(map[string]interface{}{
						"attempts_count": 0,
						"status":         "assigned",
					}).Error; err != nil {
					return fmt.Errorf("failed to reset seafarer_assessments for batch %d: %w", batchID, err)
				}
			}
		}

		// 8. Mark batch as completed
		if err := s.BatchRepository.UpdateStatus(tx, batchID, "completed", &now); err != nil {
			return fmt.Errorf("failed to mark batch %d as completed: %w", batchID, err)
		}

		s.Log.Infof("Batch %d (no. %d) successfully snapshotted and closed at %s", batchID, batch.BatchNo, now.Format(time.RFC3339))
		return nil
	})
}

// GetSnapshotsForBatch returns all snapshot rows for the given batch.
func (s *BatchSnapshotService) GetSnapshotsForBatch(batchID int) ([]domain.BatchReportSnapshot, error) {
	return s.BatchSnapshotRepository.FindByBatchID(s.DB, batchID)
}
