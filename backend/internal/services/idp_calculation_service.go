package services

import (
	"backend/internal/models/domain"
	"backend/internal/repositories"
	"fmt"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type IDPCalculationService struct {
	DB                       *gorm.DB
	Log                      *logrus.Logger
	IDPTrackingRepo          repositories.IDPTrackingRepository
	ReportRepo               *repositories.ReportRepository
	TrainingScheduleRepo     repositories.TrainingScheduleRepository
	CoachingReportRepo       repositories.CoachingReportRepository
	MentoringReportRepo      *repositories.MentoringReportRepository
	ApolloAPIService         *ApolloAPIService
}

func NewIDPCalculationService(
	db *gorm.DB,
	log *logrus.Logger,
	idpTrackingRepo repositories.IDPTrackingRepository,
	reportRepo *repositories.ReportRepository,
	trainingScheduleRepo repositories.TrainingScheduleRepository,
	coachingReportRepo repositories.CoachingReportRepository,
	mentoringReportRepo *repositories.MentoringReportRepository,
	apolloAPIService *ApolloAPIService,
) *IDPCalculationService {
	return &IDPCalculationService{
		DB:                   db,
		Log:                  log,
		IDPTrackingRepo:      idpTrackingRepo,
		ReportRepo:           reportRepo,
		TrainingScheduleRepo: trainingScheduleRepo,
		CoachingReportRepo:   coachingReportRepo,
		MentoringReportRepo:  mentoringReportRepo,
		ApolloAPIService:     apolloAPIService,
	}
}

// CalculateReadinessForMonth calculates and updates IDP tracking for a specific report and month
func (s *IDPCalculationService) CalculateReadinessForMonth(reportID int, month time.Time) error {
	s.Log.Infof("Calculating readiness for report ID: %d, month: %s", reportID, month.Format("2006-01"))

	// Get report
	var report domain.Report
	if err := s.DB.First(&report, reportID).Error; err != nil {
		return fmt.Errorf("failed to get report: %w", err)
	}

	// Skip if readiness_month is 0 or nil (talent sudah ready atau tidak aktif)
	if report.ReadinessMonth == nil || *report.ReadinessMonth == 0 {
		s.Log.Infof("Skipping report ID %d - readiness_month is 0 or nil", reportID)
		return nil
	}

	// DELETE existing tracking for this report+month to prevent duplicates
	// This ensures fresh calculation every time
	normalized := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.UTC)
	if err := s.DB.Where("report_id = ? AND month = ?", reportID, normalized).
		Delete(&domain.IDPTracking{}).Error; err != nil {
		s.Log.Warnf("Failed to delete existing tracking (might not exist): %v", err)
	} else {
		s.Log.Infof("🗑️  Deleted existing idp_tracking for report_id=%d, month=%s", reportID, month.Format("2006-01"))
	}

	// Get or create tracking for this month
	tracking, err := s.IDPTrackingRepo.GetByReportAndMonth(reportID, month)
	if err != nil {
		return fmt.Errorf("failed to get tracking: %w", err)
	}

	// Parse competency gap analysis
	competencyCodes := s.parseCompetencyGapAnalysis(report.CompetencyGapAnalysis)
	competencyCount := len(competencyCodes)
	totalTrainingNeeded := competencyCount * 2

	// Get training start date for this program to calculate month number
	trainingStartDate, err := s.TrainingScheduleRepo.GetEarliestTrainingDateByProgram(report.IDPProgram)
	if err != nil {
		s.Log.Warnf("Failed to get training start date for program %s: %v", report.IDPProgram, err)
	}

	// Calculate which month this is relative to training start (1-based)
	monthNumber := 1 // Default to month 1 if we can't determine
	if trainingStartDate != nil {
		// Calculate months difference between training start and current month
		// Both normalized to first day of month for accurate comparison
		startMonth := time.Date(trainingStartDate.Year(), trainingStartDate.Month(), 1, 0, 0, 0, 0, time.UTC)
		currentMonth := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.UTC)
		
		// Calculate difference in months
		yearsDiff := currentMonth.Year() - startMonth.Year()
		monthsDiff := int(currentMonth.Month()) - int(startMonth.Month())
		totalMonthsDiff := yearsDiff*12 + monthsDiff
		
		// Month number is 1-based (first month of training = 1)
		monthNumber = totalMonthsDiff + 1
		
		if monthNumber < 1 {
			monthNumber = 1 // Safety: if current month is before training start
		}
		
		s.Log.Infof("Training start date: %s, Current month: %s, Month number: %d", 
			trainingStartDate.Format("2006-01-02"), month.Format("2006-01"), monthNumber)
	} else {
		s.Log.Warnf("No training start date found for program %s, using month number 1", report.IDPProgram)
	}

	if tracking == nil {
		// Calculate dynamic training target
		targetTraining := domain.CalculateTrainingTarget(report.IDPProgram, *report.ReadinessMonth, competencyCount)
		
		// Calculate dynamic mentoring target based on program, readiness, and month number
		targetMentoring := domain.CalculateMentoringTarget(report.IDPProgram, *report.ReadinessMonth, monthNumber)
		
		// Calculate dynamic coaching target (always 1 per month)
		targetCoaching := domain.CalculateCoachingTarget(report.IDPProgram, *report.ReadinessMonth, monthNumber)

		tracking = &domain.IDPTracking{
			ReportID:             reportID,
			Month:                time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.UTC),
			CompetencyTarget:     report.CompetencyGapAnalysis,
			TotalCompetencyCount: competencyCount,
			TotalTrainingNeeded:  totalTrainingNeeded,
			TargetTraining:       targetTraining,
			TargetCoaching:       targetCoaching,
			TargetMentoring:      targetMentoring,
		}

		prevMonth := month.AddDate(0, -1, 0)
		prevTracking, err := s.IDPTrackingRepo.GetByReportAndMonth(reportID, prevMonth)
		if err != nil {
			s.Log.Warnf("Failed to get previous month tracking: %v", err)
		}

		if prevTracking != nil {
			trainingBacklog, coachingBacklog, mentoringBacklog := prevTracking.CalculateNextMonthBacklog()
			tracking.BacklogTraining = trainingBacklog
			tracking.BacklogCoaching = coachingBacklog
			tracking.BacklogMentoring = mentoringBacklog
			s.Log.Infof("Applied backlog from previous month - Training: %d, Coaching: %d, Mentoring: %d",
				trainingBacklog, coachingBacklog, mentoringBacklog)
		}
	}

	// 1. Get actual training count and competency done tracking
	actualTraining, competencyDone, err := s.getActualTrainingCountWithDetails(
		report.SeamanCode,
		report.IDPProgram,
		competencyCodes,
		month,
	)
	if err != nil {
		s.Log.Warnf("Failed to get training count: %v", err)
		actualTraining = 0
	}
	tracking.ActualTraining = actualTraining
	tracking.CompetencyDone = competencyDone

	// 2. Calculate actual coaching count
	actualCoaching, err := s.getActualCoachingCount(reportID, month)
	if err != nil {
		s.Log.Warnf("Failed to get coaching count: %v", err)
		actualCoaching = 0
	}
	tracking.ActualCoaching = actualCoaching

	// 3. Calculate actual mentoring count
	actualMentoring, err := s.getActualMentoringCount(reportID, month)
	if err != nil {
		s.Log.Warnf("Failed to get mentoring count: %v", err)
		actualMentoring = 0
	}
	tracking.ActualMentoring = actualMentoring

	// 4. Calculate rates and readiness
	tracking.CalculateRates()

	// 5. Apply readiness reduction to report if needed (update total_readiness_update_months)
	if tracking.ReadinessReduction < 0 {
		// Get current total_readiness_update_months (this is the column we need to reduce)
		currentTotal := 0
		if report.TotalReadinessUpdateMonths != nil {
			currentTotal = *report.TotalReadinessUpdateMonths
		}
		
		newTotal := currentTotal + tracking.ReadinessReduction // -1 month
		if newTotal < 0 {
			newTotal = 0
		}
		tracking.NewReadinessMonth = newTotal

		// Update report's total_readiness_update_months
		report.TotalReadinessUpdateMonths = &newTotal
		if err := s.ReportRepo.Update(s.DB, &report); err != nil {
			s.Log.Errorf("Failed to update report total_readiness_update_months: %v", err)
		} else {
			s.Log.Infof("✅ Reduced total_readiness_update_months for report ID %d: %d -> %d months (readiness_rate: %.0f%%)", 
				reportID, currentTotal, newTotal, tracking.ReadinessRate)
		}
	} else {
		if report.TotalReadinessUpdateMonths != nil {
			tracking.NewReadinessMonth = *report.TotalReadinessUpdateMonths
		}
	}

	// 6. Save tracking (upsert to prevent duplicates)
	if err := s.IDPTrackingRepo.Upsert(tracking); err != nil {
		return fmt.Errorf("failed to upsert tracking: %w", err)
	}

	s.Log.Infof("Successfully calculated readiness for report ID %d - Readiness Rate: %.2f%%, Training: %d/%d, Coaching: %d/%d, Mentoring: %d/%d",
		reportID, tracking.ReadinessRate, 
		actualTraining, tracking.TargetTraining+tracking.BacklogTraining,
		actualCoaching, tracking.TargetCoaching+tracking.BacklogCoaching,
		actualMentoring, tracking.TargetMentoring+tracking.BacklogMentoring)

	return nil
}

