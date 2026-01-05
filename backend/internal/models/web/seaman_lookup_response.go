package web

type SeamanLookupResponse struct {
	Name       string `json:"name" gorm:"column:name"`
	SeamanCode string `json:"seamanCode" gorm:"column:seaman_code"`
}
