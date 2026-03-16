package services

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"math"
	"strconv"
	"strings"
	"time"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

type NewRecruiterService interface {
	FindAll(db *gorm.DB, req *web.NewRecruiterListRequest) (web.NewRecruiterListResponse, error)
	Search(db *gorm.DB, req *web.NewRecruiterSearchRequest) (web.NewRecruiterSearchResponse, error)
	Create(db *gorm.DB, req *web.NewRecruiterCreateRequest) (web.NewRecruiterData, error)
	Update(db *gorm.DB, id uint64, req *web.NewRecruiterUpdateRequest) (web.NewRecruiterData, error)
	BulkAssignBatch(db *gorm.DB, req *web.NewRecruiterBulkAssignBatchRequest) error
	Delete(db *gorm.DB, id uint64) error
	FindAssignments(db *gorm.DB, req *web.NewRecruiterAssignmentListRequest) (web.NewRecruiterAssignmentListResponse, error)
	CreateAssignment(db *gorm.DB, req *web.NewRecruiterAssignmentCreateRequest) (web.NewRecruiterAssignmentData, error)
	DeleteAssignment(db *gorm.DB, id uint64) error
	CheckAssignment(db *gorm.DB, token string, assessmentTypeID uint64) (web.NewRecruiterAssignmentCheckResponse, error)
	CheckAssignmentWithRole(db *gorm.DB, token string, assessmentTypeID uint64, role string) (web.NewRecruiterAssignmentCheckResponse, error)
	IncrementAttempts(db *gorm.DB, token string, assessmentTypeID uint64) (web.NewRecruiterAssignmentData, error)
	SubmitAssessment(db *gorm.DB, req *web.NewRecruiterAssessmentSubmitRequest) (map[string]any, error)
	SubmitQuiz(db *gorm.DB, req *web.NewRecruiterQuizSubmitRequest) (web.NewRecruiterQuizAttemptResponse, error)
}

type newRecruiterServiceImpl struct {
	Repo     repositories.NewRecruiterRepository
	Validate *validator.Validate
}

func NewNewRecruiterService(repo repositories.NewRecruiterRepository, validate *validator.Validate) NewRecruiterService {
	return &newRecruiterServiceImpl{Repo: repo, Validate: validate}
}

func (s *newRecruiterServiceImpl) FindAll(
	db *gorm.DB,
	req *web.NewRecruiterListRequest,
) (web.NewRecruiterListResponse, error) {
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}
	page := req.Page
	if page != "prev" {
		page = "next"
	}

	rows, err := s.Repo.FindPage(db, req.Query, req.BatchID, req.AnchorID, page, pageSize)
	if err != nil {
		return web.NewRecruiterListResponse{}, err
	}
	total, err := s.Repo.Count(db, req.Query, req.BatchID)
	if err != nil {
		return web.NewRecruiterListResponse{}, err
	}

	hasMore := len(rows) > pageSize
	if hasMore {
		if page == "prev" {
			rows = rows[1:]
		} else {
			rows = rows[:pageSize]
		}
	}

	reportScoresByRecruiter, err := s.getRecruiterReportScores(db)
	if err != nil {
		return web.NewRecruiterListResponse{}, err
	}

	out := make([]web.NewRecruiterData, 0, len(rows))
	var firstID *uint64
	var lastID *uint64
	for idx, row := range rows {
		mapped := mapNewRecruiter(row)
		mapped.ReportScores = reportScoresByRecruiter[row.ID]
		out = append(out, mapped)
		if idx == 0 {
			id := row.ID
			firstID = &id
		}
		id := row.ID
		lastID = &id
	}

	firstPage := page != "prev" && (req.AnchorID == nil || *req.AnchorID == 0)
	return web.NewRecruiterListResponse{
		Data:      out,
		FirstID:   firstID,
		LastID:    lastID,
		PageSize:  pageSize,
		HasMore:   hasMore,
		FirstPage: firstPage,
		Total:     total,
	}, nil
}

func (s *newRecruiterServiceImpl) Search(
	db *gorm.DB,
	req *web.NewRecruiterSearchRequest,
) (web.NewRecruiterSearchResponse, error) {
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 50 {
		pageSize = 50
	}

	rows, err := s.Repo.Search(db, req.Query, req.BatchID, req.CursorID, pageSize)
	if err != nil {
		return web.NewRecruiterSearchResponse{}, err
	}

	hasMore := len(rows) > pageSize
	if hasMore {
		rows = rows[:pageSize]
	}

	out := make([]web.NewRecruiterData, 0, len(rows))
	var lastID *uint64
	for _, row := range rows {
		mapped := mapNewRecruiter(row)
		out = append(out, mapped)
		lastID = &row.ID
	}

	return web.NewRecruiterSearchResponse{
		Data:    out,
		LastID:  lastID,
		HasMore: hasMore,
	}, nil
}

