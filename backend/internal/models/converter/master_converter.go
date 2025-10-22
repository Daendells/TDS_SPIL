package converter

import (
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
	out := make([]web.MasterReportData, len(*list))
	for i := range *list {
		out[i] = ToMasterReport(&(*list)[i])
	}
	return out
}
