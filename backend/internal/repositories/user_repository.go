package repositories

import (
	"backend/internal/models/domain"

	"github.com/sirupsen/logrus"
)

type UserReporsitory struct {
	Repository[domain.User]
	Log *logrus.Logger
}

func NewUserReposiotry(log *logrus.Logger) *UserReporsitory {
	return &UserReporsitory{
		Log: log,
	}
}
