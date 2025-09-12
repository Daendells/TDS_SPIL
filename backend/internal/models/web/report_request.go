package web

import "mime/multipart"

type ReportRequest struct {
	File *multipart.FileHeader `form:"file" binding:"required" validate:"required"`
}

type DashboardRequest struct {
	AnchorID int    `form:"anchor_id" binding:"min=0"`
	Page     string `form:"page" binding:"required,oneof=next prev"`
	PageSize int    `form:"page_size" binding:"required,gte=1"`
	Filter   string `form:"filter" binding:"required,omitempty,oneof=MDP FDP SDP"`
}