func (s *newRecruiterServiceImpl) Create(db *gorm.DB, req *web.NewRecruiterCreateRequest) (web.NewRecruiterData, error) {
	if err := s.Validate.Struct(req); err != nil {
		return web.NewRecruiterData{}, err
	}
	if err := s.ensureRecruiterBatch(db, req.BatchID); err != nil {
		return web.NewRecruiterData{}, err
	}
	data := domain.NewRecruiter{
		Nama:         req.Nama,
		SeafarerCode: req.SeafarerCode,
		Rank:         req.Rank,
		AcademyName:  req.AcademyName,
		BatchID:      req.BatchID,
		Phone:        req.Phone,
		Email:        req.Email,
	}
	if err := s.Repo.Create(db, &data); err != nil {
		return web.NewRecruiterData{}, err
	}
	return mapNewRecruiter(data), nil
}

func (s *newRecruiterServiceImpl) Update(db *gorm.DB, id uint64, req *web.NewRecruiterUpdateRequest) (web.NewRecruiterData, error) {
	if err := s.Validate.Struct(req); err != nil {
		return web.NewRecruiterData{}, err
	}
	if err := s.ensureRecruiterBatch(db, req.BatchID); err != nil {
		return web.NewRecruiterData{}, err
	}
	data, err := s.Repo.FindByID(db, id)
	if err != nil {
		return web.NewRecruiterData{}, err
	}
	data.Nama = req.Nama
	data.SeafarerCode = req.SeafarerCode
	data.Rank = req.Rank
	data.AcademyName = req.AcademyName
	data.BatchID = req.BatchID
	data.Phone = req.Phone
	data.Email = req.Email
	if err := s.Repo.Update(db, &data); err != nil {
		return web.NewRecruiterData{}, err
	}
	return mapNewRecruiter(data), nil
}

func (s *newRecruiterServiceImpl) BulkAssignBatch(db *gorm.DB, req *web.NewRecruiterBulkAssignBatchRequest) error {
	if err := s.Validate.Struct(req); err != nil {
		return err
	}
	if err := s.ensureRecruiterBatch(db, req.BatchID); err != nil {
		return err
	}
	return s.Repo.BulkAssignBatch(db, req.NewRecruiterIDs, req.BatchID)
}

func (s *newRecruiterServiceImpl) Delete(db *gorm.DB, id uint64) error {
	return s.Repo.Delete(db, id)
}

func (s *newRecruiterServiceImpl) FindAssignments(
	db *gorm.DB,
	req *web.NewRecruiterAssignmentListRequest,
) (web.NewRecruiterAssignmentListResponse, error) {
	pageSize := req.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}
	if pageSize > 100 {
		pageSize = 100
	}
	page := req.Page
	if page != "prev" {
		page = "next"
	}

	rows, err := s.Repo.FindAssignmentsPage(db, req.Query, req.BatchID, req.AnchorID, page, pageSize)
	if err != nil {
		return web.NewRecruiterAssignmentListResponse{}, err
	}
	total, err := s.Repo.CountAssignments(db, req.Query, req.BatchID)
	if err != nil {
		return web.NewRecruiterAssignmentListResponse{}, err
	}

	hasMore := len(rows) > pageSize
	if hasMore {
		if page == "prev" {
			rows = rows[1:]
		} else {
			rows = rows[:pageSize]
		}
	}

	reportScoresByAssignment, err := s.getAssignmentReportScores(db)
	if err != nil {
		return web.NewRecruiterAssignmentListResponse{}, err
	}

	out := make([]web.NewRecruiterAssignmentData, 0, len(rows))
	var firstID *uint64
	var lastID *uint64
	for idx, row := range rows {
		out = append(out, mapNewRecruiterAssignment(row, reportScoresByAssignment[assignmentScoreKey(row.NewRecruiterID, row.AssessmentTypeID)]))
		if idx == 0 {
			id := row.ID
			firstID = &id
		}
		id := row.ID
		lastID = &id
	}

	firstPage := page != "prev" && (req.AnchorID == nil || *req.AnchorID == 0)
	return web.NewRecruiterAssignmentListResponse{
		Data:      out,
		FirstID:   firstID,
		LastID:    lastID,
		PageSize:  pageSize,
		HasMore:   hasMore,
		FirstPage: firstPage,
		Total:     total,
	}, nil
}