// parseCompetencyGapAnalysis parses competency gap analysis string into array of codes
func (s *IDPCalculationService) parseCompetencyGapAnalysis(gapAnalysis string) []string {
	if gapAnalysis == "" {
		return []string{}
	}

	parts := strings.Split(gapAnalysis, ";")
	codes := make([]string, 0, len(parts))

	for _, part := range parts {
		code := strings.TrimSpace(part)
		if code != "" {
			codes = append(codes, code)
		}
	}

	return codes
}

// getActualTrainingCountWithDetails fetches training count and tracks completed competencies with material type
func (s *IDPCalculationService) getActualTrainingCountWithDetails(
	seamanCode string,
	program string,
	competencyCodes []string,
	month time.Time,
) (int, string, error) {
	if len(competencyCodes) == 0 {
		return 0, "", nil
	}

	completedCompetencies := make([]string, 0)
	totalCount := 0

	for _, competencyCode := range competencyCodes {
		schedules, err := s.TrainingScheduleRepo.GetByProgramAndCompetency(program, competencyCode)
		if err != nil {
			s.Log.Warnf("Failed to get training schedules for %s: %v", competencyCode, err)
			continue
		}

		for _, schedule := range schedules {
			if !schedule.IsStarted {
				continue
			}

			courseName := ""
			if schedule.ApolloCourseName != nil && *schedule.ApolloCourseName != "" {
				courseName = *schedule.ApolloCourseName
			} else {
				var training domain.Training
				err := s.DB.Joins("JOIN competency_types ON competency_types.id = training.competency_type_id").
					Where("competency_types.code = ?", competencyCode).
					Order("training.lvl DESC").
					First(&training).Error

				if err != nil {
					s.Log.Warnf("Failed to find training material for %s: %v", competencyCode, err)
					continue
				}

				courseName = strings.ToUpper(training.TopikTraining)
			}

			if courseName == "" {
				continue
			}

			count, err := s.ApolloAPIService.GetTrainingCountForMonth(seamanCode, courseName, month)
			if err != nil {
				s.Log.Warnf("Failed to get training count for %s: %v", courseName, err)
				continue
			}

			if count > 0 {
				materialType := schedule.MaterialType
				completedCompetencies = append(completedCompetencies, fmt.Sprintf("%s-%d", competencyCode, materialType))
				totalCount += count
			}
		}
	}

	competencyDone := strings.Join(completedCompetencies, "; ")
	return totalCount, competencyDone, nil
}

