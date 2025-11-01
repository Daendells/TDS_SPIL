package converter

import (
	"backend/internal/helpers"
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func ToMasterReport(d *domain.MasterReport) web.MasterReportData {
	return web.MasterReportData{
		ID:                         d.ID,
		VesselName:                 d.VesselName,
		Nama:                       d.Nama,
		Jabatan:                    d.Jabatan,
		User:                       d.User,
		SeamanCode:                 d.SeamanCode,
		SeafarerCode:               d.SeafarerCode,
		Certificate:                d.Certificate,
		Age:                        d.Age,
		KonditeReview:              d.KonditeReview,
		KpiVessel:                  d.KpiVessel,
		PerformanceScore:           d.PerformanceScore,
		ValueAssessment:            d.ValueAssessment,
		AssessmentCenter:           d.AssessmentCenter,
		PotentialScore:             d.PotentialScore,
		HavQuadran:                 d.HavQuadran,
		HavMapping:                 d.HavMapping,
		CompetencyGapAnalysis:      d.CompetencyGapAnalysis,
		TotalGap:                   d.TotalGap,
		Strength:                   d.Strength,
		TalentClassified:           d.TalentClassified,
		IDPProgram:                 d.IDPProgram,
		HavQuadran2:                d.HavQuadran2,
		TalentClassified2:          d.TalentClassified2,
		ReadinessMonth:             d.ReadinessMonth,
		CertificateEligible:        d.CertificateEligible,
		EducationFulfillmentMonths: d.EducationFulfillmentMonths,
		TotalReadinessUpdateMonths: d.TotalReadinessUpdateMonths,
		Keterangan:                 d.Keterangan,
		TmNm:                       d.TmNm,
	}
}

func ToMasterReportList(list *[]domain.MasterReport) []web.MasterReportData {
	var result []web.MasterReportData
	for _, item := range *list {
		result = append(result, ToMasterReport(&item))
	}
	return result
}

// Convert request to domain
func MasterReportRequestToDomain(req *web.ReportData) *domain.FullReport {
	return &domain.FullReport{
		VesselName:   helpers.StringToPtr(req.VesselName),
		Nama:         helpers.StringToPtr(req.Nama),
		Jabatan:      helpers.StringToPtr(req.Jabatan),
		SeamanCode:   helpers.StringToPtr(req.SeamanCode),
		SeafarerCode: helpers.StringToPtr(req.SeafarerCode),
		Certificate:  helpers.StringToPtr(req.Certificate),
	}
}