func (s *newRecruiterServiceImpl) CreateAssignment(db *gorm.DB, req *web.NewRecruiterAssignmentCreateRequest) (web.NewRecruiterAssignmentData, error) {
	if err := s.Validate.Struct(req); err != nil {
		return web.NewRecruiterAssignmentData{}, err
	}
	recruiter, err := s.Repo.FindByID(db, req.NewRecruiterID)
	if err != nil {
		return web.NewRecruiterAssignmentData{}, err
	}
	if recruiter.BatchID == nil {
		return web.NewRecruiterAssignmentData{}, errors.New("new recruiter belum terdaftar pada batch")
	}
	if req.BatchID == nil {
		req.BatchID = recruiter.BatchID
	}
	if req.BatchID != nil {
		var batch domain.Batch
		if err := db.Where("id = ?", *req.BatchID).First(&batch).Error; err != nil {
			return web.NewRecruiterAssignmentData{}, err
		}
		if batch.Type != "new_recruiter" {
			return web.NewRecruiterAssignmentData{}, errors.New("batch type must be new_recruiter")
		}
		if recruiter.BatchID != nil && *recruiter.BatchID != *req.BatchID {
			return web.NewRecruiterAssignmentData{}, errors.New("batch assignment harus sesuai dengan batch recruiter")
		}
	}
	if _, err := s.Repo.FindAssignmentByRecruiterAndAssessment(db, req.NewRecruiterID, req.AssessmentTypeID); err == nil {
		return web.NewRecruiterAssignmentData{}, errors.New("assignment already exists")
	}

	token, err := generateToken()
	if err != nil {
		return web.NewRecruiterAssignmentData{}, err
	}

	data := domain.NewRecruiterAssignment{
		NewRecruiterID:   req.NewRecruiterID,
		AssessmentTypeID: req.AssessmentTypeID,
		BatchID:          req.BatchID,
		Token:            token,
		Status:           "assigned",
	}
	if err := s.Repo.CreateAssignment(db, &data); err != nil {
		return web.NewRecruiterAssignmentData{}, err
	}
	row, err := s.Repo.FindAssignmentByID(db, data.ID)
	if err != nil {
		return web.NewRecruiterAssignmentData{}, err
	}
	return mapNewRecruiterAssignment(row, nil), nil
}

func (s *newRecruiterServiceImpl) DeleteAssignment(db *gorm.DB, id uint64) error {
	return s.Repo.DeleteAssignment(db, id)
}

func (s *newRecruiterServiceImpl) CheckAssignment(db *gorm.DB, token string, assessmentTypeID uint64) (web.NewRecruiterAssignmentCheckResponse, error) {
	assignment, err := s.findValidAssignment(db, token, assessmentTypeID)
	if err != nil {
		return web.NewRecruiterAssignmentCheckResponse{}, err
	}
	return s.buildCheckResponse(db, assignment, "", true), nil
}

func (s *newRecruiterServiceImpl) CheckAssignmentWithRole(db *gorm.DB, token string, assessmentTypeID uint64, role string) (web.NewRecruiterAssignmentCheckResponse, error) {
	assignment, err := s.findValidAssignment(db, token, assessmentTypeID)
	if err != nil {
		return web.NewRecruiterAssignmentCheckResponse{}, err
	}
	return s.buildCheckResponse(db, assignment, role, true), nil
}

func (s *newRecruiterServiceImpl) IncrementAttempts(db *gorm.DB, token string, assessmentTypeID uint64) (web.NewRecruiterAssignmentData, error) {
	assignment, err := s.findValidAssignment(db, token, assessmentTypeID)
	if err != nil {
		return web.NewRecruiterAssignmentData{}, err
	}
	assignment.AttemptsCount++
	if assignment.Status == "assigned" {
		assignment.Status = "in_progress"
	}
	if err := s.Repo.UpdateAssignment(db, &assignment); err != nil {
		return web.NewRecruiterAssignmentData{}, err
	}
	row, err := s.Repo.FindAssignmentByID(db, assignment.ID)
	if err != nil {
		return web.NewRecruiterAssignmentData{}, err
	}
	return mapNewRecruiterAssignment(row, nil), nil
}

