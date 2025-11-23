package services

import (
	"backend/internal/models/domain"
	"backend/internal/repositories"
	"fmt"
	"math/rand"
	"time"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type TrainingPlanService interface {
	GetTrainingPlan(program string) (*domain.TrainingPlanResponse, error)
	GenerateSchedules(program string) error
	GetCompetencyMapping(program string) map[string]domain.CompetencyMappingItem
	UpdateScheduledDate(id int, newDate time.Time) error
}

type trainingPlanService struct {
	gapCompetencyRepo        repositories.GapCompetencyRepository
	trainingScheduleRepo     repositories.TrainingScheduleRepository
	competencyProgramMapRepo repositories.CompetencyProgramMappingRepository
	competencyTypeRepo       repositories.CompetencyTypeRepository
	reportRepo               repositories.ReportRepository
	db                       *gorm.DB
	log                      *logrus.Logger
}

func NewTrainingPlanService(
	gapCompetencyRepo repositories.GapCompetencyRepository,
	trainingScheduleRepo repositories.TrainingScheduleRepository,
	competencyProgramMapRepo repositories.CompetencyProgramMappingRepository,
	competencyTypeRepo repositories.CompetencyTypeRepository,
	reportRepo repositories.ReportRepository,
	db *gorm.DB,
	log *logrus.Logger,
) TrainingPlanService {
	return &trainingPlanService{
		gapCompetencyRepo:        gapCompetencyRepo,
		trainingScheduleRepo:     trainingScheduleRepo,
		competencyProgramMapRepo: competencyProgramMapRepo,
		competencyTypeRepo:       competencyTypeRepo,
		reportRepo:               reportRepo,
		db:                       db,
		log:                      log,
	}
}

// GetCompetencyMapping returns the mapping of competency codes to training topics for each program
func (s *trainingPlanService) GetCompetencyMapping(program string) map[string]domain.CompetencyMappingItem {
	// Get mappings from database
	programMappings, err := s.competencyProgramMapRepo.GetByProgram(program)
	if err != nil {
		s.log.WithError(err).WithField("program", program).Error("Failed to get competency program mappings")
		return make(map[string]domain.CompetencyMappingItem)
	}

	// Get gap competencies to calculate category directly
	gapCompetencies, err := s.gapCompetencyRepo.GetWithReportsAndCompetencyTypes(program)
	if err != nil {
		s.log.WithError(err).WithField("program", program).Error("Failed to get gap competencies for categories")
		// Continue without categories rather than failing
	}

	// Calculate categories directly using same logic as buildSummary
	reportGaps := make(map[int][]domain.GapCompetency)
	for _, gc := range gapCompetencies {
		reportGaps[gc.ReportID] = append(reportGaps[gc.ReportID], gc)
	}
	totalParticipants := len(reportGaps)
	gapCounts := make(map[string]int)
	for _, gc := range gapCompetencies {
		if gc.CompetencyType != nil {
			gapCounts[gc.CompetencyType.Code]++
		}
	}
	category := make(map[string]string)
	if totalParticipants > 0 {
		for code, count := range gapCounts {
			percentage := (float64(count) / float64(totalParticipants)) * 100
			if percentage > 60 {
				category[code] = "M"
			} else {
				category[code] = "NM"
			}
		}
	}

	result := make(map[string]domain.CompetencyMappingItem)
	for _, mapping := range programMappings {
		// Preload CompetencyType relation to get code and name
		if mapping.CompetencyType == nil {
			continue
		}

		competencyCode := mapping.CompetencyType.Code
		competencyName := mapping.CompetencyType.Name

		// Get training material names from relations
		trainingTopics := []string{}
		if mapping.TrainingMaterial1 != nil {
			trainingTopics = append(trainingTopics, mapping.TrainingMaterial1.TopikTraining)
		}
		if mapping.TrainingMaterial2 != nil {
			trainingTopics = append(trainingTopics, mapping.TrainingMaterial2.TopikTraining)
		}

		// Get category from calculated map
		cat := "NM"
		if c, exists := category[competencyCode]; exists {
			cat = c
		}

		result[competencyCode] = domain.CompetencyMappingItem{
			Name:           competencyName,
			Category:       cat,
			TrainingTopics: trainingTopics,
		}
	}

	return result
}

// GetTrainingPlan retrieves the complete training plan data for a program
func (s *trainingPlanService) GetTrainingPlan(program string) (*domain.TrainingPlanResponse, error) {
	// Get gap competencies with reports and competency types
	gapCompetencies, err := s.gapCompetencyRepo.GetWithReportsAndCompetencyTypes(program)
	if err != nil {
		s.log.WithError(err).WithField("program", program).Error("Failed to get gap competencies with reports and competency types")
		return nil, err
	}

	// Get training schedules for the program
	schedules, err := s.trainingScheduleRepo.GetByProgram(program)
	if err != nil {
		s.log.WithError(err).WithField("program", program).Error("Failed to get training schedules")
		return nil, err
	}

	// Group gap competencies by report ID
	reportGaps := make(map[int][]domain.GapCompetency)
	for _, gc := range gapCompetencies {
		reportGaps[gc.ReportID] = append(reportGaps[gc.ReportID], gc)
	}

	// Build participants data
	participants := make([]domain.TrainingPlanParticipant, 0)
	participantIndex := 1

	for _, gaps := range reportGaps {
		if len(gaps) == 0 || gaps[0].Report == nil {
			continue
		}

		report := gaps[0].Report
		gapsMap := s.buildGapsMapFromMultiple(gaps)
		totalGaps := len(gaps)

		// Get total_readiness_update_months from report, default to "0" if nil
		readinessMonths := "0"
		if report.TotalReadinessUpdateMonths != nil {
			readinessMonths = fmt.Sprintf("%d", *report.TotalReadinessUpdateMonths)
		}

		participant := domain.TrainingPlanParticipant{
			No:         participantIndex,
			VesselName: report.VesselName,
			SeamanCode: report.SeamanCode,
			Name:       report.Nama,
			Position:   report.Jabatan,
			Gaps:       gapsMap,
			Total:      totalGaps,
			Readiness:  readinessMonths, // From total_readiness_update_months column
		}
		participants = append(participants, participant)
		participantIndex++
	}

	// Build summary data
	summary := s.buildSummary(gapCompetencies, schedules, program)

	// Get minimum deadline months for this program
	minDeadlineMonths, err := s.reportRepo.GetMinTotalReadinessMonths(s.db, program)
	if err != nil {
		s.log.WithError(err).Error("Failed to get minimum deadline months")
		minDeadlineMonths = 0 // Default to 0 if error
	}

	response := &domain.TrainingPlanResponse{
		Participants:      participants,
		Summary:           summary,
		Program:           program,
		TotalCount:        len(participants),
		MinDeadlineMonths: minDeadlineMonths,
	}

	return response, nil
}

// buildGapsMap converts gap competency boolean values to display format
func (s *trainingPlanService) buildGapsMap(gc *domain.GapCompetency) map[string]interface{} {
	result := make(map[string]interface{})

	if gc.CompetencyType != nil {
		result[gc.CompetencyType.Code] = "1"
	}

	return result
}

func (s *trainingPlanService) buildGapsMapFromMultiple(gaps []domain.GapCompetency) map[string]interface{} {
	result := make(map[string]interface{})

	// Get program from first gap's Report
	program := ""
	if len(gaps) > 0 && gaps[0].Report != nil {
		program = gaps[0].Report.IDPProgram
	}

	// Get all competency codes for the program directly from database
	programMappings, err := s.competencyProgramMapRepo.GetByProgram(program)
	if err != nil {
		s.log.WithError(err).WithField("program", program).Error("Failed to get competency program mappings")
	}

	// Initialize all competency codes as empty
	for _, mapping := range programMappings {
		if mapping.CompetencyType != nil {
			result[mapping.CompetencyType.Code] = ""
		}
	}

	// Mark gaps that exist
	for _, gap := range gaps {
		if gap.CompetencyType != nil {
			result[gap.CompetencyType.Code] = "1"
		}
	}

	return result
}

// buildSummary calculates aggregated data for the summary section
func (s *trainingPlanService) buildSummary(gapCompetencies []domain.GapCompetency, schedules []domain.TrainingSchedule, program string) domain.TrainingPlanSummary {
	// Group gaps by report ID to get unique participants
	reportGaps := make(map[int][]domain.GapCompetency)
	for _, gc := range gapCompetencies {
		reportGaps[gc.ReportID] = append(reportGaps[gc.ReportID], gc)
	}

	totalParticipants := len(reportGaps)
	if totalParticipants == 0 {
		return domain.TrainingPlanSummary{}
	}

	// Count gaps per competency
	gapCounts := make(map[string]int)
	competencyCodes := []string{"LDC", "DCM", "CIO", "SIO", "FLX", "LAG", "RSC", "CSO", "COM", "EMP", "TOR", "LDP", "PNO", "DIR", "ACH", "ACT", "IDS", "CFO", "RBG", "ING", "RSF", "BAC"}

	for _, code := range competencyCodes {
		gapCounts[code] = 0
	}

	// Count gaps for each participant
	for _, gaps := range reportGaps {
		participantGaps := make(map[string]bool)

		// Mark which competencies this participant has gaps in
		for _, gap := range gaps {
			if gap.CompetencyType != nil {
				participantGaps[gap.CompetencyType.Code] = true
			}
		}

		// Count each competency gap once per participant
		for code := range participantGaps {
			gapCounts[code]++
		}
	}

	// Calculate percentages and categories
	percentageGap := make(map[string]float64)
	category := make(map[string]string)

	for code, count := range gapCounts {
		percentage := float64(count) / float64(totalParticipants) * 100
		percentageGap[code] = percentage

		if percentage > 60 {
			category[code] = "M" // Mandatory
		} else {
			category[code] = "NM" // Non-Mandatory
		}
	}

	// Build schedule maps
	trainingMateri1 := make(map[string]string)
	trainingMateri2 := make(map[string]string)
	scheduleIDs := make(map[string]map[string]int)

	for _, schedule := range schedules {
		dateStr := schedule.GetFormattedDate()
		
		if _, exists := scheduleIDs[schedule.CompetencyCode]; !exists {
			scheduleIDs[schedule.CompetencyCode] = make(map[string]int)
		}
		
		if schedule.MaterialType == 1 {
			trainingMateri1[schedule.CompetencyCode] = dateStr
			scheduleIDs[schedule.CompetencyCode]["1"] = schedule.ID
		} else if schedule.MaterialType == 2 {
			trainingMateri2[schedule.CompetencyCode] = dateStr
			scheduleIDs[schedule.CompetencyCode]["2"] = schedule.ID
		}
	}

	return domain.TrainingPlanSummary{
		Total:           gapCounts,
		PercentageGap:   percentageGap,
		Category:        category,
		TrainingMateri1: trainingMateri1,
		TrainingMateri2: trainingMateri2,
		ScheduleIDs:     scheduleIDs,
	}
}

// GenerateSchedules creates training schedules based on the complex scheduling logic
func (s *trainingPlanService) GenerateSchedules(program string) error {
	// Get minimum readiness deadline from active participants (readiness_month > 0)
	// This deadline applies ONLY to Mandatory (M) schedules
	minDeadlineMonths, err := s.reportRepo.GetMinTotalReadinessMonths(s.db, program)
	if err != nil {
		s.log.WithError(err).WithField("program", program).Error("Failed to get minimum readiness deadline")
		return fmt.Errorf("failed to get readiness deadline: %w", err)
	}

	s.log.WithFields(logrus.Fields{
		"program":         program,
		"deadline_months": minDeadlineMonths,
	}).Info("Found minimum readiness deadline for MANDATORY schedules")

	// Get gap competencies to analyze
	gapCompetencies, err := s.gapCompetencyRepo.GetByProgram(program)
	if err != nil {
		return fmt.Errorf("failed to get gap competencies: %w", err)
	}

	if len(gapCompetencies) == 0 {
		return fmt.Errorf("no gap competencies found for program %s", program)
	}

	// Clear existing schedules for this program
	if err := s.trainingScheduleRepo.DeleteByProgram(program); err != nil {
		return fmt.Errorf("failed to clear existing schedules: %w", err)
	}

	// Calculate gap statistics and categories
	gapStats := s.calculateGapStatistics(gapCompetencies)

	// Generate schedules using the complex scheduling algorithm
	schedules, err := s.generateOptimalSchedule(program, gapStats, minDeadlineMonths)
	if err != nil {
		return fmt.Errorf("failed to generate optimal schedule: %w", err)
	}

	// Save schedules to database
	if err := s.trainingScheduleRepo.CreateBatch(schedules); err != nil {
		return fmt.Errorf("failed to save schedules: %w", err)
	}

	s.log.WithFields(logrus.Fields{
		"program":         program,
		"schedules_count": len(schedules),
		"deadline_months": minDeadlineMonths,
	}).Info("Successfully generated training schedules")

	return nil
}

// calculateGapStatistics analyzes gap data to determine categories and participant overlaps
func (s *trainingPlanService) calculateGapStatistics(gapCompetencies []domain.GapCompetency) map[string]interface{} {
	// Group gaps by report ID to get unique participants
	reportGaps := make(map[int][]domain.GapCompetency)
	for _, gc := range gapCompetencies {
		reportGaps[gc.ReportID] = append(reportGaps[gc.ReportID], gc)
	}

	totalParticipants := len(reportGaps)
	competencyCodes := []string{"LDC", "DCM", "CIO", "SIO", "FLX", "LAG", "RSC", "CSO", "COM", "EMP", "TOR", "LDP", "PNO", "DIR", "ACH", "ACT", "IDS", "CFO", "RBG", "ING", "RSF", "BAC"}

	gapCounts := make(map[string]int)
	categories := make(map[string]string)
	participantGaps := make(map[int][]string) // participant index -> list of gaps

	// Initialize counts
	for _, code := range competencyCodes {
		gapCounts[code] = 0
	}

	// Count gaps and track participant gaps
	participantIndex := 0
	for _, gaps := range reportGaps {
		var participantGapList []string

		// Count each competency type for this participant
		for _, gap := range gaps {
			if gap.CompetencyType != nil {
				code := gap.CompetencyType.Code
				gapCounts[code]++
				participantGapList = append(participantGapList, code)
			}
		}
		participantGaps[participantIndex] = participantGapList
		participantIndex++
	}

	// Determine categories
	for code, count := range gapCounts {
		percentage := float64(count) / float64(totalParticipants) * 100
		if percentage > 60 {
			categories[code] = "M"
		} else {
			categories[code] = "NM"
		}
	}

	return map[string]interface{}{
		"gapCounts":         gapCounts,
		"categories":        categories,
		"participantGaps":   participantGaps,
		"totalParticipants": totalParticipants,
	}
}

// generateOptimalSchedule implements the complex scheduling algorithm with deadline constraint
// Uses smart randomization with retry mechanism to ensure constraints are met
func (s *trainingPlanService) generateOptimalSchedule(program string, gapStats map[string]interface{}, deadlineMonths int) ([]domain.TrainingSchedule, error) {
	categories := gapStats["categories"].(map[string]string)
	participantGaps := gapStats["participantGaps"].(map[int][]string)
	competencyMapping := s.GetCompetencyMapping(program)

	// Start date: October 1, 2025 (minggu I bulan Oktober)
	startDate := time.Date(2025, 10, 1, 0, 0, 0, 0, time.UTC)

	// Calculate deadline date based on minimum total_readiness_update_months
	deadlineDate := startDate.AddDate(0, deadlineMonths, 0) // Add months directly

	s.log.WithFields(logrus.Fields{
		"program":        program,
		"start_date":     startDate.Format("2006-01-02"),
		"deadline_months": deadlineMonths,
		"deadline_date":   deadlineDate.Format("2006-01-02"),
	}).Info("Scheduling with deadline constraint")

	// Separate mandatory and non-mandatory competencies
	var mandatoryCompetencies []string
	var nonMandatoryCompetencies []string

	for code, category := range categories {
		if _, exists := competencyMapping[code]; exists {
			if category == "M" {
				mandatoryCompetencies = append(mandatoryCompetencies, code)
			} else {
				nonMandatoryCompetencies = append(nonMandatoryCompetencies, code)
			}
		}
	}

	// Try generating schedules with randomization up to 10 attempts
	maxAttempts := 10
	for attempt := 1; attempt <= maxAttempts; attempt++ {
		schedules, err := s.tryGenerateSchedules(
			mandatoryCompetencies,
			nonMandatoryCompetencies,
			categories,
			participantGaps,
			competencyMapping,
			program,
			startDate,
			deadlineDate,
			deadlineMonths,
			attempt,
		)
		
		if err == nil {
			// Success! Schedules generated without constraint violations
			s.log.WithFields(logrus.Fields{
				"attempt": attempt,
				"schedules_count": len(schedules),
			}).Info("Successfully generated schedules with randomization")
			return schedules, nil
		}

		// Log the failed attempt
		s.log.WithFields(logrus.Fields{
			"attempt": attempt,
			"error":   err.Error(),
		}).Warn("Schedule generation attempt failed, retrying with new randomization")
	}

	// After max attempts, return error
	return nil, fmt.Errorf("failed to generate valid schedules after %d attempts - deadline constraint too tight for %d Mandatory competencies within %d months", 
		maxAttempts, len(mandatoryCompetencies), deadlineMonths)
}

// tryGenerateSchedules attempts to generate schedules with 100% randomization
// All materials (M1, M2, NM1, NM2) are scheduled randomly together
func (s *trainingPlanService) tryGenerateSchedules(
	mandatoryCompetencies []string,
	nonMandatoryCompetencies []string,
	categories map[string]string,
	participantGaps map[int][]string,
	competencyMapping map[string]domain.CompetencyMappingItem,
	program string,
	startDate time.Time,
	deadlineDate time.Time,
	deadlineMonths int,
	attempt int,
) ([]domain.TrainingSchedule, error) {
	
	var schedules []domain.TrainingSchedule
	usedDates := make(map[string]bool)
	
	// SIMPLIFIED APPROACH: Schedule all M1 first, then all M2 in random order
	// This ensures M1 always comes before M2 while maintaining randomness
	
	// Randomize Mandatory and Non-Mandatory separately
	mandatoryCopy := make([]string, len(mandatoryCompetencies))
	copy(mandatoryCopy, mandatoryCompetencies)
	rand.Shuffle(len(mandatoryCopy), func(i, j int) {
		mandatoryCopy[i], mandatoryCopy[j] = mandatoryCopy[j], mandatoryCopy[i]
	})
	
	nonMandatoryCopy := make([]string, len(nonMandatoryCompetencies))
	copy(nonMandatoryCopy, nonMandatoryCompetencies)
	rand.Shuffle(len(nonMandatoryCopy), func(i, j int) {
		nonMandatoryCopy[i], nonMandatoryCopy[j] = nonMandatoryCopy[j], nonMandatoryCopy[i]
	})
	
	// Combine: Mandatory first (to ensure deadline compliance), then Non-Mandatory
	// But within each category, order is RANDOM
	allCompetencies := append(mandatoryCopy, nonMandatoryCopy...)
	
	// Track Materi 1 dates for 60-day gap validation
	materi1Dates := make(map[string]time.Time)
	currentDate := startDate
	
	// PHASE 1: Schedule ALL Materi 1 in random order
	s.log.WithFields(logrus.Fields{
		"attempt": attempt,
		"phase":   "Materi 1",
		"count":   len(allCompetencies),
	}).Debug("Starting Materi 1 scheduling")
	
	for _, code := range allCompetencies {
		scheduleDate := s.findNextAvailableDate(currentDate, usedDates, participantGaps, code, categories)

		// Get training topic
		trainingTopic := ""
		if mapping, exists := competencyMapping[code]; exists && len(mapping.TrainingTopics) > 0 {
			trainingTopic = mapping.TrainingTopics[0]
		}

		schedule := domain.TrainingSchedule{
			Program:        program,
			CompetencyCode: code,
			TrainingTopic:  trainingTopic,
			MaterialType:   1,
			ScheduledDate:  scheduleDate,
		}
		schedules = append(schedules, schedule)

		// Track Materi 1 dates
		materi1Dates[code] = scheduleDate

		dateKey := scheduleDate.Format("2006-01-02")
		usedDates[dateKey] = true
		currentDate = nextWeekSlotStart(scheduleDate)
	}
	
	// PHASE 2: Schedule ALL Materi 2 in random order (same random order as M1)
	s.log.WithFields(logrus.Fields{
		"attempt": attempt,
		"phase":   "Materi 2",
		"count":   len(allCompetencies),
	}).Debug("Starting Materi 2 scheduling")
	
	for _, code := range allCompetencies {
		// Get M1 date and calculate minimum M2 date (M1 + 60 days)
		materi1Date := materi1Dates[code]
		minM2Date := materi1Date.AddDate(0, 0, 60)
		
		// Find next available date after minimum
		scheduleDate := s.findNextAvailableDate(minM2Date, usedDates, participantGaps, code, categories)
		
		// Check deadline for Mandatory
		if categories[code] == "M" && scheduleDate.After(deadlineDate) {
			s.log.WithFields(logrus.Fields{
				"attempt":    attempt,
				"competency": code,
				"m1_date":    materi1Date.Format("2006-01-02"),
				"m2_date":    scheduleDate.Format("2006-01-02"),
				"deadline":   deadlineDate.Format("2006-01-02"),
			}).Debug("Mandatory M2 exceeds deadline")
			return nil, fmt.Errorf("mandatory competency %s materi 2 would exceed deadline", code)
		}
		
		// Get training topic
		trainingTopic := ""
		if mapping, exists := competencyMapping[code]; exists && len(mapping.TrainingTopics) > 1 {
			trainingTopic = mapping.TrainingTopics[1]
		}
		
		schedule := domain.TrainingSchedule{
			Program:        program,
			CompetencyCode: code,
			TrainingTopic:  trainingTopic,
			MaterialType:   2,
			ScheduledDate:  scheduleDate,
		}
		schedules = append(schedules, schedule)
		
		dateKey := scheduleDate.Format("2006-01-02")
		usedDates[dateKey] = true
	}

	return schedules, nil
}

// findNextAvailableDate finds the next available date that meets all constraints
func (s *trainingPlanService) findNextAvailableDate(startDate time.Time, usedDates map[string]bool, participantGaps map[int][]string, competencyCode string, categories map[string]string) time.Time {
	currentDate := alignToWeekSlotStart(startDate)

	maxIterations := 52 * 3 // Batas 3 tahun dalam unit minggu
	iterations := 0

	for iterations < maxIterations {
		// Hanya izinkan tanggal pada awal slot minggu (1, 8, 15, 22)
		if isWeekSlotStart(currentDate.Day()) {
			dateKey := currentDate.Format("2006-01-02")

			if !usedDates[dateKey] {
				if !s.hasParticipantConflict(currentDate, competencyCode, categories, participantGaps, usedDates) {
					return currentDate
				}
			}
		}

		// Loncat ke slot minggu berikutnya
		currentDate = nextWeekSlotStart(currentDate)
		iterations++
	}

	// Fallback jika tidak ditemukan
	s.log.Warn("Could not find optimal weekly slot, using fallback")
	return alignToWeekSlotStart(startDate)
}

// Helper untuk penjadwalan berbasis slot minggu per bulan
func isWeekSlotStart(day int) bool {
	return day == 1 || day == 8 || day == 15 || day == 22
}

func alignToWeekSlotStart(date time.Time) time.Time {
	day := date.Day()
	switch {
	case day <= 1:
		return time.Date(date.Year(), date.Month(), 1, 0, 0, 0, 0, time.UTC)
	case day <= 8:
		return time.Date(date.Year(), date.Month(), 8, 0, 0, 0, 0, time.UTC)
	case day <= 15:
		return time.Date(date.Year(), date.Month(), 15, 0, 0, 0, 0, time.UTC)
	case day <= 22:
		return time.Date(date.Year(), date.Month(), 22, 0, 0, 0, 0, time.UTC)
	default:
		// ke minggu I bulan berikutnya
		nextMonth := date.Month() + 1
		year := date.Year()
		if nextMonth > 12 {
			nextMonth = 1
			year++
		}
		return time.Date(year, nextMonth, 1, 0, 0, 0, 0, time.UTC)
	}
}

func nextWeekSlotStart(date time.Time) time.Time {
	day := date.Day()
	switch {
	case day < 8:
		return time.Date(date.Year(), date.Month(), 8, 0, 0, 0, 0, time.UTC)
	case day < 15:
		return time.Date(date.Year(), date.Month(), 15, 0, 0, 0, 0, time.UTC)
	case day < 22:
		return time.Date(date.Year(), date.Month(), 22, 0, 0, 0, 0, time.UTC)
	default:
		// minggu I bulan berikutnya
		nextMonth := date.Month() + 1
		year := date.Year()
		if nextMonth > 12 {
			nextMonth = 1
			year++
		}
		return time.Date(year, nextMonth, 1, 0, 0, 0, 0, time.UTC)
	}
}

// hasParticipantConflict checks if scheduling this competency on this date would cause participant conflicts
func (s *trainingPlanService) hasParticipantConflict(date time.Time, competencyCode string, categories map[string]string, participantGaps map[int][]string, usedDates map[string]bool) bool {
	dateKey := date.Format("2006-01-02")
	category := categories[competencyCode]

	// Check if this date is already used
	if usedDates[dateKey] {
		// Get participants who need this competency
		currentParticipants := make(map[int]bool)

		if category == "M" {
			// Mandatory: ALL participants must attend
			for participantID := range participantGaps {
				currentParticipants[participantID] = true
			}
		} else {
			// Non-Mandatory: Only participants with this gap attend
			for participantID, gaps := range participantGaps {
				for _, gap := range gaps {
					if gap == competencyCode {
						currentParticipants[participantID] = true
						break
					}
				}
			}
		}

		// Check if any participant would have a conflict
		// This is a simplified check - in a real implementation, you would need to:
		// 1. Track which specific competencies are scheduled on which dates
		// 2. Check for participant overlaps between different competencies on the same date
		// 3. Ensure mandatory trainings don't conflict with non-mandatory ones

		// For now, we prevent scheduling multiple competencies on the same date
		// if they would have overlapping participants
		if len(currentParticipants) > 0 {
			return true // Conflict detected
		}
	}

	return false // No conflict
}

// generateMateri2Schedules is now deprecated - Materi 2 scheduling is done in tryGenerateSchedules
// Kept for backward compatibility but no longer used
func (s *trainingPlanService) generateMateri2Schedules(schedules *[]domain.TrainingSchedule, mandatoryCompetencies, nonMandatoryCompetencies []string, competencyMapping map[string]domain.CompetencyMappingItem, program string, usedDates map[string]bool, participantGaps map[int][]string, categories map[string]string, deadlineDate time.Time) error {
	
	// Schedule Mandatory Materi 2
	// Each Materi 2 only needs to wait for its own Materi 1 + 60 days
	// No need to wait for all other Mandatory Materi 1 to complete
	for _, code := range mandatoryCompetencies {
		// Find the Materi 1 date for this competency to ensure 60-day gap
		var materi1Date time.Time
		for _, schedule := range *schedules {
			if schedule.CompetencyCode == code && schedule.MaterialType == 1 {
				materi1Date = schedule.ScheduledDate
				break
			}
		}

		// Start Materi 2 at minimum 60 days after this competency's Materi 1
		minMateri2Date := materi1Date.AddDate(0, 0, 60)
		scheduleDate := s.findNextAvailableDate(minMateri2Date, usedDates, participantGaps, code, categories)

		// Validate Mandatory Materi 2 doesn't exceed deadline
		if scheduleDate.After(deadlineDate) {
			s.log.WithFields(logrus.Fields{
				"competency":    code,
				"material":      "Materi 2 (M)",
				"schedule_date": scheduleDate.Format("2006-01-02"),
				"deadline_date": deadlineDate.Format("2006-01-02"),
			}).Error("Mandatory Materi 2 schedule exceeds deadline")
			return fmt.Errorf("cannot schedule Mandatory Materi 2 for %s within deadline - schedule date %s exceeds deadline %s",
				code, scheduleDate.Format("2006-01-02"), deadlineDate.Format("2006-01-02"))
		}

		// Get training material 2 for this competency and program
		trainingTopic := ""
		if mapping, exists := competencyMapping[code]; exists && len(mapping.TrainingTopics) > 1 {
			trainingTopic = mapping.TrainingTopics[1] // Material 2
		}

		schedule := domain.TrainingSchedule{
			Program:        program,
			CompetencyCode: code,
			TrainingTopic:  trainingTopic,
			MaterialType:   2,
			ScheduledDate:  scheduleDate,
		}
		*schedules = append(*schedules, schedule)

		dateKey := scheduleDate.Format("2006-01-02")
		usedDates[dateKey] = true
	}

	// Schedule Non-Mandatory Materi 2
	// Each Materi 2 only needs to wait for its own Materi 1 + 60 days
	// No need to wait for all other Non-Mandatory Materi 1 to complete
	for _, code := range nonMandatoryCompetencies {
		// Find the Materi 1 date for this competency to ensure 60-day gap
		var materi1Date time.Time
		for _, schedule := range *schedules {
			if schedule.CompetencyCode == code && schedule.MaterialType == 1 {
				materi1Date = schedule.ScheduledDate
				break
			}
		}

		// Start Materi 2 at minimum 60 days after this competency's Materi 1
		minMateri2Date := materi1Date.AddDate(0, 0, 60)
		scheduleDate := s.findNextAvailableDate(minMateri2Date, usedDates, participantGaps, code, categories)

		// NO deadline check for Non-Mandatory (NM) Materi 2
		// Deadline hanya berlaku untuk Mandatory (M)

		// Get training material 2 for this competency and program
		trainingTopic := ""
		if mapping, exists := competencyMapping[code]; exists && len(mapping.TrainingTopics) > 1 {
			trainingTopic = mapping.TrainingTopics[1] // Material 2
		}

		schedule := domain.TrainingSchedule{
			Program:        program,
			CompetencyCode: code,
			TrainingTopic:  trainingTopic,
			MaterialType:   2,
			ScheduledDate:  scheduleDate,
		}
		*schedules = append(*schedules, schedule)

		dateKey := scheduleDate.Format("2006-01-02")
		usedDates[dateKey] = true
	}

	return nil
}

func (s *trainingPlanService) UpdateScheduledDate(id int, newDate time.Time) error {
	return s.trainingScheduleRepo.UpdateScheduledDate(id, newDate)
}
