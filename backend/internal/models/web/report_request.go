package web

import "mime/multipart"

type ReportRequest struct {
	File *multipart.FileHeader `form:"file" binding:"required" validate:"required"`
}
