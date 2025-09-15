package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func ToReportData(data *domain.Report) web.ReportData {
	return web.ReportData{
		ID:                    data.ID,
		VesselName:            data.VesselName,
		Nama:                  data.Nama,
		Jabatan:               data.Jabatan,
		KonditeReview:         data.KonditeReview,
		KPIVessel:             data.KPIVessel,
		PerformanceScore:      data.PerformanceScore,
		ValueAssessment:       data.ValueAssessment,
		AssessmentCenter:      data.AssessmentCenter,
		PotentialScore:        data.PotentialScore,
		HAVQuadran:            data.HAVQuadran,
		HAVMapping:            data.HAVMapping,
		CompetencyGapAnalysis: data.CompetencyGapAnalysis,
		TalentClassified:      data.TalentClassified,
		IDPProgram:            data.IDPProgram,
	}
}

func ToReportDataList(list *[]domain.Report) []web.ReportData {
	res := make([]web.ReportData, len(*list))

	for i, r := range *list {
		res[i] = ToReportData(&r)
	}

	return res
}
