package domain

import "time"

type NewRecruiter struct {
	ID           uint64                   `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	Nama         string                   `json:"nama" gorm:"column:nama;type:varchar(200);not null"`
	SeafarerCode string                   `json:"seafarerCode" gorm:"column:seafarer_code;type:varchar(50);not null;uniqueIndex"`
	Rank         string                   `json:"rank" gorm:"column:rank;type:varchar(100);not null"`
	AcademyName  string                   `json:"academyName" gorm:"column:academy_name;type:varchar(200);not null"`
	BatchID      *uint64                  `json:"batchId,omitempty" gorm:"column:batch_id;index"`
	Phone        *string                  `json:"phone,omitempty" gorm:"column:phone;type:varchar(50)"`
	Email        *string                  `json:"email,omitempty" gorm:"column:email;type:varchar(200)"`
	CreatedAt    time.Time                `json:"createdAt" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt    time.Time                `json:"updatedAt" gorm:"column:updated_at;autoUpdateTime"`
	Batch        *Batch                   `json:"batch,omitempty" gorm:"foreignKey:BatchID;references:ID"`
	Assignments  []NewRecruiterAssignment `json:"assignments,omitempty" gorm:"foreignKey:NewRecruiterID;references:ID"`
}

func (NewRecruiter) TableName() string {
	return "new_recruiters"
}
