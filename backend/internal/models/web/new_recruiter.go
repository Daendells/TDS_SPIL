package web

import "time"

type NewRecruiterCreateRequest struct {
	Nama         string  `json:"nama" validate:"required"`
	SeafarerCode string  `json:"seafarerCode" validate:"required"`
	Rank         string  `json:"rank" validate:"required"`
	AcademyName  string  `json:"academyName" validate:"required"`
	BatchID      *uint64 `json:"batchId" validate:"required"`
	Phone        *string `json:"phone"`
	Email        *string `json:"email"`
}

type NewRecruiterUpdateRequest struct {
	Nama         string  `json:"nama" validate:"required"`
	SeafarerCode string  `json:"seafarerCode" validate:"required"`
	Rank         string  `json:"rank" validate:"required"`
	AcademyName  string  `json:"academyName" validate:"required"`
	BatchID      *uint64 `json:"batchId" validate:"required"`
	Phone        *string `json:"phone"`
	Email        *string `json:"email"`
}

type NewRecruiterData struct {
	ID           uint64            `json:"id"`
	Nama         string            `json:"nama"`
	SeafarerCode string            `json:"seafarerCode"`
	Rank         string            `json:"rank"`
	AcademyName  string            `json:"academyName"`
	BatchID      *uint64           `json:"batchId,omitempty"`
	BatchName    string            `json:"batchName,omitempty"`
	ReportScores []ReportScoreData `json:"reportScores,omitempty"`
	Phone        *string           `json:"phone,omitempty"`
	Email        *string           `json:"email,omitempty"`
	CreatedAt    *time.Time        `json:"createdAt,omitempty"`
	UpdatedAt    *time.Time        `json:"updatedAt,omitempty"`
}

type NewRecruiterAssignmentCreateRequest struct {
	NewRecruiterID   uint64  `json:"newRecruiterId" validate:"required"`
	AssessmentTypeID uint64  `json:"assessmentTypeId" validate:"required"`
	BatchID          *uint64 `json:"batchId"`
}

type NewRecruiterSearchRequest struct {
	Query    string  `form:"query"`
	BatchID  *uint64 `form:"batchId"`
	CursorID *uint64 `form:"cursorId"`
	PageSize int     `form:"pageSize"`
}

type NewRecruiterListRequest struct {
	Query    string  `form:"query"`
	BatchID  *uint64 `form:"batchId"`
	AnchorID *uint64 `form:"anchorId"`
	Page     string  `form:"page"`
	PageSize int     `form:"pageSize"`
}

type NewRecruiterAssignmentListRequest struct {
	Query    string  `form:"query"`
	BatchID  *uint64 `form:"batchId"`
	AnchorID *uint64 `form:"anchorId"`
	Page     string  `form:"page"`
	PageSize int     `form:"pageSize"`
}

type NewRecruiterSearchResponse struct {
	Data    []NewRecruiterData `json:"data"`
	LastID  *uint64            `json:"lastId,omitempty"`
	HasMore bool               `json:"hasMore"`
}

type NewRecruiterListResponse struct {
	Data      []NewRecruiterData `json:"data"`
	FirstID   *uint64            `json:"firstId,omitempty"`
	LastID    *uint64            `json:"lastId,omitempty"`
	PageSize  int                `json:"pageSize"`
	HasMore   bool               `json:"hasMore"`
	FirstPage bool               `json:"firstPage"`
	Total     int64              `json:"total"`
}

type NewRecruiterAssignmentListResponse struct {
	Data      []NewRecruiterAssignmentData `json:"data"`
	FirstID   *uint64                      `json:"firstId,omitempty"`
	LastID    *uint64                      `json:"lastId,omitempty"`
	PageSize  int                          `json:"pageSize"`
	HasMore   bool                         `json:"hasMore"`
	FirstPage bool                         `json:"firstPage"`
	Total     int64                        `json:"total"`
}

type NewRecruiterBulkAssignBatchRequest struct {
	NewRecruiterIDs []uint64 `json:"newRecruiterIds" validate:"required,min=1"`
	BatchID         *uint64  `json:"batchId" validate:"required"`
}

type NewRecruiterAssignmentData struct {
	ID               uint64            `json:"id"`
	NewRecruiterID   uint64            `json:"newRecruiterId"`
	AssessmentTypeID uint64            `json:"assessmentTypeId"`
	AssessmentType   string            `json:"assessmentType"`
	BatchID          *uint64           `json:"batchId,omitempty"`
	BatchName        string            `json:"batchName,omitempty"`
	Token            string            `json:"token"`
	Status           string            `json:"status"`
	AttemptsCount    uint64            `json:"attemptsCount"`
	ReportScore      *int              `json:"reportScore,omitempty"`
	AssignedAt       *time.Time        `json:"assignedAt,omitempty"`
	CompletedAt      *time.Time        `json:"completedAt,omitempty"`
	NewRecruiter     *NewRecruiterData `json:"newRecruiter,omitempty"`
}

type NewRecruiterAssignmentCheckResponse struct {
	IsAssigned       bool              `json:"isAssigned"`
	Message          string            `json:"message"`
	Token            string            `json:"token"`
	AssessmentTypeID uint64            `json:"assessmentTypeId"`
	PersonalData     *NewRecruiterData `json:"personalData,omitempty"`
	AttemptsCount    uint64            `json:"attemptsCount"`
	MaxAttempts      *int              `json:"maxAttempts"`
}

type NewRecruiterAssessmentSubmitRequest struct {
	Token   string      `json:"token" validate:"required"`
	Role    string      `json:"role" validate:"required"`
	Answers map[int]int `json:"answers" validate:"required"`
}

type NewRecruiterQuizAnswerSubmit struct {
	QuestionID      int     `json:"questionId" validate:"required"`
	SelectedOptions []int   `json:"selectedOptions,omitempty"`
	TextAnswer      *string `json:"textAnswer,omitempty"`
}

type NewRecruiterQuizSubmitRequest struct {
	Token            string                         `json:"token" validate:"required"`
	AssessmentTypeID uint64                         `json:"assessmentTypeId" validate:"required"`
	Answers          []NewRecruiterQuizAnswerSubmit `json:"answers" validate:"required"`
}

type NewRecruiterQuizAttemptResponse struct {
	ID                   uint64    `json:"id"`
	Token                string    `json:"token"`
	AssessmentTypeID     uint64    `json:"assessmentTypeId"`
	AssessmentTypeName   string    `json:"assessmentTypeName"`
	TotalScore           float64   `json:"totalScore"`
	MaxScore             float64   `json:"maxScore"`
	PercentageScore      float64   `json:"percentageScore"`
	CompletedAt          time.Time `json:"completedAt"`
	CompletedAtFormatted string    `json:"completedAtFormatted"`
}