// getActualTrainingCount fetches training count from Apollo API for started trainings only
// DEPRECATED: Use getActualTrainingCountWithDetails instead
func (s *IDPCalculationService) getActualTrainingCount(seamanCode, program string, month time.Time) (int, error) {
	// Get started trainings for this specific program (filtered at database level)
	relevantTrainings, err := s.TrainingScheduleRepo.GetStartedTrainingsByProgram(program)
	if err != nil {
		return 0, err
	}

	if len(relevantTrainings) == 0 {
		s.Log.Infof("No started trainings found for program: %s", program)
		return 0, nil
	}

	// Count total trainings completed from Apollo API
	// Use a map to track unique competency codes (avoid counting the same training twice)
	processedCompetencies := make(map[string]bool)
	totalCount := 0
	
	for _, schedule := range relevantTrainings {
		// Skip if we already processed this competency
		if processedCompetencies[schedule.CompetencyCode] {
			continue
		}
		processedCompetencies[schedule.CompetencyCode] = true

		// Get the highest level training material (level 4) for this competency
		// This matches the frontend display which shows the main training title
		var training domain.Training
		err := s.DB.Joins("JOIN competency_types ON competency_types.id = training.competency_type_id").
			Where("competency_types.code = ?", schedule.CompetencyCode).
			Order("training.lvl DESC"). // Get highest level first (level 4)
			First(&training).Error
		
		if err != nil {
			s.Log.Warnf("Failed to find training material for %s: %v", 
				schedule.CompetencyCode, err)
			continue
		}

		// Use the actual topik_training from training table (e.g., "CHANGE LEADERSHIP")
		courseName := training.TopikTraining
		if courseName == "" {
			s.Log.Warnf("Empty topik_training for %s, skipping", schedule.CompetencyCode)
			continue
		}

		// Convert to uppercase for Apollo API (requires all caps)
		courseName = strings.ToUpper(courseName)

		count, err := s.ApolloAPIService.GetTrainingCountForMonth(seamanCode, courseName, month)
		if err != nil {
			s.Log.Warnf("Failed to get training count for %s: %v", courseName, err)
			continue
		}
		totalCount += count
	}

	return totalCount, nil
}

