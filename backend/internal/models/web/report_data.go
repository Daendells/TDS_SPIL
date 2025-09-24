package web

type IDPCountData struct {
	MDP int `json:"mdp"`
	FDP int `json:"fdp"`
	SDP int `json:"sdp"`
}

type ReportData struct {
    ID         int    `json:"id" gorm:"column:id;primaryKey"`
    SeamanCode string `json:"seamanCode" gorm:"column:seaman_code"`
    Nama       string `json:"nama" gorm:"column:nama"`
    Jabatan    string `json:"jabatan" gorm:"column:jabatan"`
    IDPProgram string `json:"idpProgram" gorm:"column:idp_program"`
    Readiness  string `json:"readiness" gorm:"column:readiness"`
}