func (s *newRecruiterServiceImpl) SubmitAssessment(db *gorm.DB, req *web.NewRecruiterAssessmentSubmitRequest) (map[string]any, error) {
	if err := s.Validate.Struct(req); err != nil {
		return nil, err
	}
	var assessment domain.Assessment
	if err := db.Where("role = ?", req.Role).First(&assessment).Error; err != nil {
		return nil, err
	}

	assignment, err := s.findValidAssignment(db, req.Token, *assessment.AssessTypeID)
	if err != nil {
		return nil, err
	}
	check := s.buildCheckResponse(db, assignment, req.Role, false)
	if !check.IsAssigned {
		return nil, errors.New(check.Message)
	}

	answersJSON, err := json.Marshal(req.Answers)
	if err != nil {
		return nil, err
	}
	submission := domain.NewRecruiterAssessmentSubmission{
		NewRecruiterID:           assignment.NewRecruiterID,
		NewRecruiterAssignmentID: assignment.ID,
		AssessmentID:             assessment.AssessmentID,
		AssessmentTypeID:         *assessment.AssessTypeID,
		Role:                     req.Role,
		AnswersJSON:              string(answersJSON),
	}
	if isFinalAssessmentRole(req.Role) {
		now := time.Now()
		submission.CompletedAt = &now
		assignment.Status = "completed"
		assignment.CompletedAt = &now
	} else {
		assignment.Status = "in_progress"
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := s.Repo.CreateAssessmentSubmission(tx, &submission); err != nil {
			return err
		}
		if err := s.Repo.UpdateAssignment(tx, &assignment); err != nil {
			return err
		}

		finalScore, err := s.calculateAssessmentFinalScore(tx, assessment, req.Answers)
		if err != nil {
			return err
		}

		if assessment.AssessTypeID != nil {
			var assessmentType domain.AssessmentType
			if err := tx.Where("id = ?", *assessment.AssessTypeID).First(&assessmentType).Error; err != nil {
				return err
			}

			scoreToSave := finalScore
			if assessmentType.AssessmentTypeName == "Value Assessment" {
				scoreToSave, err = s.calculateValueAssessmentScore(tx, assignment.NewRecruiterID, *assessment.AssessTypeID)
				if err != nil {
					return err
				}
			}

			if err := s.saveAssessmentReportScore(tx, assignment.NewRecruiterID, *assessment.AssessTypeID, scoreToSave); err != nil {
				return err
			}
		}

		return nil
	}); err != nil {
		return nil, err
	}

	return map[string]any{
		"id":          submission.ID,
		"token":       req.Token,
		"role":        req.Role,
		"submittedAt": submission.SubmittedAt,
	}, nil
}

func (s *newRecruiterServiceImpl) SubmitQuiz(db *gorm.DB, req *web.NewRecruiterQuizSubmitRequest) (web.NewRecruiterQuizAttemptResponse, error) {
	if err := s.Validate.Struct(req); err != nil {
		return web.NewRecruiterQuizAttemptResponse{}, err
	}
	assignment, err := s.findValidAssignment(db, req.Token, req.AssessmentTypeID)
	if err != nil {
		return web.NewRecruiterQuizAttemptResponse{}, err
	}
	check := s.buildCheckResponse(db, assignment, "", false)
	if !check.IsAssigned {
		return web.NewRecruiterQuizAttemptResponse{}, errors.New(check.Message)
	}

	answersJSON, err := json.Marshal(req.Answers)
	if err != nil {
		return web.NewRecruiterQuizAttemptResponse{}, err
	}

	var assessmentType domain.AssessmentType
	if err := db.Where("id = ?", req.AssessmentTypeID).First(&assessmentType).Error; err != nil {
		return web.NewRecruiterQuizAttemptResponse{}, err
	}

	totalScore, maxScore, err := s.calculateQuizAttemptScores(db, req.AssessmentTypeID, req.Answers)
	if err != nil {
		return web.NewRecruiterQuizAttemptResponse{}, err
	}

	attempt := domain.NewRecruiterQuizAttempt{
		NewRecruiterID:           assignment.NewRecruiterID,
		NewRecruiterAssignmentID: assignment.ID,
		AssessmentTypeID:         req.AssessmentTypeID,
		AnswersJSON:              string(answersJSON),
		MaxScore:                 maxScore,
		TotalScore:               totalScore,
	}
	now := time.Now()
	assignment.Status = "completed"
	assignment.CompletedAt = &now

	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := s.Repo.CreateQuizAttempt(tx, &attempt); err != nil {
			return err
		}
		if err := s.Repo.UpdateAssignment(tx, &assignment); err != nil {
			return err
		}

		finalScore, err := calculateDynamicFinalScore(
			attempt.TotalScore,
			attempt.MaxScore,
			assessmentType.ScoringType,
			assessmentType.ScoringFormula,
		)
		if err != nil {
			return err
		}

		return s.saveAssessmentReportScore(tx, assignment.NewRecruiterID, req.AssessmentTypeID, finalScore)
	}); err != nil {
		return web.NewRecruiterQuizAttemptResponse{}, err
	}

	return web.NewRecruiterQuizAttemptResponse{
		ID:                   attempt.ID,
		Token:                req.Token,
		AssessmentTypeID:     req.AssessmentTypeID,
		AssessmentTypeName:   assessmentType.AssessmentTypeName,
		TotalScore:           attempt.TotalScore,
		MaxScore:             attempt.MaxScore,
		PercentageScore:      percentage(attempt.TotalScore, attempt.MaxScore),
		CompletedAt:          attempt.CompletedAt,
		CompletedAtFormatted: attempt.CompletedAt.Format("02 January 2006, 15:04"),
	}, nil
}

