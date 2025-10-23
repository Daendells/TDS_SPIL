package web

import (
	"strconv"
)

// MasterReportData is the JSON shape returned by /master-reports.
// Mirrors domain.MasterReport 1:1 so the frontend gets all columns.
type MasterReportData struct {
	ID                         int    `json:"id"`
	VesselName                 string `json:"vesselName"`
	Nama                       string `json:"nama"`
	Jabatan                    string `json:"jabatan"`
	User                       string `json:"user"`
	SeamanCode                 string `json:"seamanCode"`
	SeafarerCode               string `json:"seafarerCode"`
	Certificate                string `json:"certificate"`
	Age                        string `json:"age"`
	KonditeReview              int    `json:"konditeReview"`
	KpiVessel                  int    `json:"kpiVessel"`
	PerformanceScore           int    `json:"performanceScore"`
	ValueAssessment            int    `json:"valueAssessment"`
	AssessmentCenter           int    `json:"assessmentCenter"`
	PotentialScore             int    `json:"potentialScore"`
	HavQuadran                 int    `json:"havQuadran"`
	HavMapping                 string `json:"havMapping"`
	CompetencyGapAnalysis      string `json:"competencyGapAnalysis"`
	TotalGap                   int    `json:"totalGap"`
	Strength                   int    `json:"strength"`
	TalentClassified           string `json:"talentClassified"`
	IDPProgram                 string `json:"idpProgram"`
	HavQuadran2                int    `json:"havQuadran2"`
	TalentClassified2          string `json:"talentClassified2"`
	ReadinessMonth             int    `json:"readinessMonth"`
	CertificateEligible        string `json:"certificateEligible"`
	EducationFulfillmentMonths int    `json:"educationFulfillmentMonths"`
	TotalReadinessUpdateMonths int    `json:"totalReadinessUpdateMonths"`
	Keterangan                 string `json:"keterangan"`
	TmNm                       int    `json:"tmNm"`
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
