package services

import (
	"backend/internal/models/web"
	"backend/internal/repositories"
)

type SeamanService struct {
	repo *repositories.SeamanRepository
}

func NewSeamanService(repo *repositories.SeamanRepository) *SeamanService {
	return &SeamanService{repo: repo}
}

func (s *SeamanService) SearchAvailableSeamen(
	query string,
	limit int,
) ([]web.SeamanLookupResponse, error) {

	return s.repo.FindAvailableSeamen(query, limit)
}
