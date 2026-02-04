package services

import (
	"fmt"
	"net/http"

	"backend/internal/models/web"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type AdminService struct {
	DB  *gorm.DB
	Log *logrus.Logger
}

func NewAdminService(db *gorm.DB, log *logrus.Logger) *AdminService {
	return &AdminService{
		DB:  db,
		Log: log,
	}
}

func (s *AdminService) GetDataStatistics() (*web.SuccessResponse, error) {
	var stats struct {
		Reports            int64 `json:"reports"`
		IDPTracking        int64 `json:"idp_tracking"`
		GapCompetencies    int64 `json:"gap_competencies"`
		ScoreResults       int64 `json:"score_results"`
		AssessmentResults  int64 `json:"assessment_results"`
		UserAnswers        int64 `json:"user_answers"`
		CoachingReports    int64 `json:"coaching_reports"`
		MentoringReports   int64 `json:"mentoring_reports"`
		TrainingSchedules  int64 `json:"training_schedules"`
	}

	s.DB.Table("reports").Count(&stats.Reports)
	s.DB.Table("idp_tracking").Count(&stats.IDPTracking)
	s.DB.Table("gap_competencies").Count(&stats.GapCompetencies)
	s.DB.Table("score_results").Count(&stats.ScoreResults)
	s.DB.Table("assessment_results").Count(&stats.AssessmentResults)
	s.DB.Table("user_answers").Count(&stats.UserAnswers)
	s.DB.Table("coaching_reports").Count(&stats.CoachingReports)
	s.DB.Table("mentoring_reports").Count(&stats.MentoringReports)
	s.DB.Table("training_schedules").Count(&stats.TrainingSchedules)

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data:   stats,
	}, nil
}

func (s *AdminService) DeleteAllReports() (*web.SuccessResponse, error) {
	tx := s.DB.Begin()
	if tx.Error != nil {
		s.Log.Errorf("Failed to begin transaction: %v", tx.Error)
		return nil, tx.Error
	}

	var deletedCounts struct {
		Reports                  int64 `json:"reports"`
		ReportScores             int64 `json:"reportScores"`
		IDPTracking              int64 `json:"idpTracking"`
		GapCompetencies          int64 `json:"gapCompetencies"`
		ScoreResults             int64 `json:"scoreResults"`
		AssessmentResults        int64 `json:"assessmentResults"`
		UserAnswers              int64 `json:"userAnswers"`
		CoachingReports          int64 `json:"coachingReports"`
		MentoringReports         int64 `json:"mentoringReports"`
		MentoringReportRelations int64 `json:"mentoringReportRelations"`
	}

	tx.Table("reports").Count(&deletedCounts.Reports)
	tx.Table("report_scores").Count(&deletedCounts.ReportScores)
	tx.Table("idp_tracking").Count(&deletedCounts.IDPTracking)
	tx.Table("gap_competencies").Count(&deletedCounts.GapCompetencies)
	tx.Table("score_results").Count(&deletedCounts.ScoreResults)
	tx.Table("assessment_results").Count(&deletedCounts.AssessmentResults)
	tx.Table("user_answers").Count(&deletedCounts.UserAnswers)
	tx.Table("coaching_reports").Count(&deletedCounts.CoachingReports)
	tx.Table("mentoring_reports").Count(&deletedCounts.MentoringReports)
	tx.Table("mentoring_report_relations").Count(&deletedCounts.MentoringReportRelations)

	if err := tx.Exec("DELETE FROM user_answers").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete user_answers: %v", err)
		return nil, fmt.Errorf("failed to delete user_answers: %w", err)
	}

	if err := tx.Exec("DELETE FROM score_results").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete score_results: %v", err)
		return nil, fmt.Errorf("failed to delete score_results: %w", err)
	}

	if err := tx.Exec("DELETE FROM assessment_results").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete assessment_results: %v", err)
		return nil, fmt.Errorf("failed to delete assessment_results: %w", err)
	}

	if err := tx.Exec("DELETE FROM idp_tracking").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete idp_tracking: %v", err)
		return nil, fmt.Errorf("failed to delete idp_tracking: %w", err)
	}

	if err := tx.Exec("DELETE FROM gap_competencies").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete gap_competencies: %v", err)
		return nil, fmt.Errorf("failed to delete gap_competencies: %w", err)
	}

	if err := tx.Exec("DELETE FROM coaching_reports").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete coaching_reports: %v", err)
		return nil, fmt.Errorf("failed to delete coaching_reports: %w", err)
	}

	if err := tx.Exec("DELETE FROM mentoring_report_relations").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete mentoring_report_relations: %v", err)
		return nil, fmt.Errorf("failed to delete mentoring_report_relations: %w", err)
	}

	if err := tx.Exec("DELETE FROM mentoring_reports").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete mentoring_reports: %v", err)
		return nil, fmt.Errorf("failed to delete mentoring_reports: %w", err)
	}

	if err := tx.Exec("DELETE FROM report_scores").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete report_scores: %v", err)
		return nil, fmt.Errorf("failed to delete report_scores: %w", err)
	}

	if err := tx.Exec("DELETE FROM reports").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete reports: %v", err)
		return nil, fmt.Errorf("failed to delete reports: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		s.Log.Errorf("Failed to commit transaction: %v", err)
		return nil, err
	}

	s.Log.WithFields(logrus.Fields{
		"reports_deleted":                     deletedCounts.Reports,
		"report_scores_deleted":               deletedCounts.ReportScores,
		"idp_tracking_deleted":                deletedCounts.IDPTracking,
		"gap_competencies_deleted":            deletedCounts.GapCompetencies,
		"score_results_deleted":               deletedCounts.ScoreResults,
		"assessment_results_deleted":          deletedCounts.AssessmentResults,
		"user_answers_deleted":                deletedCounts.UserAnswers,
		"coaching_reports_deleted":            deletedCounts.CoachingReports,
		"mentoring_reports_deleted":           deletedCounts.MentoringReports,
		"mentoring_report_relations_deleted": deletedCounts.MentoringReportRelations,
	}).Info("Successfully deleted all reports and related data")

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data: map[string]interface{}{
			"message":        "All reports and related data deleted successfully",
			"deletedRecords": deletedCounts,
		},
	}, nil
}