func (s *newRecruiterServiceImpl) findValidAssignment(db *gorm.DB, token string, assessmentTypeID uint64) (domain.NewRecruiterAssignment, error) {
	assignment, err := s.Repo.FindAssignmentByToken(db, token)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return domain.NewRecruiterAssignment{}, errors.New("token tidak ditemukan atau tidak valid")
		}
		return domain.NewRecruiterAssignment{}, err
	}
	if assignment.AssessmentTypeID != assessmentTypeID {
		return domain.NewRecruiterAssignment{}, errors.New("token tidak sesuai dengan assessment ini")
	}
	if assignment.Batch != nil && assignment.Batch.Type != "new_recruiter" {
		return domain.NewRecruiterAssignment{}, errors.New("assignment tidak valid untuk batch ini")
	}
	return assignment, nil
}

func (s *newRecruiterServiceImpl) buildCheckResponse(
	db *gorm.DB,
	assignment domain.NewRecruiterAssignment,
	role string,
	enforceAttemptLimit bool,
) web.NewRecruiterAssignmentCheckResponse {
	var assessmentType domain.AssessmentType
	_ = db.Where("id = ?", assignment.AssessmentTypeID).First(&assessmentType).Error

	response := web.NewRecruiterAssignmentCheckResponse{
		IsAssigned:       true,
		Message:          "Token valid",
		Token:            assignment.Token,
		AssessmentTypeID: assignment.AssessmentTypeID,
		AttemptsCount:    assignment.AttemptsCount,
		MaxAttempts:      assessmentType.MaxAttempts,
	}

	if assignment.NewRecruiter != nil {
		response.PersonalData = ptrNewRecruiter(mapNewRecruiter(*assignment.NewRecruiter))
	}

	if enforceAttemptLimit &&
		assessmentType.MaxAttempts != nil &&
		assignment.AttemptsCount >= uint64(*assessmentType.MaxAttempts) {
		response.IsAssigned = false
		response.Message = fmt.Sprintf("Anda sudah melebihi batas maksimal attempts (%d/%d).", assignment.AttemptsCount, *assessmentType.MaxAttempts)
		return response
	}

	if role != "" && !strings.HasPrefix(role, "va_") && assignment.NewRecruiter != nil {
		expected := normalizeRoleRank(role)
		actual := normalizeRoleRank(assignment.NewRecruiter.Rank)
		if expected != actual {
			response.IsAssigned = false
			response.Message = "Rank tidak sesuai dengan role assessment yang dibuka."
			return response
		}
	}

	return response
}

func mapNewRecruiter(data domain.NewRecruiter) web.NewRecruiterData {
	createdAt := data.CreatedAt
	updatedAt := data.UpdatedAt
	return web.NewRecruiterData{
		ID:           data.ID,
		Nama:         data.Nama,
		SeafarerCode: data.SeafarerCode,
		Rank:         data.Rank,
		AcademyName:  data.AcademyName,
		BatchID:      data.BatchID,
		BatchName: func() string {
			if data.Batch != nil {
				return data.Batch.BatchName
			}
			return ""
		}(),
		Phone:     data.Phone,
		Email:     data.Email,
		CreatedAt: &createdAt,
		UpdatedAt: &updatedAt,
	}
}

func mapNewRecruiterAssignment(data domain.NewRecruiterAssignment, reportScore *int) web.NewRecruiterAssignmentData {
	assignedAt := data.AssignedAt
	return web.NewRecruiterAssignmentData{
		ID:               data.ID,
		NewRecruiterID:   data.NewRecruiterID,
		AssessmentTypeID: data.AssessmentTypeID,
		AssessmentType: func() string {
			if data.AssessmentType != nil {
				return data.AssessmentType.AssessmentTypeName
			}
			return ""
		}(),
		BatchID: data.BatchID,
		BatchName: func() string {
			if data.Batch != nil {
				return data.Batch.BatchName
			}
			return ""
		}(),
		Token:         data.Token,
		Status:        data.Status,
		AttemptsCount: data.AttemptsCount,
		ReportScore:   reportScore,
		AssignedAt:    &assignedAt,
		CompletedAt:   data.CompletedAt,
		NewRecruiter: func() *web.NewRecruiterData {
			if data.NewRecruiter == nil {
				return nil
			}
			mapped := mapNewRecruiter(*data.NewRecruiter)
			return &mapped
		}(),
	}
}

