package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func ToReportData(data *domain.Report) web.ReportData {
	return web.ReportData{
		ID:                    data.ID,
		SeamanCode:			   data.SeamanCode,
		Nama:                  data.Nama,
		Jabatan:               data.Jabatan,
		IDPProgram:            data.IDPProgram,
		Readiness:			   data.Readiness,
	}
}

func ToReportDataList(list *[]domain.Report) []web.ReportData {
	res := make([]web.ReportData, len(*list))

	for i, r := range *list {
		res[i] = ToReportData(&r)
	}

	return res
}
