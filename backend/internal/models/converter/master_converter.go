package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

// ToMasterReport converts domain.MasterReport to web.MasterReportData
func ToMasterReport(d *domain.MasterReport) web.MasterReportData {
	// Map competencies
	competencies := make([]web.GapCompetencyData, 0, len(d.GapCompetencies))
	for _, gc := range d.GapCompetencies {
		comp := web.GapCompetencyData{
			ID:               gc.ID,
			CompetencyTypeID: gc.CompetencyTypeID,
		}

		// Add CompetencyType if loaded
		if gc.CompetencyType != nil {
			comp.CompetencyType = web.CompetencyTypeData{
				ID:   gc.CompetencyType.ID,
				Code: gc.CompetencyType.Code,
				Name: gc.CompetencyType.Name,
			}
		}

		competencies = append(competencies, comp)
	}

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
		Competencies:               competencies,
	}
}

// ToMasterReportList converts list of domain.MasterReport to web.MasterReportData
func ToMasterReportList(list *[]domain.MasterReport) []web.MasterReportData {
	var result []web.MasterReportData
	for _, item := range *list {
		result = append(result, ToMasterReport(&item))
	}
	return result
}

// ToFullReportResponse converts domain.FullReport to web.FullReportResponse
func ToFullReportResponse(d *domain.FullReport) web.FullReportResponse {
	// Map competencies
	competencies := make([]web.GapCompetencyData, 0, len(d.GapCompetencies))
	for _, gc := range d.GapCompetencies {
		comp := web.GapCompetencyData{
			ID:               gc.ID,
			CompetencyTypeID: gc.CompetencyTypeID,
		}

		// Add CompetencyType if loaded
		if gc.CompetencyType != nil {
			comp.CompetencyType = web.CompetencyTypeData{
				ID:   gc.CompetencyType.ID,
				Code: gc.CompetencyType.Code,
				Name: gc.CompetencyType.Name,
			}
		}

		competencies = append(competencies, comp)
	}

	return web.FullReportResponse{
		ID:                         d.ID,
		VesselName:                 d.VesselName,
		Nama:                       d.Nama,
		Jabatan:                    d.Jabatan,
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
		Competencies:               competencies,
	}
}

// MasterReportRequestToDomain converts web.MasterReportData to domain.FullReport
func MasterReportRequestToDomain(req *web.MasterReportData) *domain.FullReport {
	report := &domain.FullReport{
		VesselName:   &req.VesselName,
		Nama:         &req.Nama,
		Jabatan:      &req.Jabatan,
		SeamanCode:   &req.SeamanCode,
		SeafarerCode: &req.SeafarerCode,
		Certificate:  &req.Certificate,
	}

	// Map competencies if provided
	if len(req.Competencies) > 0 {
		competencies := make([]domain.GapCompetency, 0, len(req.Competencies))
		for _, comp := range req.Competencies {
			competencies = append(competencies, domain.GapCompetency{
				CompetencyTypeID: comp.CompetencyTypeID,
			})
		}
		report.GapCompetencies = competencies
	}

	return report
}

// ToGapCompetencyData converts domain.GapCompetency to web.GapCompetencyData
func ToGapCompetencyData(gc *domain.GapCompetency) web.GapCompetencyData {
	comp := web.GapCompetencyData{
		ID:               gc.ID,
		CompetencyTypeID: gc.CompetencyTypeID,
	}

	// Add CompetencyType if loaded
	if gc.CompetencyType != nil {
		comp.CompetencyType = web.CompetencyTypeData{
			ID:   gc.CompetencyType.ID,
			Code: gc.CompetencyType.Code,
			Name: gc.CompetencyType.Name,
		}
	}

	return comp
}

// ToGapCompetencyDataList converts list of domain.GapCompetency to web.GapCompetencyData
func ToGapCompetencyDataList(list []domain.GapCompetency) []web.GapCompetencyData {
	result := make([]web.GapCompetencyData, 0, len(list))
	for _, gc := range list {
		result = append(result, ToGapCompetencyData(&gc))
	}
	return result
}
