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
		AssessmentResults  int64 `json:"assessment_results"`
		UserAnswers        int64 `json:"user_answers"`
		CoachingReports    int64 `json:"coaching_reports"`
		MentoringReports   int64 `json:"mentoring_reports"`
		TrainingSchedules  int64 `json:"training_schedules"`
	}

	s.DB.Table("reports").Count(&stats.Reports)
	s.DB.Table("idp_tracking").Count(&stats.IDPTracking)
	s.DB.Table("gap_competencies").Count(&stats.GapCompetencies)
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
		Reports           int64 `json:"reports"`
		ReportScores      int64 `json:"reportScores"`
		IDPTracking       int64 `json:"idpTracking"`
		GapCompetencies   int64 `json:"gapCompetencies"`
		AssessmentResults int64 `json:"assessmentResults"`
		UserAnswers       int64 `json:"userAnswers"`
	}

	tx.Table("reports").Count(&deletedCounts.Reports)
	tx.Table("report_scores").Count(&deletedCounts.ReportScores)
	tx.Table("idp_tracking").Count(&deletedCounts.IDPTracking)
	tx.Table("gap_competencies").Count(&deletedCounts.GapCompetencies)
	tx.Table("assessment_results").Count(&deletedCounts.AssessmentResults)
	tx.Table("user_answers").Count(&deletedCounts.UserAnswers)

	if err := tx.Exec("DELETE FROM user_answers").Error; err != nil {
		tx.Rollback()
		s.Log.Errorf("Failed to delete user_answers: %v", err)
		return nil, fmt.Errorf("failed to delete user_answers: %w", err)
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
		"reports_deleted":            deletedCounts.Reports,
		"report_scores_deleted":      deletedCounts.ReportScores,
		"idp_tracking_deleted":       deletedCounts.IDPTracking,
		"gap_competencies_deleted":   deletedCounts.GapCompetencies,
		"assessment_results_deleted": deletedCounts.AssessmentResults,
		"user_answers_deleted":       deletedCounts.UserAnswers,
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
	var count int64
	s.DB.Table("assessment_results").Count(&count)

	if err := s.DB.Exec("DELETE FROM assessment_results").Error; err != nil {
		s.Log.Errorf("Failed to delete assessment results: %v", err)
		return nil, fmt.Errorf("failed to delete assessment results: %w", err)
	}

	s.Log.WithField("records_deleted", count).Info("Successfully deleted all assessment results")

	return &web.SuccessResponse{
		Code:   http.StatusOK,
		Status: "OK",
		Data: map[string]interface{}{
			"message":        "All assessment results deleted successfully",
			"deletedRecords": count,
		},
	}, nil
}
