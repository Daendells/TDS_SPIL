package web

type MasterCreateRequest struct {
	StartDate    string `json:"startDate" validate:"required"` // optional, but if provided must be a valid date
	VesselName   string `json:"vesselName" validate:"required"`
	Nama         string `json:"nama" validate:"required"`
	Jabatan      string `json:"jabatan" validate:"required"`
	User         string `json:"user"` // optional
	SeamanCode   string `json:"seamanCode" validate:"required"`
	SeafarerCode string `json:"seafarerCode" validate:"required"`
	Certificate  string `json:"certificate" validate:"required"`
}
