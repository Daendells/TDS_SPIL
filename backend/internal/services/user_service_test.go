package services

import (
	"testing"

	"backend/internal/models/domain"

	"github.com/stretchr/testify/require"
)

func TestLoginRejectsLocalPasswordForSSOLinkedUser(t *testing.T) {
	ssoID := "sso-user-id"
	service := &UserService{}
	user := &domain.User{
		Username: "sso_user",
		Password: "$2a$10$someHashThatMustNeverBeUsedForLocalLogin",
		SSOID:    &ssoID,
	}

	response, err := service.Login(user, "any-password")

	require.Nil(t, response)
	require.EqualError(t, err, "invalid username or password")
}
