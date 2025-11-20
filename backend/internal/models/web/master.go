package web

import (
	"strconv"
)

// CompetencyTypeData represents competency type information
type CompetencyTypeData struct {
	ID   int    `json:"id"`
	Code string `json:"code"`
	Name string `json:"name"`
}

// GapCompetencyData represents gap competency with its type
type GapCompetencyData struct {
	ID               int                `json:"id"`
	CompetencyTypeID int                `json:"competencyTypeId"`
	CompetencyType   CompetencyTypeData `json:"competencyType"`
}

// ReportScoreData represents score for an assessment type
type ReportScoreData struct {
	ID               int                `json:"id"`
	Score            int                `json:"score"`
	AssessmentTypeID uint64             `json:"assessmentTypeId"`
	AssessmentType   AssessmentTypeData `json:"assessmentType,omitempty"`
}

// Mirrors domain.MasterReport 1:1 so the frontend gets all columns.
type MasterReportData struct {
	ID                         int                 `json:"id"`
	VesselName                 string              `json:"vesselName"`
	Nama                       string              `json:"nama"`
	Jabatan                    string              `json:"jabatan"`
	User                       string              `json:"user"`
	SeamanCode                 string              `json:"seamanCode"`
	SeafarerCode               string              `json:"seafarerCode"`
	Certificate                string              `json:"certificate"`
	Age                        string              `json:"age"`
	KonditeReview              int                 `json:"konditeReview"`
	KpiVessel                  int                 `json:"kpiVessel"`
	PerformanceScore           int                 `json:"performanceScore"`
	ValueAssessment            int                 `json:"valueAssessment"`
	AssessmentCenter           int                 `json:"assessmentCenter"`
	PotentialScore             int                 `json:"potentialScore"`
	HavQuadran                 int                 `json:"havQuadran"`
	HavMapping                 string              `json:"havMapping"`
	CompetencyGapAnalysis      string              `json:"competencyGapAnalysis"`
	TotalGap                   int                 `json:"totalGap"`
	Strength                   int                 `json:"strength"`
	TalentClassified           string              `json:"talentClassified"`
	IDPProgram                 string              `json:"idpProgram"`
	HavQuadran2                int                 `json:"havQuadran2"`
	TalentClassified2          string              `json:"talentClassified2"`
	ReadinessMonth             *int                `json:"readinessMonth"`
	CertificateEligible        string              `json:"certificateEligible"`
	EducationFulfillmentMonths *int                `json:"educationFulfillmentMonths"`
	TotalReadinessUpdateMonths *int                `json:"totalReadinessUpdateMonths"`
	Keterangan                 string              `json:"keterangan"`
	TmNm                       int                 `json:"tmNm"`
	Competencies               []GapCompetencyData `json:"competencies,omitempty"`
	ReportScores               []ReportScoreData   `json:"reportScores,omitempty"`
}

type MasterListRequest struct {
	AnchorID     int    `form:"anchor_id" validate:"min=0"`
	Page         string `form:"page" validate:"required,oneof=next prev"`
	PageSize     int    `form:"page_size" validate:"required,min=1,max=200"`
	Name         string `form:"name"`
	SeafarerCode string `form:"seafarer_code"`
	Query        string `form:"query"`
}

type DeleteMasterRequest struct {
	ID uint `json:"id"`
}

func (r *DeleteMasterRequest) ParseID(param string) error {
	id, err := strconv.ParseUint(param, 10, 32)
	if err != nil {
		return err
	}
	r.ID = uint(id)
	return nil
}

type UpdateMasterRequest struct {
	ID           uint    `json:"-"`
	Nama         *string `json:"nama"`
	SeafarerCode *string `json:"seafarerCode"`
	SeamanCode   *string `json:"seamanCode"`
	Jabatan      *string `json:"jabatan"`
	VesselName   *string `json:"vesselName"`
	StartDate    *string `json:"startDate"`
	// hanya competency types
	Competencies []struct {
		ID               *int `json:"id"` // null → INSERT
		CompetencyTypeID int  `json:"competencyTypeId"`
	} `json:"competencies"`
}

func (r *UpdateMasterRequest) ParseID(param string) error {
	id, err := strconv.ParseUint(param, 10, 32)
	if err != nil {
		return err
	}
	r.ID = uint(id)
	return nil
}

type MasterReportListResponse struct {
	Data      []MasterReportData `json:"data"`
	FirstID   int                `json:"firstId,omitempty"`
	LastID    int                `json:"lastId,omitempty"`
	PageSize  int                `json:"pageSize"`
	HasMore   bool               `json:"hasMore"`
	FirstPage bool               `json:"firstPage"`
	Total     int                `json:"total"`
}

// ReportData is the request body for creating a new report

// FullReportResponse is the detailed response for FindById
type FullReportResponse struct {
	ID                         uint                `json:"id"`
	VesselName                 *string             `json:"vesselName"`
	Nama                       *string             `json:"nama"`
	Jabatan                    *string             `json:"jabatan"`
	SeamanCode                 *string             `json:"seamanCode"`
	SeafarerCode               *string             `json:"seafarerCode"`
	Certificate                *string             `json:"certificate"`
	Age                        *string             `json:"age"`
	KonditeReview              *int                `json:"konditeReview"`
	KpiVessel                  *int                `json:"kpiVessel"`
	PerformanceScore           *int                `json:"performanceScore"`
	ValueAssessment            *int                `json:"valueAssessment"`
	AssessmentCenter           *int                `json:"assessmentCenter"`
	PotentialScore             *int                `json:"potentialScore"`
	HavQuadran                 *int                `json:"havQuadran"`
	HavMapping                 *string             `json:"havMapping"`
	CompetencyGapAnalysis      *string             `json:"competencyGapAnalysis"`
	TotalGap                   *int                `json:"totalGap"`
	Strength                   *int                `json:"strength"`
	TalentClassified           *string             `json:"talentClassified"`
	IDPProgram                 *string             `json:"idpProgram"`
	HavQuadran2                *int                `json:"havQuadran2"`
	TalentClassified2          *string             `json:"talentClassified2"`
	ReadinessMonth             *int                `json:"readinessMonth"`
	CertificateEligible        *string             `json:"certificateEligible"`
	EducationFulfillmentMonths *int                `json:"educationFulfillmentMonths"`
	TotalReadinessUpdateMonths *int                `json:"totalReadinessUpdateMonths"`
	Keterangan                 *string             `json:"keterangan"`
	TmNm                       *int                `json:"tmNm"`
	Competencies               []GapCompetencyData `json:"competencies"`
	ReportScores               []ReportScoreData   `json:"reportScores,omitempty"`
}

// CreateReportResponse is the response after creating a report
type CreateReportResponse struct {
	ID           uint                `json:"id"`
	Nama         *string             `json:"nama"`
	SeafarerCode *string             `json:"seafarerCode"`
	Competencies []GapCompetencyData `json:"competencies"`
}

// UpdateReportResponse is the response after updating a report
type UpdateReportResponse struct {
	ID           uint                `json:"id"`
	Nama         *string             `json:"nama"`
	Jabatan      *string             `json:"jabatan"`
	Competencies []GapCompetencyData `json:"competencies"`
}