func ptrNewRecruiter(data web.NewRecruiterData) *web.NewRecruiterData {
	return &data
}

func (s *newRecruiterServiceImpl) ensureRecruiterBatch(db *gorm.DB, batchID *uint64) error {
	if batchID == nil {
		return errors.New("batch wajib dipilih")
	}

	var batch domain.Batch
	if err := db.Where("id = ?", *batchID).First(&batch).Error; err != nil {
		return err
	}
	if batch.Type != "new_recruiter" {
		return errors.New("batch recruiter harus bertipe new_recruiter")
	}

	return nil
}

func generateToken() (string, error) {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return strings.ToUpper(hex.EncodeToString(buf)), nil
}

func normalizeRoleRank(value string) string {
	replacer := strings.NewReplacer(" ", "", "-", "", "_", "")
	return strings.ToUpper(replacer.Replace(value))
}

func isFinalAssessmentRole(role string) bool {
	return !strings.HasPrefix(role, "va_") || role == "va_3"
}

func percentage(total, max float64) float64 {
	if max == 0 {
		return 0
	}
	return math.Round((total/max)*10000) / 100
}

type newRecruiterStoredScoreRow struct {
	ID                 uint64
	NewRecruiterID     uint64
	AssessmentTypeID   uint64
	AssessmentTypeName string
	Score              int
}

func (s *newRecruiterServiceImpl) getRecruiterReportScores(db *gorm.DB) (map[uint64][]web.ReportScoreData, error) {
	rows, err := s.getStoredReportScores(db)
	if err != nil {
		return nil, err
	}

	result := make(map[uint64][]web.ReportScoreData)
	for _, row := range rows {
		result[row.NewRecruiterID] = append(result[row.NewRecruiterID], web.ReportScoreData{
			ID:               int(row.ID),
			Score:            row.Score,
			AssessmentTypeID: row.AssessmentTypeID,
			AssessmentType: web.AssessmentTypeData{
				ID:                 row.AssessmentTypeID,
				AssessmentTypeName: row.AssessmentTypeName,
			},
		})
	}

	return result, nil
}

func (s *newRecruiterServiceImpl) getAssignmentReportScores(db *gorm.DB) (map[string]*int, error) {
	rows, err := s.getStoredReportScores(db)
	if err != nil {
		return nil, err
	}

	result := make(map[string]*int)
	for _, row := range rows {
		scoreCopy := row.Score
		result[assignmentScoreKey(row.NewRecruiterID, row.AssessmentTypeID)] = &scoreCopy
	}

	return result, nil
}

func (s *newRecruiterServiceImpl) getStoredReportScores(db *gorm.DB) ([]newRecruiterStoredScoreRow, error) {
	var rows []newRecruiterStoredScoreRow
	err := db.Table("new_recruiter_report_scores AS scores").
		Select(`
			scores.id,
			scores.new_recruiter_id,
			scores.assessment_type_id,
			scores.score,
			assessment_types.assessment_type_name
		`).
		Joins("JOIN assessment_types ON assessment_types.id = scores.assessment_type_id").
		Order("scores.updated_at DESC, scores.id DESC").
		Scan(&rows).Error
	return rows, err
}

