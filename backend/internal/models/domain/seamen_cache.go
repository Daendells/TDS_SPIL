package domain

import "time"

type SeamenCache struct {
	ID            int64     `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	SeamanCode    string    `json:"seamanCode" gorm:"column:seaman_code;size:50;not null;uniqueIndex"`
	SeafarerCode  string    `json:"seafarerCode" gorm:"column:seafarer_code;size:50"`
	Name          string    `json:"name" gorm:"column:name;size:255"`
	Age           string    `json:"age" gorm:"column:age;size:10"`
	Birthdate     string    `json:"birthdate" gorm:"column:birthdate;size:20"`
	Birthplace    string    `json:"birthplace" gorm:"column:birthplace;size:255"`
	Certificate   string    `json:"certificate" gorm:"column:certificate;size:100"`
	LastLocation  string    `json:"lastLocation" gorm:"column:last_location;size:255"`
	LastPosition  string    `json:"lastPosition" gorm:"column:last_position;size:100"`
	LastVesselID  string    `json:"lastVesselId" gorm:"column:last_vessel_id;size:50"`
	StartDate     string    `json:"startDate" gorm:"column:start_date;size:20"`
	EndDate       string    `json:"endDate" gorm:"column:end_date;size:20"`
	Status        string    `json:"status" gorm:"column:status;size:50"`
	Gender        string    `json:"gender" gorm:"column:gender;size:20"`
	EduLevel      string    `json:"eduLevel" gorm:"column:edu_level;size:50"`
	Experience    string    `json:"experience" gorm:"column:experience;size:50"`
	Fleet         string    `json:"fleet" gorm:"column:fleet;size:10"`
	PrevLocation  string    `json:"prevLocation" gorm:"column:prev_location;size:255"`
	PrevPosition  string    `json:"prevPosition" gorm:"column:prev_position;size:100"`
	UpdatedAt     time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

func (SeamenCache) TableName() string {
	return "seamen_cache"
}
