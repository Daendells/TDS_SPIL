package web

type UserCreateRequest struct {
	Username string `json:"username" binding:"required,min=3,max=100"`
	Password string `json:"password" binding:"required,min=6"`
	Role     string `json:"role" binding:"required,oneof=admin"`
}

type UserUpdateRequest struct {
	Username string `json:"username" binding:"omitempty,min=3,max=100"`
	Password string `json:"password" binding:"omitempty,min=6"`
	Role     string `json:"role" binding:"omitempty,oneof=admin"`
}

type UserListResponse struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	Role      string `json:"role"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}