func (s *newRecruiterServiceImpl) calculateQuizAttemptScores(
	db *gorm.DB,
	assessmentTypeID uint64,
	answers []web.NewRecruiterQuizAnswerSubmit,
) (float64, float64, error) {
	var assessments []domain.Assessment
	if err := db.Where("assess_type_id = ?", assessmentTypeID).Find(&assessments).Error; err != nil {
		return 0, 0, err
	}

	questionDetailsMap := make(map[int]domain.Question)
	optionDetailsMap := make(map[int][]domain.Option)
	maxScore := 0.0

	for _, assessment := range assessments {
		var questions []domain.Question
		if err := db.Where("assessment_id = ?", assessment.AssessmentID).Find(&questions).Error; err != nil {
			return 0, 0, err
		}

		for _, question := range questions {
			questionDetailsMap[question.QuestionID] = question

			var options []domain.Option
			if err := db.Where("question_id = ?", question.QuestionID).Find(&options).Error; err != nil {
				return 0, 0, err
			}
			optionDetailsMap[question.QuestionID] = options
			maxScore += 100.0
		}
	}

	totalScore := 0.0
	for _, ans := range answers {
		question, exists := questionDetailsMap[ans.QuestionID]
		if !exists {
			continue
		}

		scoreEarned := 0.0
		qType := question.QuestionType
		if qType == "" {
			qType = "single_choice"
		}

		if qType == "short_answer" {
			if ans.TextAnswer != nil && question.AcceptableAnswers != nil {
				var acceptable []string
				if err := json.Unmarshal([]byte(*question.AcceptableAnswers), &acceptable); err == nil {
					userText := strings.TrimSpace(strings.ToLower(*ans.TextAnswer))
					for _, acc := range acceptable {
						if strings.TrimSpace(strings.ToLower(acc)) == userText {
							scoreEarned = 100.0
							break
						}
					}
				}
			}
		} else {
			options := optionDetailsMap[ans.QuestionID]
			var correctOptionIDs []int
			for _, opt := range options {
				if opt.ScorePercentage > 0 || opt.Score > 0 {
					correctOptionIDs = append(correctOptionIDs, opt.OptionID)
				}
			}

			if qType == "multiple_choice" || qType == "match_choice" {
				if len(ans.SelectedOptions) == len(correctOptionIDs) {
					matchCount := 0
					for _, selID := range ans.SelectedOptions {
						for _, corrID := range correctOptionIDs {
							if selID == corrID {
								matchCount++
								break
							}
						}
					}
					if matchCount == len(correctOptionIDs) {
						scoreEarned = 100.0
					}
				}
			} else {
				tempScore := 0.0
				for _, selectedOptID := range ans.SelectedOptions {
					for _, opt := range options {
						if opt.OptionID == selectedOptID {
							if opt.ScorePercentage != 0 {
								tempScore += opt.ScorePercentage
							} else if opt.Score > 0 {
								tempScore += 100.0
							}
						}
					}
				}
				scoreEarned = tempScore
				if scoreEarned > 100 {
					scoreEarned = 100
				}
				if scoreEarned < 0 {
					scoreEarned = 0
				}
			}
		}

		totalScore += scoreEarned
	}

	return totalScore, maxScore, nil
}

func (s *newRecruiterServiceImpl) calculateAssessmentFinalScore(
	db *gorm.DB,
	assessment domain.Assessment,
	answers map[int]int,
) (int, error) {
	var aspects []domain.Aspect
	if err := db.Where("assessment_id = ?", assessment.AssessmentID).Find(&aspects).Error; err != nil {
		return 0, err
	}

	var questions []domain.Question
	if err := db.Where("assessment_id = ?", assessment.AssessmentID).Find(&questions).Error; err != nil {
		return 0, err
	}

	questionAspectMap := make(map[int]int)
	for _, q := range questions {
		if q.AspectID != nil {
			questionAspectMap[q.QuestionID] = int(*q.AspectID)
		}
	}

	aspectRawScores := make(map[int]int)
	for questionID, optionID := range answers {
		var option domain.Option
		if err := db.Where("option_id = ?", optionID).First(&option).Error; err != nil {
			continue
		}

		if aspectID, exists := questionAspectMap[questionID]; exists {
			aspectRawScores[aspectID] += option.Score
		}
	}

	finalScore := 0
	for _, aspect := range aspects {
		rawScore := aspectRawScores[aspect.ID]
		finalScore += (rawScore * aspect.Weight) / 100
	}

	return finalScore, nil
}

func (s *newRecruiterServiceImpl) calculateValueAssessmentScore(
	db *gorm.DB,
	newRecruiterID uint64,
	assessmentTypeID uint64,
) (int, error) {
	var assessments []domain.Assessment
	if err := db.Where("assess_type_id = ?", assessmentTypeID).Find(&assessments).Error; err != nil {
		return 0, err
	}

	vaScores := make(map[string]int)
	for _, assessment := range assessments {
		var submission domain.NewRecruiterAssessmentSubmission
		err := db.Where("new_recruiter_id = ? AND assessment_id = ?", newRecruiterID, assessment.AssessmentID).
			Order("completed_at DESC, updated_at DESC, id DESC").
			First(&submission).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				continue
			}
			return 0, err
		}

		answers, err := parseNewRecruiterAnswers(submission.AnswersJSON)
		if err != nil {
			return 0, err
		}

		score, err := s.calculateAssessmentFinalScore(db, assessment, answers)
		if err != nil {
			return 0, err
		}

		vaScores[assessment.Role] = score
	}

	va1Score := vaScores["va_1"]
	va2Score := vaScores["va_2"]
	va3Score := vaScores["va_3"]
	totalScore := (va1Score * 40 / 100) + (va2Score * 30 / 100) + (va3Score * 30 / 100)

	switch {
	case totalScore < 60:
		return 1, nil
	case totalScore < 80:
		return 2, nil
	default:
		return 3, nil
	}
}

