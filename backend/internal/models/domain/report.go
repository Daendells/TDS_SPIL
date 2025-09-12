package domain

type Report struct {
	ID                    int    `json:"id" gorm:"column:id;primaryKey"`
	VesselName            string `json:"vessel_name" gorm:"column:vessel_name"`
	Nama                  string `json:"nama" gorm:"column:nama"`
	Jabatan               string `json:"jabatan" gorm:"column:jabatan"`
	KonditeReview         int    `json:"kondite_review" gorm:"column:kondite_review"`
	KPIVessel             int    `json:"kpi_vessel" gorm:"column:kpi_vessel"`
	PerformanceScore      int    `json:"performance_score" gorm:"column:performance_score"`
	ValueAssessment       int    `json:"value_assessment" gorm:"column:value_assessment"`
	AssessmentCenter      int    `json:"assessment_center" gorm:"column:assessment_center"`
	PotentialScore        int    `json:"potential_score" gorm:"column:potential_score"`
	HAVQuadran            string `json:"hav_quadran" gorm:"column:hav_quadran"`
	HAVMapping            string `json:"hav_mapping" gorm:"column:hav_mapping"`
	CompetencyGapAnalysis string `json:"competency_gap_analysis" gorm:"column:competency_gap_analysis"`
	TalentClassified      string `json:"talent_classified" gorm:"column:talent_classified"`
	IDPProgram            string `json:"idp_program" gorm:"column:idp_program"`
}
