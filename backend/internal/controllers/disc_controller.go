package controllers

import (
	"backend/internal/services"
	"io"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type DISCController struct {
	Service services.DISCService
	Log     *logrus.Logger
}

func NewDISCController(service services.DISCService, log *logrus.Logger) *DISCController {
	return &DISCController{
		Service: service,
		Log:     log,
	}
}

func (ctrl *DISCController) GetSummary(c *gin.Context) {
	summary, err := ctrl.Service.GetSummary()
	if err != nil {
		ctrl.Log.Errorf("failed to get DISC summary: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data ringkasan psikometri"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "Berhasil mengambil ringkasan psikometri DISC",
		"data":    summary,
	})
}

func (ctrl *DISCController) GetCandidates(c *gin.Context) {
	search := c.Query("search")
	dominant := c.Query("dominant")
	consistency := c.Query("consistency")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "10"))

	items, total, err := ctrl.Service.GetCandidates(search, dominant, consistency, page, pageSize)
	if err != nil {
		ctrl.Log.Errorf("failed to get candidates: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil daftar kandidat"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "Berhasil mengambil data kandidat",
		"data": gin.H{
			"items":       items,
			"total":       total,
			"page":        page,
			"pageSize":    pageSize,
			"totalPages": (total + int64(pageSize) - 1) / int64(pageSize),
		},
	})
}

func (ctrl *DISCController) GetCandidateByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID kandidat tidak valid"})
		return
	}

	candidate, err := ctrl.Service.GetCandidateByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Kandidat tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "Berhasil mengambil detail kandidat",
		"data":    candidate,
	})
}

func (ctrl *DISCController) UploadCSV(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File CSV wajib diunggah"})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membaca file"})
		return
	}
	defer file.Close()

	content, err := io.ReadAll(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membaca isi file"})
		return
	}

	mode := strings.ToLower(c.DefaultQuery("mode", "incremental"))

	if mode == "replace" {
		count, err := ctrl.Service.ImportCSV(string(content))
		if err != nil {
			ctrl.Log.Errorf("failed to import CSV: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "Berhasil mengganti data psikometri DISC",
			"data": gin.H{
				"mode":          "replace",
				"totalImported": count,
			},
		})
		return
	}

	// Incremental Upsert
	inserted, updated, skipped, err := ctrl.Service.ImportCSVIncremental(string(content))
	if err != nil {
		ctrl.Log.Errorf("failed to sync CSV incrementally: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "Sinkronisasi file CSV berhasil",
		"data": gin.H{
			"mode":     "incremental",
			"inserted": inserted,
			"updated":  updated,
			"skipped":  skipped,
			"total":    inserted + updated + skipped,
		},
	})
}

func (ctrl *DISCController) ResetData(c *gin.Context) {
	count, err := ctrl.Service.ResetToDefault()
	if err != nil {
		ctrl.Log.Errorf("failed to reset DISC dataset: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mereset dataset"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "Berhasil mereset dataset ke 582 data awal",
		"data": gin.H{
			"totalImported": count,
		},
	})
}
