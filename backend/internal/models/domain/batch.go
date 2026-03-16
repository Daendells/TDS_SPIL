package domain

import "time"

type Batch struct {
	ID         int        `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	BatchNo    int        `json:"batchNo" gorm:"column:batch_no;unique;not null"`
	BatchName  string     `json:"batchName" gorm:"column:batch_name;type:varchar(150);not null;default:''"`
	Type       string     `json:"type" gorm:"column:type;type:enum('crew','new_recruiter');default:'crew';not null"`
	StartDate  time.Time  `json:"startDate" gorm:"column:start_date;type:date"`
	EndDate    time.Time  `json:"endDate" gorm:"column:end_date;type:date"`
	Status     string     `json:"status" gorm:"column:status;type:enum('active','completed');default:active"`
	SnapshotAt *time.Time `json:"snapshotAt,omitempty" gorm:"column:snapshotted_at"`
	CreatedAt  time.Time  `json:"createdAt" gorm:"column:created_at"`
	UpdatedAt  time.Time  `json:"updatedAt" gorm:"column:updated_at"`
}
