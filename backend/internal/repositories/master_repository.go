package repositories

import (
	"strings"

	"backend/internal/models/domain"
	"backend/internal/models/web"

	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type MasterRepository struct {
	Log *logrus.Logger
}

func NewMasterRepository(log *logrus.Logger) *MasterRepository {
	return &MasterRepository{Log: log}
}
func (r *MasterRepository) SelectAll(db *gorm.DB, req *web.MasterListRequest, masters *[]domain.MasterReport) error {
	var queryBuilder strings.Builder
	var args []interface{}
	var conditions []string

	// ✅ Unified search by name OR seafarer code
	if req.Query != "" {
		conditions = append(conditions, "(LOWER(nama) LIKE ? OR seafarer_code LIKE ?)")
		args = append(args, "%"+strings.ToLower(req.Query)+"%", "%"+req.Query+"%")
	}

	// ✅ Pagination condition
	if req.AnchorID > 0 {
		if req.Page == "next" {
			conditions = append(conditions, "id > ?")
		} else {
			conditions = append(conditions, "id < ?")
		}
		args = append(args, req.AnchorID)
	}

	// ✅ Base query
	queryBuilder.WriteString("SELECT * FROM reports")
	if len(conditions) > 0 {
		queryBuilder.WriteString(" WHERE " + strings.Join(conditions, " AND "))
	}

	// ✅ Order and limit
	if req.Page == "next" {
		queryBuilder.WriteString(" ORDER BY id ASC LIMIT ?")
	} else {
		queryBuilder.WriteString(" ORDER BY id DESC LIMIT ?")
	}
	args = append(args, req.PageSize+1)

	query := queryBuilder.String()

	r.Log.Infof("Executing Master Query: %s with args: %+v", query, args)

	if err := db.Raw(query, args...).Scan(masters).Error; err != nil {
		r.Log.Warnf("failed to query master reports: %+v", err)
		return err
	}
	return nil
}

func (r *MasterRepository) Create(db *gorm.DB, master *domain.FullReport) error {
	if err := db.Create(master).Error; err != nil {
		r.Log.Warnf("failed to insert master report: %+v", err)
		return err
	}
	return nil
}
