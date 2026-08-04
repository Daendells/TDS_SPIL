package repositories

import (
	"strings"

	"backend/internal/models/web"

	"gorm.io/gorm"
)

type SeamanRepository struct {
	DB *gorm.DB
}

func NewSeamanRepository(db *gorm.DB) *SeamanRepository {
	return &SeamanRepository{DB: db}
}

func (r *SeamanRepository) FindAvailableSeamen(
	query string,
	limit int,
) ([]web.SeamanLookupResponse, error) {

	if limit <= 0 || limit > 50 {
		limit = 10
	}

	q := "%" + strings.ToLower(query) + "%"

	var results []web.SeamanLookupResponse

	err := r.DB.Raw(`
		SELECT
    s.name AS name,
    s.seaman_code AS seaman_code,
    s.seafarer_code AS seafarer_code,
    s.last_position AS jabatan,
    s.certificate AS certificate,
    s.last_location AS vessel_name
FROM seamen_cache s
WHERE NOT EXISTS (
    SELECT 1
    FROM reports m
    WHERE m.seaman_code = s.seaman_code
)
AND s.name != ''
AND s.name IS NOT NULL
AND (
    LOWER(s.name) LIKE ?
    OR s.seaman_code LIKE ?
)
ORDER BY s.name
LIMIT ?
	`, q, "%"+query+"%", limit).
		Scan(&results).Error

	return results, err
}
