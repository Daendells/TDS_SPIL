package domain

type Report struct {
	ID                    int    `gorm:"column:id;primaryKey"`
	VesselName            string `gorm:"column:vessel_name"`
	Nama                  string `gorm:"column:nama"`
	Jabatan               string `gorm:"column:jabatan"`
	KonditeReview         int    `gorm:"column:kondite_review"`
	KPIVessel             int    `gorm:"column:kpi_vessel"`
	PerformanceScore      int    `gorm:"column:performance_score"`
	ValueAssessment       int    `gorm:"column:value_assessment"`
	AssessmentCenter      int    `gorm:"column:assessment_center"`
	PotentialScore        int    `gorm:"column:potential_score"`
	HAVQuadran            string `gorm:"column:hav_quadran"`
	HAVMapping            string `gorm:"column:hav_mapping"`
	CompetencyGapAnalysis string `gorm:"column:competency_gap_analysis"`
	TalentClassified      string `gorm:"column:talent_classified"`
	IDPProgram            string `gorm:"column:idp_program"`
}
