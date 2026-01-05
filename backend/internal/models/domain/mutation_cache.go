package domain

import "time"

type MutationCache struct {
	ID              int64     `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	SeamanCode      string    `json:"seamanCode" gorm:"column:seaman_code;size:50;not null;index:idx_seaman_date"`
	SeamanName      string    `json:"seamanName" gorm:"column:seaman_name;size:255"`
	TransactionDate time.Time `json:"transactionDate" gorm:"column:transaction_date;index:idx_seaman_date"`
	FromRankCode    string    `json:"fromRankCode" gorm:"column:from_rank_code;size:50"`
	FromRankName    string    `json:"fromRankName" gorm:"column:from_rank_name;size:100"`
	ToRankCode      string    `json:"toRankCode" gorm:"column:to_rank_code;size:50"`
	ToRankName      string    `json:"toRankName" gorm:"column:to_rank_name;size:100"`
	FromVesselCode  string    `json:"fromVesselCode" gorm:"column:from_vessel_code;size:50"`
	FromVesselName  string    `json:"fromVesselName" gorm:"column:from_vessel_name;size:255"`
	ToVesselCode    string    `json:"toVesselCode" gorm:"column:to_vessel_code;size:50"`
	ToVesselName    string    `json:"toVesselName" gorm:"column:to_vessel_name;size:255"`
	Jenis           string    `json:"jenis" gorm:"column:jenis;size:100"`
	MutationNoID    string    `json:"mutationNoId" gorm:"column:mutation_no_id;size:50"`
	UpdatedAt       time.Time `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
}

func (MutationCache) TableName() string {
	return "mutation_cache"
}
