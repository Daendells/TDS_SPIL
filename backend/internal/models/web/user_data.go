package web

type UserData struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
}

type UserLoginResponse struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Token    string `json:"token"`
}