// getActualCoachingCount counts coaching reports for this report in the given month
func (s *IDPCalculationService) getActualCoachingCount(reportID int, month time.Time) (int, error) {
	var count int64

	startOfMonth := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.Local)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	// Query coaching_reports where report_ids contains this reportID
	// Use JSON_CONTAINS to properly search in JSON array
	reportIDStr := fmt.Sprintf("%d", reportID)
	err := s.DB.Model(&domain.CoachingReport{}).
		Where("created_at BETWEEN ? AND ?", startOfMonth, endOfMonth).
		Where("JSON_CONTAINS(report_ids, ?, '$')", reportIDStr).
		Count(&count).Error

	return int(count), err
}

// getActualMentoringCount counts mentoring reports for this report in the given month
func (s *IDPCalculationService) getActualMentoringCount(reportID int, month time.Time) (int, error) {
	var count int64

	startOfMonth := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.Local)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Second)

	// Query mentoring_reports where report_ids contains this reportID
	// Use JSON_CONTAINS to properly search in JSON array
	reportIDStr := fmt.Sprintf("%d", reportID)
	err := s.DB.Model(&domain.MentoringReport{}).
		Where("created_at BETWEEN ? AND ?", startOfMonth, endOfMonth).
		Where("JSON_CONTAINS(report_ids, ?, '$')", reportIDStr).
		Count(&count).Error

	return int(count), err
}

// CalculateReadinessForAllReports processes all active reports for current month
func (s *IDPCalculationService) CalculateReadinessForAllReports() error {
	s.Log.Info("Starting readiness calculation for all active reports")

	// Get all active report IDs (readiness_month > 0)
	reportIDs, err := s.IDPTrackingRepo.GetAllActiveReports()
	if err != nil {
		return fmt.Errorf("failed to get active reports: %w", err)
	}

	s.Log.Infof("Found %d active reports to process", len(reportIDs))

	currentMonth := time.Now()
	successCount := 0
	errorCount := 0

	for _, reportID := range reportIDs {
		if err := s.CalculateReadinessForMonth(reportID, currentMonth); err != nil {
			s.Log.Errorf("Failed to calculate readiness for report ID %d: %v", reportID, err)
			errorCount++
		} else {
			successCount++
		}
	}

	s.Log.Infof("Readiness calculation completed - Success: %d, Errors: %d", successCount, errorCount)

	return nil
}

// RefreshReadinessForReport manually refreshes readiness for a specific report (invalidates cache first)
func (s *IDPCalculationService) RefreshReadinessForReport(reportID int) error {
	s.Log.Infof("Manually refreshing readiness for report ID: %d", reportID)

	// Get report to get seaman code
	var report domain.Report
	if err := s.DB.First(&report, reportID).Error; err != nil {
		return fmt.Errorf("failed to get report: %w", err)
	}

	// Invalidate Apollo API cache for this seaman
	if err := s.ApolloAPIService.InvalidateCache(report.SeamanCode); err != nil {
		s.Log.Warnf("Failed to invalidate cache: %v", err)
	}

	// Recalculate for current month
	return s.CalculateReadinessForMonth(reportID, time.Now())
}
