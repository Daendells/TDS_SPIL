package web

type SeamanLookupResponse struct {
	Name         string `json:"name" gorm:"column:name"`
	SeamanCode   string `json:"seamanCode" gorm:"column:seaman_code"`
	SeafarerCode string `json:"seafarerCode" gorm:"column:seafarer_code"`
	Jabatan      string `json:"jabatan" gorm:"column:jabatan"`
	Certificate  string `json:"certificate" gorm:"column:certificate"`
	VesselName   string `json:"vesselName" gorm:"column:vessel_name"`
}

