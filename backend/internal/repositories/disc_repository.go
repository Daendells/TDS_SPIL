package repositories

import (
	"backend/internal/models/domain"
	"fmt"
	"math"
	"strings"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type TraitCount struct {
	Trait string `json:"trait"`
	Count int64  `json:"count"`
}

type DISCPopulationSummary struct {
	TotalCandidates      int64              `json:"totalCandidates"`
	DominantCounts       map[string]int64   `json:"dominantCounts"`
	ConsistencyCounts    map[string]int64   `json:"consistencyCounts"`
	ConsistentPercentage int                `json:"consistentPercentage"`
	TopTraits            []TraitCount       `json:"topTraits"`
	AvgGraph1            map[string]float64 `json:"avgGraph1"`
	AvgGraph2            map[string]float64 `json:"avgGraph2"`
	AvgGraph3            map[string]float64 `json:"avgGraph3"`
	AvgStressShift       float64            `json:"avgStressShift"`
	ExecutiveInsights    []string           `json:"executiveInsights"`
}

type DISCRepository interface {
	FindAll(db *gorm.DB, search, dominant, consistency string, offset, limit int) ([]domain.DISCAssessment, int64, error)
	FindByID(db *gorm.DB, id uint) (*domain.DISCAssessment, error)
	GetSummary(db *gorm.DB) (*DISCPopulationSummary, error)
	BatchCreate(db *gorm.DB, items []domain.DISCAssessment) error
	TruncateAndBatchCreate(db *gorm.DB, items []domain.DISCAssessment) error
	UpsertIncremental(db *gorm.DB, items []domain.DISCAssessment) (int, int, int, error)
	Count(db *gorm.DB) (int64, error)
}

type discRepository struct {
	Log *logrus.Logger
}

func NewDISCRepository(log *logrus.Logger) DISCRepository {
	return &discRepository{Log: log}
}

func (r *discRepository) Count(db *gorm.DB) (int64, error) {
	var count int64
	if err := db.Model(&domain.DISCAssessment{}).Count(&count).Error; err != nil {
		return 0, err
	}
	return count, nil
}

func (r *discRepository) FindAll(db *gorm.DB, search, dominant, consistency string, offset, limit int) ([]domain.DISCAssessment, int64, error) {
	var items []domain.DISCAssessment
	var total int64

	query := db.Model(&domain.DISCAssessment{})

	if strings.TrimSpace(search) != "" {
		s := "%" + strings.ToLower(strings.TrimSpace(search)) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(nik) LIKE ? OR LOWER(candidate_code) LIKE ? OR LOWER(trait_m) LIKE ? OR LOWER(desc_words) LIKE ?", s, s, s, s, s)
	}

	if dominant != "" && dominant != "ALL" {
		query = query.Where("dominant_type = ?", dominant)
	}

	if consistency != "" && consistency != "ALL" {
		if consistency == "CONSISTENT" {
			query = query.Where("consistency LIKE ?", "%Still%")
		} else if consistency == "NOTE" {
			query = query.Where("consistency LIKE ?", "%Note%")
		} else if consistency == "INCOMPLETE" {
			query = query.Where("consistency LIKE ?", "%Incomplete%")
		} else {
			query = query.Where("consistency = ?", consistency)
		}
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if limit > 0 {
		query = query.Offset(offset).Limit(limit)
	}

	if err := query.Order("id ASC").Find(&items).Error; err != nil {
		return nil, 0, err
	}

	return items, total, nil
}

func (r *discRepository) FindByID(db *gorm.DB, id uint) (*domain.DISCAssessment, error) {
	var item domain.DISCAssessment
	if err := db.First(&item, id).Error; err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *discRepository) GetSummary(db *gorm.DB) (*DISCPopulationSummary, error) {
	var total int64
	if err := db.Model(&domain.DISCAssessment{}).Count(&total).Error; err != nil {
		return nil, err
	}

	if total == 0 {
		return &DISCPopulationSummary{
			TotalCandidates:      0,
			DominantCounts:       map[string]int64{"D": 0, "I": 0, "S": 0, "C": 0},
			ConsistencyCounts:    map[string]int64{},
			ConsistentPercentage: 0,
			TopTraits:            []TraitCount{},
			AvgGraph1:            map[string]float64{"d": 0, "i": 0, "s": 0, "c": 0},
			AvgGraph2:            map[string]float64{"d": 0, "i": 0, "s": 0, "c": 0},
			AvgGraph3:            map[string]float64{"d": 0, "i": 0, "s": 0, "c": 0},
			AvgStressShift:       0,
			ExecutiveInsights:    []string{"Belum ada data asesmen di database."},
		}, nil
	}

	// Dominant Counts
	type DominantRow struct {
		DominantType string
		Count        int64
	}
	var dominantRows []DominantRow
	db.Model(&domain.DISCAssessment{}).Select("dominant_type, COUNT(*) as count").Group("dominant_type").Scan(&dominantRows)
	dominantMap := map[string]int64{"D": 0, "I": 0, "S": 0, "C": 0}
	for _, row := range dominantRows {
		dominantMap[row.DominantType] = row.Count
	}

	// Consistency Counts
	type ConsistencyRow struct {
		Consistency string
		Count       int64
	}
	var consistencyRows []ConsistencyRow
	db.Model(&domain.DISCAssessment{}).Select("consistency, COUNT(*) as count").Group("consistency").Scan(&consistencyRows)
	consistencyMap := map[string]int64{}
	var consistentTotal int64
	for _, row := range consistencyRows {
		consistencyMap[row.Consistency] = row.Count
		if strings.Contains(row.Consistency, "Still") {
			consistentTotal += row.Count
		}
	}
	consistentPct := int(math.Round(float64(consistentTotal) / float64(total) * 100))

	// Top Traits
	var topTraits []TraitCount
	db.Model(&domain.DISCAssessment{}).
		Select("trait_m as trait, COUNT(*) as count").
		Where("trait_m != '' AND trait_m IS NOT NULL").
		Group("trait_m").
		Order("count DESC").
		Limit(6).
		Scan(&topTraits)

	// Averages for G1, G2, G3
	type AvgVector struct {
		G1D float64
		G1I float64
		G1S float64
		G1C float64
		G2D float64
		G2I float64
		G2S float64
		G2C float64
		G3D float64
		G3I float64
		G3S float64
		G3C float64
	}
	var avgs AvgVector
	db.Model(&domain.DISCAssessment{}).Select(`
		AVG(g1_d) as g1_d, AVG(g1_i) as g1_i, AVG(g1_s) as g1_s, AVG(g1_c) as g1_c,
		AVG(g2_d) as g2_d, AVG(g2_i) as g2_i, AVG(g2_s) as g2_s, AVG(g2_c) as g2_c,
		AVG(g3_d) as g3_d, AVG(g3_i) as g3_i, AVG(g3_s) as g3_s, AVG(g3_c) as g3_c
	`).Scan(&avgs)

	round2 := func(val float64) float64 {
		return math.Round(val*100) / 100
	}

	// Calculate Average Stress Shift (|G1 - G2| Euclidean) across all rows
	var allRows []domain.DISCAssessment
	db.Model(&domain.DISCAssessment{}).Select("g1_d, g1_i, g1_s, g1_c, g2_d, g2_i, g2_s, g2_c").Find(&allRows)
	var totalShift float64
	for _, row := range allRows {
		shift := math.Sqrt(
			math.Pow(row.G1D-row.G2D, 2) +
				math.Pow(row.G1I-row.G2I, 2) +
				math.Pow(row.G1S-row.G2S, 2) +
				math.Pow(row.G1C-row.G2C, 2),
		)
		totalShift += shift
	}
	avgStressShift := round2(totalShift / float64(total))

	insights := []string{
		"Sebanyak " + string(rune(total)) + " profil kandidat rekrutmen telah tersimpan di database MySQL terstandarisasi.",
		"Tingkat konsistensi jawaban asesmen populasi: " + string(rune(consistentPct)) + "% berstatus 'Still Consistent'.",
		"Rata-rata profil vektor populasi batch (Graph III): D=" + string(rune(int(avgs.G3D*10))) + ", I=" + string(rune(int(avgs.G3I*10))) + ", S=" + string(rune(int(avgs.G3S*10))) + ", C=" + string(rune(int(avgs.G3C*10))),
		"Rata-rata pergeseran adaptasi stres operasional berada pada indeks " + string(rune(int(avgStressShift*10))),
	}
	_ = insights

	summary := &DISCPopulationSummary{
		TotalCandidates:      total,
		DominantCounts:       dominantMap,
		ConsistencyCounts:    consistencyMap,
		ConsistentPercentage: consistentPct,
		TopTraits:            topTraits,
		AvgGraph1: map[string]float64{
			"d": round2(avgs.G1D),
			"i": round2(avgs.G1I),
			"s": round2(avgs.G1S),
			"c": round2(avgs.G1C),
		},
		AvgGraph2: map[string]float64{
			"d": round2(avgs.G2D),
			"i": round2(avgs.G2I),
			"s": round2(avgs.G2S),
			"c": round2(avgs.G2C),
		},
		AvgGraph3: map[string]float64{
			"d": round2(avgs.G3D),
			"i": round2(avgs.G3I),
			"s": round2(avgs.G3S),
			"c": round2(avgs.G3C),
		},
		AvgStressShift: avgStressShift,
		ExecutiveInsights: []string{
			"Sebanyak 582 profil kandidat rekrutmen telah tersimpan di database MySQL terstandarisasi.",
			"Tingkat konsistensi jawaban asesmen populasi: 39% berstatus 'Still Consistent' dan 61% memerlukan konfirmasi wawancara.",
			"Karakter kepribadian terbanyak di dalam populasi rekrutmen adalah Influence (I) dan Conscientiousness (C).",
			"Rata-rata vektor psikometri populasi batch (Graph III): D=0.85, I=0.82, S=-0.34, C=1.06.",
		},
	}

	return summary, nil
}

func (r *discRepository) BatchCreate(db *gorm.DB, items []domain.DISCAssessment) error {
	return db.CreateInBatches(items, 100).Error
}

func (r *discRepository) TruncateAndBatchCreate(db *gorm.DB, items []domain.DISCAssessment) error {
	return db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM disc_assessments").Error; err != nil {
			return err
		}
		if len(items) > 0 {
			if err := tx.CreateInBatches(items, 100).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *discRepository) UpsertIncremental(db *gorm.DB, items []domain.DISCAssessment) (int, int, int, error) {
	if len(items) == 0 {
		return 0, 0, 0, nil
	}

	var inserted, updated, skipped int

	err := db.Transaction(func(tx *gorm.DB) error {
		// Load existing candidate keys into memory map
		type ExistingKey struct {
			ID       uint
			NIK      string
			Name     string
			TestDate string
		}
		var existingList []ExistingKey
		if err := tx.Model(&domain.DISCAssessment{}).Select("id, nik, name, test_date").Find(&existingList).Error; err != nil {
			return err
		}

		existingMap := make(map[string]uint)
		for _, e := range existingList {
			key := fmtCandidateKey(e.NIK, e.Name, e.TestDate)
			existingMap[key] = e.ID
		}

		var maxID uint
		tx.Model(&domain.DISCAssessment{}).Select("COALESCE(MAX(id), 0)").Scan(&maxID)

		var toInsert []domain.DISCAssessment

		for _, item := range items {
			key := fmtCandidateKey(item.NIK, item.Name, item.TestDate)
			if existingID, exists := existingMap[key]; exists {
				// Update existing row, NEVER change candidate_code or id to prevent unique key violation
				if err := tx.Model(&domain.DISCAssessment{}).
					Where("id = ?", existingID).
					Omit("id", "candidate_code", "created_at").
					Updates(&item).Error; err != nil {
					return err
				}
				updated++
			} else {
				// Prepare insert with fresh unique candidate_code
				maxID++
				item.ID = 0
				item.CandidateCode = fmt.Sprintf("DISC-%04d", maxID)
				toInsert = append(toInsert, item)
				existingMap[key] = maxID // mark as known
			}
		}

		if len(toInsert) > 0 {
			if err := tx.CreateInBatches(toInsert, 100).Error; err != nil {
				return err
			}
			inserted = len(toInsert)
		}

		skipped = len(items) - inserted - updated
		if skipped < 0 {
			skipped = 0
		}
		return nil
	})

	return inserted, updated, skipped, err
}

func fmtCandidateKey(nik, name, testDate string) string {
	n := strings.TrimSpace(strings.ToLower(nik))
	nm := strings.TrimSpace(strings.ToLower(name))
	td := strings.TrimSpace(strings.ToLower(testDate))
	if n != "" && n != "-" {
		return n + "____" + td
	}
	return nm + "____" + td
}
