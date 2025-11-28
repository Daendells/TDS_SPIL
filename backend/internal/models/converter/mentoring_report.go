package converter

import (
	"encoding/json"
	"fmt"

	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func MentoringReportRequestToDomain(request *web.MentoringReportRequest) *domain.MentoringReport {
	// Convert ReportIDs array to JSON string
	reportIDsJSON, _ := json.Marshal(request.ReportIDs)
	// Convert MenteeNames array to JSON string
	menteeNamesJSON, _ := json.Marshal(request.MenteeNames)

	return &domain.MentoringReport{
		MentorName:      request.MentorName,
		Period:          request.Period,
		MenteeNames:     string(menteeNamesJSON),
		Department:      request.Department,
		Program:         request.Program,
		ProgramTitle:    request.ProgramTitle,
		SessionNumber:   fmt.Sprintf("%d", request.SessionNumber),
		Date:            request.Date,
		Duration:        fmt.Sprintf("%d", request.Duration),
		Purpose:         request.Purpose,
		Observation:     request.Observation,
		Reflection:      request.Reflection,
		ActionPlan:      request.ActionPlan,
		AdditionalNotes: request.AdditionalNotes,
		ReportIDs:       string(reportIDsJSON),
	}
}

func MentoringReportUpdateRequestToDomain(request *web.MentoringReportUpdateRequest) *domain.MentoringReport {
	// Convert ReportIDs array to JSON string
	reportIDsJSON, _ := json.Marshal(request.ReportIDs)
	// Convert MenteeNames array to JSON string
	menteeNamesJSON, _ := json.Marshal(request.MenteeNames)

	return &domain.MentoringReport{
		ID:              request.ID,
		MentorName:      request.MentorName,
		Period:          request.Period,
		MenteeNames:     string(menteeNamesJSON),
		Department:      request.Department,
		Program:         request.Program,
		ProgramTitle:    request.ProgramTitle,
		SessionNumber:   fmt.Sprintf("%d", request.SessionNumber),
		Date:            request.Date,
		Duration:        fmt.Sprintf("%d", request.Duration),
		Purpose:         request.Purpose,
		Observation:     request.Observation,
		Reflection:      request.Reflection,
		ActionPlan:      request.ActionPlan,
		AdditionalNotes: request.AdditionalNotes,
		ReportIDs:       string(reportIDsJSON),
	}
}

func MentoringReportDomainToData(mentoringReport *domain.MentoringReport) *web.MentoringReportData {
	// Convert JSON string back to array of integers
	var reportIDs []int
	if mentoringReport.ReportIDs != "" {
		json.Unmarshal([]byte(mentoringReport.ReportIDs), &reportIDs)
	}

	// Convert JSON string back to array of strings
	var menteeNames []string
	if mentoringReport.MenteeNames != "" {
		json.Unmarshal([]byte(mentoringReport.MenteeNames), &menteeNames)
	}

	return &web.MentoringReportData{
		ID:              mentoringReport.ID,
		MentorName:      mentoringReport.MentorName,
		Period:          mentoringReport.Period,
		MenteeNames:     menteeNames,
		Department:      mentoringReport.Department,
		Program:         mentoringReport.Program,
		ProgramTitle:    mentoringReport.ProgramTitle,
		SessionNumber:   mentoringReport.SessionNumber,
		Date:            mentoringReport.Date,
		Duration:        mentoringReport.Duration,
		Purpose:         mentoringReport.Purpose,
		Observation:     mentoringReport.Observation,
		Reflection:      mentoringReport.Reflection,
		ActionPlan:      mentoringReport.ActionPlan,
		AdditionalNotes: mentoringReport.AdditionalNotes,
		ReportIDs:       reportIDs,
		CreatedAt: func() string {
			if mentoringReport.CreatedAt != nil {
				return mentoringReport.CreatedAt.Format("2006-01-02 15:04:05")
			}
			return ""
		}(),
		UpdatedAt: func() string {
			if mentoringReport.UpdatedAt != nil {
				return mentoringReport.UpdatedAt.Format("2006-01-02 15:04:05")
			}
			return ""
		}(),
	}
}

func MentoringReportDomainToDataList(mentoringReports *[]domain.MentoringReport) *[]web.MentoringReportData {
	var result []web.MentoringReportData
	for _, mentoringReport := range *mentoringReports {
		result = append(result, *MentoringReportDomainToData(&mentoringReport))
	}
	return &result
}
