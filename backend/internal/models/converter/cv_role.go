package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func ToCVRoleResponse(data *domain.CVRole) web.CVRoleResponse {
	return web.CVRoleResponse{
		ID:          data.ID,
		Name:        data.Name,
		Description: data.Description,
		Category:    data.Category,
		CreatedAt:   data.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:   data.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

func ToCVRoleResponses(roles []domain.CVRole) []web.CVRoleResponse {
	responses := make([]web.CVRoleResponse, 0, len(roles))
	for i := range roles {
		responses = append(responses, ToCVRoleResponse(&roles[i]))
	}
	return responses
}
