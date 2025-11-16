package trainingController

import (
	"net/http"

	"backend/internal/services"
	"backend/internal/services/training"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type TrainingController struct {
	dbSvc *services.TrainingService   // CRUD service
	aiSvc *training.Service           // AI generator
	log   *logrus.Logger
}

func NewTrainingController(
	dbSvc *services.TrainingService,
	aiSvc *training.Service,
	log *logrus.Logger,
) *TrainingController {
	return &TrainingController{
		dbSvc: dbSvc,
		aiSvc: aiSvc,
		log:   log,
	}
}

// ======================
// CRUD Endpoint
// ======================
func (h *TrainingController) FindAll(c *gin.Context) {
	res, err := h.dbSvc.FindAll()
	if err != nil {
		h.log.WithError(err).Error("gagal mengambil data training")
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":   http.StatusInternalServerError,
			"status": "ERROR",
			"error":  err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, res)
}

// ======================
// AI Generator Endpoint
// ======================
func (h *TrainingController) Generate(c *gin.Context) {
	var req struct {
		Kode             string `json:"kode" binding:"required"`
		TopikTraining    string `json:"topik_training" binding:"required"`
		Kompetensi       string `json:"kompetensi" binding:"required"`
		Referensi        string `json:"referensi"`
		Level            int    `json:"lvl"`
		Tools            string `json:"tools_training"`
		DeskripsiPerilaku string `json:"deskripsi_perilaku"`
		OldFileURL       string `json:"old_file_url"` // untuk regenerate PPTX
		OldPdfURL        string `json:"old_pdf_url"`  // untuk regenerate PDF
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Request tidak valid: " + err.Error(),
		})
		return
	}

	// Generate materi (PPTX + PDF) dengan pass oldFileURL untuk delete file lama
	pptxLink, pdfLink, meta, err := h.aiSvc.GenerateAndBuildPPTX(c.Request.Context(), training.GenerateInput{
		Kode:             req.Kode,
		TopikTraining:    req.TopikTraining,
		Kompetensi:       req.Kompetensi,
		Referensi:        req.Referensi,
		Level:            req.Level,
		Tools:            req.Tools,
		DeskripsiPerilaku: req.DeskripsiPerilaku,
	}, req.OldFileURL, req.OldPdfURL)

	if err != nil {
		h.log.WithError(err).Error("Gagal generate materi training")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal membuat materi training: " + err.Error(),
		})
		return
	}

	// Save both links to database
	if err := h.dbSvc.UpdateGeneratedFileURL(req.Kode, pptxLink, pdfLink); err != nil {
		h.log.WithError(err).Warn("Gagal menyimpan link file ke database, tapi file sudah digenerate")
		// Not returning error, karena file sudah berhasil digenerate
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Materi training berhasil digenerate (PPTX + PDF).",
		"pptx_link": pptxLink,
		"pdf_link":  pdfLink,
		"meta":     meta,
	})
}