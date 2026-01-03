package converter

import (
	"backend/internal/models/domain"
	"backend/internal/models/web"
)

func ToUserData(data *domain.User) web.UserData {
	return web.UserData{
		ID:       data.ID,
		Username: data.Username,
	}
}

func ToUserListResponse(data *domain.User) web.UserListResponse {
	return web.UserListResponse{
		ID:        data.ID,
		Username:  data.Username,
		Role:      data.Role,
		CreatedAt: data.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt: data.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}
