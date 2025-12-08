# User Management API Documentation

## Overview

User Management API memungkinkan admin untuk membuat, membaca, mengupdate, dan menghapus user dalam sistem.

## Base URL

```
http://localhost:8080/api/users
```

## Authentication

Semua endpoint memerlukan JWT token dalam header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Create User (Admin Only)

**POST** `/api/users`

**Request Body:**

```json
{
  "username": "admin_user",
  "password": "password123",
  "role": "admin"
}
```

**Validation Rules:**

- `username`: Required, min 3, max 100 characters, must be unique
- `password`: Required, min 6 characters
- `role`: Required, currently only accepts "admin"

**Response (201 Created):**

```json
{
  "code": 201,
  "status": "User created successfully",
  "data": {
    "id": 1,
    "username": "admin_user",
    "role": "admin",
    "createdAt": "2024-12-08 10:30:45",
    "updatedAt": "2024-12-08 10:30:45"
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "code": 400,
  "status": "Bad Request",
  "error": "username already exists"
}
```

---

### 2. Get All Users

**GET** `/api/users`

**Query Parameters:** None

**Response (200 OK):**

```json
{
  "code": 200,
  "status": "OK",
  "data": [
    {
      "id": 1,
      "username": "admin_user",
      "role": "admin",
      "createdAt": "2024-12-08 10:30:45",
      "updatedAt": "2024-12-08 10:30:45"
    },
    {
      "id": 2,
      "username": "another_admin",
      "role": "admin",
      "createdAt": "2024-12-08 11:15:30",
      "updatedAt": "2024-12-08 11:15:30"
    }
  ]
}
```

---

### 3. Get User by ID

**GET** `/api/users/:id`

**Path Parameters:**

- `id` (required): User ID

**Response (200 OK):**

```json
{
  "code": 200,
  "status": "OK",
  "data": {
    "id": 1,
    "username": "admin_user",
    "role": "admin",
    "createdAt": "2024-12-08 10:30:45",
    "updatedAt": "2024-12-08 10:30:45"
  }
}
```

**Error Response (404 Not Found):**

```json
{
  "code": 404,
  "status": "Not Found",
  "error": "User not found"
}
```

---

### 4. Update User

**PUT** `/api/users/:id`

**Path Parameters:**

- `id` (required): User ID

**Request Body:**

```json
{
  "password": "newpassword123",
  "role": "admin"
}
```

**Validation Rules:**

- `password`: Optional, min 6 characters if provided
- `role`: Optional, currently only accepts "admin"

**Response (200 OK):**

```json
{
  "code": 200,
  "status": "User updated successfully",
  "data": {
    "id": 1,
    "username": "admin_user",
    "role": "admin",
    "createdAt": "2024-12-08 10:30:45",
    "updatedAt": "2024-12-08 10:35:20"
  }
}
```

---

### 5. Delete User

**DELETE** `/api/users/:id`

**Path Parameters:**

- `id` (required): User ID

**Response (200 OK):**

```json
{
  "code": 200,
  "status": "User deleted successfully",
  "data": null
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "code": 500,
  "status": "Internal Server Error",
  "error": "Failed to delete user"
}
```

---

## cURL Examples

### Create User

```bash
curl -X POST http://localhost:8080/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "newadmin",
    "password": "secure_password",
    "role": "admin"
  }'
```

### Get All Users

```bash
curl -X GET http://localhost:8080/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get User by ID

```bash
curl -X GET http://localhost:8080/api/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update User

```bash
curl -X PUT http://localhost:8080/api/users/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "password": "new_password",
    "role": "admin"
  }'
```

### Delete User

```bash
curl -X DELETE http://localhost:8080/api/users/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Error Handling

### Common Error Codes

| Status Code | Meaning                        |
| ----------- | ------------------------------ |
| 200         | Success                        |
| 201         | Created                        |
| 400         | Bad Request (validation error) |
| 404         | Not Found                      |
| 500         | Internal Server Error          |

### Error Response Format

```json
{
  "code": <status_code>,
  "status": "<status_message>",
  "error": "<error_description>"
}
```

---

## Notes

- Password disimpan dengan bcrypt hashing, tidak bisa di-retrieve
- Username harus unik dalam sistem
- Role saat ini hanya mendukung "admin"
- Semua timestamp dalam format: YYYY-MM-DD HH:MM:SS (UTC)
- Token tidak disertakan dalam response login, gunakan token dari endpoint login terlebih dahulu
