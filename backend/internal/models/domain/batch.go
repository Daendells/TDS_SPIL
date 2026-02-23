package domain

import "time"

type Batch struct {
	ID        int       `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	BatchNo   int       `json:"batchNo" gorm:"column:batch_no;unique;not null"`
	StartDate time.Time `json:"startDate" gorm:"column:start_date;type:date"`
	EndDate   time.Time `json:"endDate" gorm:"column:end_date;type:date"`
	CreatedAt time.Time `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updatedAt" gorm:"column:updated_at"`
	// Reports   []Report  `json:"reports,omitempty" gorm:"foreignKey:BatchID"` // Optional: back reference if needed
}