func (s *AdminService) DeleteAllIDPTracking() (*web.SuccessResponse, error) {
	var count int64
	s.DB.Table("idp_tracking").Count(&count)

	if err := s.DB.Exec("DELETE FROM idp_tracking").Error; err != nil {
		s.Log.Errorf("Failed to delete IDP tracking: %v", err)
		return nil, fmt.Errorf("failed to delete IDP tracking: %w", err)
	}

	s.Log.WithField("records_deleted", count).Info("Successfully deleted all IDP tracking records")

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data: map[string]interface{}{
			"message":        "All IDP tracking records deleted successfully",
			"deletedRecords": count,
		},
	}, nil
}

func (s *AdminService) DeleteAllAssessmentResults() (*web.SuccessResponse, error) {
	tx := s.DB.Begin()
	if tx.Error != nil {
		s.Log.Errorf("Failed to begin transaction: %v", tx.Error)
		return nil, tx.Error
	}

	var deletedCounts struct {
		ScoreResults      int64 `json:"scoreResults"`
		AssessmentResults int64 `json:"assessmentResults"`
	}

	tx.Table("score_results").Count(&deletedCounts.ScoreResults)
	tx.Table("assessment_results").Count(&deletedCounts.AssessmentResults)

	// Delete score_results first (child table)
	if err := tx.Exec("DELETE FROM score_results").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete score_results: %v", err)
		return nil, fmt.Errorf("failed to delete score_results: %w", err)
	}

	// Then delete assessment_results (parent table)
	if err := tx.Exec("DELETE FROM assessment_results").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete assessment_results: %v", err)
		return nil, fmt.Errorf("failed to delete assessment_results: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		s.Log.Errorf("Failed to commit transaction: %v", err)
		return nil, err
	}

	s.Log.WithFields(logrus.Fields{
		"score_results_deleted":      deletedCounts.ScoreResults,
		"assessment_results_deleted": deletedCounts.AssessmentResults,
	}).Info("Successfully deleted all assessment results and score results")

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data: map[string]interface{}{
			"message":        "All assessment results and score results deleted successfully",
			"deletedRecords": deletedCounts,
		},
	}, nil
}
