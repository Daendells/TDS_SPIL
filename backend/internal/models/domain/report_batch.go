package domain

import "time"

// ReportBatch is the many-to-many junction table between reports and batches.
// A report can belong to multiple batches, and a batch can contain multiple reports.
type ReportBatch struct {
	ID         int       `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	ReportID   int       `json:"reportId" gorm:"column:report_id;not null;uniqueIndex:uniq_report_batch"`
	BatchID    int       `json:"batchId" gorm:"column:batch_id;not null;uniqueIndex:uniq_report_batch"`
	AssignedAt time.Time `json:"assignedAt" gorm:"column:assigned_at;autoCreateTime"`
}

func (ReportBatch) TableName() string {
	return "report_batches"
}
