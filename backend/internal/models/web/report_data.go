package web

type IDPCountData struct {
	MDP int `json:"mdp"`
	FDP int `json:"fdp"`
	SDP int `json:"sdp"`
}

type ReportData struct {
	ID                    int    `json:"id"`
	VesselName            string `json:"vessel_name"`
	Nama                  string `json:"nama"`
	Jabatan               string `json:"jabatan"`
	KonditeReview         int    `json:"kondite_review"`
	KPIVessel             int    `json:"kpi_vessel"`
	PerformanceScore      int    `json:"performance_score"`
	ValueAssessment       int    `json:"value_assessment"`
	AssessmentCenter      int    `json:"assessment_center"`
	PotentialScore        int    `json:"potential_score"`
	HAVQuadran            string `json:"hav_quadran"`
	HAVMapping            string `json:"hav_mapping"`
	CompetencyGapAnalysis string `json:"competency_gap_analysis"`
	TalentClassified      string `json:"talent_classified"`
	IDPProgram            string `json:"idp_program"`
}