func (s *newRecruiterServiceImpl) saveAssessmentReportScore(
	db *gorm.DB,
	newRecruiterID uint64,
	assessmentTypeID uint64,
	score int,
) error {
	var reportScore domain.NewRecruiterReportScore
	err := db.Where("new_recruiter_id = ? AND assessment_type_id = ?", newRecruiterID, assessmentTypeID).
		First(&reportScore).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		reportScore = domain.NewRecruiterReportScore{
			NewRecruiterID:   newRecruiterID,
			AssessmentTypeID: assessmentTypeID,
			Score:            score,
		}
		return db.Create(&reportScore).Error
	}
	if err != nil {
		return err
	}

	reportScore.Score = score
	return db.Save(&reportScore).Error
}

func parseNewRecruiterAnswers(raw string) (map[int]int, error) {
	var stringMap map[string]int
	if err := json.Unmarshal([]byte(raw), &stringMap); err != nil {
		return nil, err
	}

	result := make(map[int]int, len(stringMap))
	for key, value := range stringMap {
		questionID, err := strconv.Atoi(key)
		if err != nil {
			continue
		}
		result[questionID] = value
	}

	return result, nil
}

func assignmentScoreKey(newRecruiterID, assessmentTypeID uint64) string {
	return fmt.Sprintf("%d:%d", newRecruiterID, assessmentTypeID)
}

func calculateDynamicFinalScore(totalScore, maxScore float64, scoringType string, scoringFormula *string) (int, error) {
	var normalizedScore float64
	if maxScore > 0 {
		normalizedScore = (totalScore / maxScore) * 100
	}

	result := normalizedScore

	if scoringType == "cfit" {
		correctCount := int(math.Round(totalScore / 100.0))
		return cfitConvertScore(correctCount), nil
	}

	if scoringType == "custom" && scoringFormula != nil {
		customResult, err := evaluateDynamicFormula(*scoringFormula, totalScore, maxScore)
		if err == nil {
			result = customResult
		}
	}

	return int(math.Round(result)), nil
}

func evaluateDynamicFormula(formula string, score, maxScore float64) (float64, error) {
	scoreStr := formatDynamicNumber(score)
	maxScoreStr := formatDynamicNumber(maxScore)
	formula = strings.ReplaceAll(formula, "max_score", maxScoreStr)
	formula = strings.ReplaceAll(formula, "score", scoreStr)
	return evaluateDynamicExpression(formula)
}

func formatDynamicNumber(num float64) string {
	if num == math.Trunc(num) {
		return fmt.Sprintf("%.0f", num)
	}
	return strings.TrimRight(strings.TrimRight(fmt.Sprintf("%.6f", num), "0"), ".")
}

func evaluateDynamicExpression(expr string) (float64, error) {
	expr = strings.TrimSpace(expr)
	if expr == "" {
		return 0, fmt.Errorf("empty expression")
	}

	parsedExpr, err := parser.ParseExpr(expr)
	if err != nil {
		return 0, fmt.Errorf("syntax error in formula: %v", err)
	}

	result, err := evalDynamicNode(parsedExpr)
	if err != nil {
		return 0, err
	}
	if math.IsNaN(result) {
		return 0, fmt.Errorf("formula resulted in NaN")
	}
	if math.IsInf(result, 0) {
		return 0, fmt.Errorf("formula resulted in infinity")
	}

	return result, nil
}

func evalDynamicNode(node ast.Node) (float64, error) {
	switch n := node.(type) {
	case *ast.BasicLit:
		if n.Kind == token.INT || n.Kind == token.FLOAT {
			return strconv.ParseFloat(n.Value, 64)
		}
		return 0, fmt.Errorf("unsupported literal type")
	case *ast.BinaryExpr:
		left, err := evalDynamicNode(n.X)
		if err != nil {
			return 0, err
		}
		right, err := evalDynamicNode(n.Y)
		if err != nil {
			return 0, err
		}
		switch n.Op {
		case token.ADD:
			return left + right, nil
		case token.SUB:
			return left - right, nil
		case token.MUL:
			return left * right, nil
		case token.QUO:
			if right == 0 {
				return 0, fmt.Errorf("division by zero")
			}
			return left / right, nil
		default:
			return 0, fmt.Errorf("unsupported operator: %s", n.Op)
		}
	case *ast.ParenExpr:
		return evalDynamicNode(n.X)
	case *ast.UnaryExpr:
		val, err := evalDynamicNode(n.X)
		if err != nil {
			return 0, err
		}
		switch n.Op {
		case token.SUB:
			return -val, nil
		case token.ADD:
			return val, nil
		default:
			return 0, fmt.Errorf("unsupported unary operator: %s", n.Op)
		}
	default:
		return 0, fmt.Errorf("unsupported expression type: %T", node)
	}
}
