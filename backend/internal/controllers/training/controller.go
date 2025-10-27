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
		Kode          string `json:"kode" binding:"required"`
		TopikTraining string `json:"topik_training" binding:"required"`
		Kompetensi    string `json:"kompetensi" binding:"required"`
		Referensi     string `json:"referensi"`
		Level         int    `json:"lvl"`
		Tools         string `json:"tools_training"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Request tidak valid: " + err.Error(),
		})
		return
	}

	link, meta, err := h.aiSvc.GenerateAndBuildPPTX(c.Request.Context(), training.GenerateInput{
		Kode:          req.Kode,
		TopikTraining: req.TopikTraining,
		Kompetensi:    req.Kompetensi,
		Referensi:     req.Referensi,
		Level:         req.Level,
		Tools:         req.Tools,
	})

	if err != nil {
		h.log.WithError(err).Error("Gagal generate materi training")
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Gagal membuat materi training: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Materi training berhasil digenerate.",
		"link":    link,
		"meta":    meta,
	})
}