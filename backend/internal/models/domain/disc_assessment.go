package domain

import "time"

// DISCAssessment represents authentic candidate DISC psychometric assessment records
type DISCAssessment struct {
	ID               uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	CandidateCode    string    `gorm:"column:candidate_code;size:50;uniqueIndex;not null" json:"candidate_code"` // e.g. DISC-0001
	Name             string    `gorm:"column:name;size:255;not null" json:"name"`
	NIK              string    `gorm:"column:nik;size:100;index" json:"nik"`
	Email            string    `gorm:"column:email;size:255" json:"email"`
	TestDate         string    `gorm:"column:test_date;size:100" json:"test_date"`
	DominantType     string    `gorm:"column:dominant_type;size:10;index;not null" json:"dominant_type"` // D, I, S, C
	TraitM           string    `gorm:"column:trait_m;size:100" json:"trait_m"`
	TraitL           string    `gorm:"column:trait_l;size:100" json:"trait_l"`
	TraitPK          string    `gorm:"column:trait_pk;size:100" json:"trait_pk"`
	Consistency      string    `gorm:"column:consistency;size:100;index;not null" json:"consistency"` // Still Consistent, Note for Assessor, Incomplete

	// Graph I: Work Mask / Sehari-hari
	G1D float64 `gorm:"column:g1_d" json:"g1_d"`
	G1I float64 `gorm:"column:g1_i" json:"g1_i"`
	G1S float64 `gorm:"column:g1_s" json:"g1_s"`
	G1C float64 `gorm:"column:g1_c" json:"g1_c"`

	// Graph II: Core / Under Pressure
	G2D float64 `gorm:"column:g2_d" json:"g2_d"`
	G2I float64 `gorm:"column:g2_i" json:"g2_i"`
	G2S float64 `gorm:"column:g2_s" json:"g2_s"`
	G2C float64 `gorm:"column:g2_c" json:"g2_c"`

	// Graph III: Mirror / Integrasi
	G3D float64 `gorm:"column:g3_d" json:"g3_d"`
	G3I float64 `gorm:"column:g3_i" json:"g3_i"`
	G3S float64 `gorm:"column:g3_s" json:"g3_s"`
	G3C float64 `gorm:"column:g3_c" json:"g3_c"`

	// Narrative & Descriptors
	DescWords        string `gorm:"column:desc_words;type:text" json:"desc_words"`
	CharacterSummary string `gorm:"column:character_summary;type:text" json:"character_summary"`
	SelfMotivation   string `gorm:"column:self_motivation;type:text" json:"self_motivation"`
	JobEmphasis      string `gorm:"column:job_emphasis;type:text" json:"job_emphasis"`
	WorkMask         string `gorm:"column:work_mask;type:text" json:"work_mask"`
	UnderPressure    string `gorm:"column:under_pressure;type:text" json:"under_pressure"`

	CreatedAt time.Time `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (DISCAssessment) TableName() string {
	return "disc_assessments"
}
