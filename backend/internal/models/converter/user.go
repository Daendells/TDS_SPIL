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
