package services

import (
	"fmt"
	"strings"

	"backend/internal/models/converter"
	"backend/internal/models/domain"
	"backend/internal/models/web"
	"backend/internal/repositories"

	"github.com/go-playground/validator/v10"
	"github.com/sirupsen/logrus"
	"gorm.io/gorm"
)

type CVRoleService struct {
	DB         *gorm.DB
	Log        *logrus.Logger
	Validate   *validator.Validate
	Repository *repositories.CVRoleRepository
}

func NewCVRoleService(db *gorm.DB, log *logrus.Logger, validate *validator.Validate, repository *repositories.CVRoleRepository) *CVRoleService {
	return &CVRoleService{
		DB:         db,
		Log:        log,
		Validate:   validate,
		Repository: repository,
	}
}

func (s *CVRoleService) GetAll() ([]web.CVRoleResponse, error) {
	roles, err := s.Repository.FindAll(s.DB)
	if err != nil {
		return nil, err
	}
	return converter.ToCVRoleResponses(roles), nil
}

func (s *CVRoleService) GetByID(id int) (*web.CVRoleResponse, error) {
	role, err := s.Repository.FindByID(s.DB, id)
	if err != nil {
		return nil, err
	}
	res := converter.ToCVRoleResponse(role)
	return &res, nil
}

func (s *CVRoleService) Create(req *web.CVRoleCreateRequest) (*web.CVRoleResponse, error) {
	if err := s.Validate.Struct(req); err != nil {
		return nil, err
	}

	trimmedName := strings.ToUpper(strings.TrimSpace(req.Name))
	if trimmedName == "" {
		return nil, fmt.Errorf("role name cannot be empty")
	}

	// Cek apakah nama role sudah ada
	existing, _ := s.Repository.FindByName(s.DB, trimmedName)
	if existing != nil {
		return nil, fmt.Errorf("role with name '%s' already exists", trimmedName)
	}

	category := strings.ToUpper(strings.TrimSpace(req.Category))
	if category == "" {
		category = "GENERAL"
	}

	newRole := &domain.CVRole{
		Name:        trimmedName,
		Description: strings.TrimSpace(req.Description),
		Category:    category,
	}

	if err := s.Repository.Create(s.DB, newRole); err != nil {
		return nil, err
	}

	res := converter.ToCVRoleResponse(newRole)
	return &res, nil
}

func (s *CVRoleService) Update(id int, req *web.CVRoleUpdateRequest) (*web.CVRoleResponse, error) {
	if err := s.Validate.Struct(req); err != nil {
		return nil, err
	}

	role, err := s.Repository.FindByID(s.DB, id)
	if err != nil {
		return nil, fmt.Errorf("role not found")
	}

	if req.Name != "" {
		trimmedName := strings.ToUpper(strings.TrimSpace(req.Name))
		existing, _ := s.Repository.FindByName(s.DB, trimmedName)
		if existing != nil && existing.ID != role.ID {
			return nil, fmt.Errorf("role with name '%s' already exists", trimmedName)
		}
		role.Name = trimmedName
	}

	role.Description = strings.TrimSpace(req.Description)

	if req.Category != "" {
		role.Category = strings.ToUpper(strings.TrimSpace(req.Category))
	}

	if err := s.Repository.Update(s.DB, role); err != nil {
		return nil, err
	}

	updated, err := s.Repository.FindByID(s.DB, id)
	if err != nil {
		return nil, err
	}

	res := converter.ToCVRoleResponse(updated)
	return &res, nil
}

func (s *CVRoleService) Delete(id int) error {
	_, err := s.Repository.FindByID(s.DB, id)
	if err != nil {
		return fmt.Errorf("role not found")
	}
	return s.Repository.Delete(s.DB, id)
}
