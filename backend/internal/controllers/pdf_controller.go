package controllers

import (
	"net/http"

	"backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type PDFController struct {
	log *logrus.Logger
}

func NewPDFController(log *logrus.Logger) *PDFController {
	return &PDFController{log: log}
}

// ExtractText menangani POST /api/pdf/extract
// Menerima multipart file PDF dan mengekstrak teks aslinya.
func (c *PDFController) ExtractText(ctx *gin.Context) {
	fileHeader, err := ctx.FormFile("file")
	if err != nil {
		c.log.Errorf("PDFController.ExtractText: FormFile error: %v", err)
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "File PDF wajib diupload"})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.log.Errorf("PDFController.ExtractText: Open error: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuka file PDF"})
		return
	}
	defer file.Close()

	text, err := utils.ExtractTextFromPDF(file)
	if err != nil {
		c.log.Warnf("PDFController.ExtractText: ExtractTextFromPDF error: %v", err)
	}

	c.log.Infof("PDFController.ExtractText: Extracted %d chars from file %s", len(text), fileHeader.Filename)

	ctx.JSON(http.StatusOK, gin.H{
		"text":     text,
		"filename": fileHeader.Filename,
	})
}
