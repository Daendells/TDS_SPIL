# Talent Development System (TDS)

Sistem manajemen talent development untuk evaluasi dan penilaian crew kapal.

## Tech Stack

- **Backend**: Go (Gin Framework, GORM)
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Database**: MySQL 8.0
- **Deployment**: Docker & Docker Compose

## Prerequisites

- Go 1.24.0 atau lebih baru
- Node.js 20 atau lebih baru
- MySQL 8.0 (untuk development lokal)
- Docker & Docker Compose (untuk deployment)

## Setup Development

### 1. Clone Repository

```bash
git clone <repository-url>
cd talent-development-system
```

### 2. Setup Backend

#### 2.1 Konfigurasi Environment Variables

Buat file `.env` di folder `backend/`:

```bash
cd backend
cp .env.example .env  # Jika ada file example, atau buat manual
```

Isi file `backend/.env`:

```env
WEB_PORT=8080
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tds
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_IDLE=10
DB_MAX=100
DB_LIFETIME=300
JWT_SECRET_KEY=talent-development-system-secret
ENV=development
LOG_LEVEL=6
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
UNIOFFICE_LICENSE_KEY=your_unioffice_license_key
```

#### 2.2 Install Dependencies

```bash
go mod download
```

#### 2.3 Setup Database

Pastikan MySQL sudah berjalan, lalu buat database:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE tds;
EXIT;
```

#### 2.4 Jalankan Migrasi Database

```bash
cd backend
go run cmd/migrate/main.go
```

Output yang diharapkan:
```
Migration completed successfully
```

#### 2.5 Jalankan Seeder (Opsional)

Untuk mengisi data awal dari CSV:

```bash
go run cmd/seed-csv/main.go
```

Output yang diharapkan:
```
Seeding users...
Seeding assessments...
Seeding aspects...
...
Seeding completed successfully
```

#### 2.6 Jalankan Backend Server

```bash
go run cmd/api/main.go
```

Backend akan berjalan di `http://localhost:8080`

### 3. Setup Frontend

#### 3.1 Konfigurasi Environment Variables

Buat file `.env` di folder `frontend/`:

```bash
cd frontend
cp .env.example .env  # Jika ada file example, atau buat manual
```

Isi file `frontend/.env`:

```env
JWT_SECRET=talent-development-system-secret
NEXT_PUBLIC_API_ENDPOINT=http://localhost:8080
GROQ_API_KEY=your_groq_api_key
```

#### 3.2 Install Dependencies

```bash
npm install
```

#### 3.3 Jalankan Frontend Development Server

```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:3000`

## Deployment dengan Docker

### 1. Persiapan Environment Variables

Pastikan file `.env` sudah ada di folder `backend/` dan `frontend/` seperti pada setup development di atas.

### 2. Build dan Jalankan Containers

```bash
docker-compose up -d --build
```

Perintah ini akan:
- Build image untuk backend, frontend
- Pull image MySQL 8.0
- Membuat network `spil_tds`
- Membuat volume `mysql_data` untuk persistensi database
- Menjalankan semua services

### 3. Cek Status Containers

```bash
docker-compose ps
```

Output yang diharapkan:
```
NAME            IMAGE                                   STATUS
tds_backend     talent-development-system-tds_backend   Up
tds_db          mysql:8.0                               Up (healthy)
tds_frontend    talent-development-system-tds_frontend  Up
```

### 4. Jalankan Migrasi Database (First Time Setup)

```bash
docker-compose exec tds_backend /app/main migrate
```

Atau masuk ke container dan jalankan manual:

```bash
docker-compose exec tds_backend sh
cd /app
./migrate  # Jika binary migrate sudah dibuild terpisah
```

### 5. Jalankan Seeder (Opsional)

```bash
docker-compose exec tds_backend sh
cd /app
# Jalankan seeder jika binary tersedia
```

### 6. Akses Aplikasi

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Database**: localhost:3306

### 7. Stop Containers

```bash
docker-compose down
```

Untuk stop dan hapus volumes (data database akan hilang):

```bash
docker-compose down -v
```

## Docker Services

### tds_db (MySQL)
- **Image**: mysql:8.0
- **Port**: 3306
- **Database**: tds
- **User**: tds_user
- **Password**: tds_password
- **Root Password**: root_password
- **Volume**: mysql_data (persistent storage)

### tds_backend (Go API)
- **Port**: 8080
- **Environment**: Production
- **Dependencies**: tds_db (menunggu database healthy sebelum start)

### tds_frontend (Next.js)
- **Port**: 3000
- **Environment**: Production
- **Dependencies**: tds_backend

## Struktur Project

```
talent-development-system/
├── backend/
│   ├── cmd/
│   │   ├── api/              # Main API server
│   │   ├── migrate/          # Database migration
│   │   └── seed-csv/         # CSV data seeder
│   ├── internal/
│   │   ├── config/           # Configuration
│   │   ├── controllers/      # HTTP handlers
│   │   ├── models/           # Data models
│   │   ├── repositories/     # Database repositories
│   │   └── services/         # Business logic
│   ├── .env                  # Backend environment variables
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── app/              # Next.js app directory
│   │   ├── components/       # React components
│   │   └── lib/              # Utilities
│   ├── .env                  # Frontend environment variables
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml        # Docker orchestration
```

## Development Commands

### Backend

```bash
# Run server
go run cmd/api/main.go

# Run migration
go run cmd/migrate/main.go

# Run seeder
go run cmd/seed-csv/main.go

# Run tests
go test ./...

# Build binary
go build -o main cmd/api/main.go
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Fix lint issues
npm run lint:fix

# Format code
npm run format

# Type check
npm run typecheck
```

## Troubleshooting

### Backend tidak bisa connect ke database

1. Pastikan MySQL sudah berjalan
2. Cek kredensial database di `.env`
3. Pastikan database `tds` sudah dibuat

### Frontend tidak bisa fetch data dari backend

1. Pastikan backend sudah berjalan di port 8080
2. Cek `NEXT_PUBLIC_API_ENDPOINT` di `frontend/.env`
3. Cek console browser untuk error CORS atau network

### Docker build gagal

1. Pastikan Docker daemon sudah berjalan
2. Pastikan file `.env` sudah ada di folder backend dan frontend
3. Coba clean build:
   ```bash
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Database container tidak healthy

1. Cek logs: `docker-compose logs tds_db`
2. Pastikan port 3306 tidak digunakan aplikasi lain
3. Coba restart: `docker-compose restart tds_db`

## Environment Variables Reference

### Backend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| WEB_PORT | Port untuk backend server | 8080 |
| DB_HOST | MySQL host | localhost |
| DB_PORT | MySQL port | 3306 |
| DB_NAME | Nama database | tds |
| DB_USER | MySQL user | root |
| DB_PASSWORD | MySQL password | - |
| JWT_SECRET_KEY | Secret key untuk JWT | - |
| ENV | Environment (development/production) | development |
| GROQ_API_KEY | API key untuk Groq AI | - |
| GROQ_MODEL | Model Groq yang digunakan | llama-3.3-70b-versatile |

### Frontend (.env)

| Variable | Description | Default |
|----------|-------------|---------|
| JWT_SECRET | Secret key untuk JWT (harus sama dengan backend) | - |
| NEXT_PUBLIC_API_ENDPOINT | URL backend API untuk client-side | http://localhost:8080 |
| GROQ_API_KEY | API key untuk Groq AI | - |

## Git Workflow

### Pre-commit Hooks

Project ini menggunakan Husky untuk pre-commit hooks yang akan otomatis menjalankan:
- ESLint
- Prettier format check
- TypeScript type check

Jika ada error, commit akan dibatalkan. Fix error terlebih dahulu sebelum commit.

### Commit Changes

```bash
git add .
git commit -m "feat: description"
git push
```

## Contributing

1. Buat branch baru dari `main`
2. Commit changes dengan pesan yang jelas
3. Push ke remote repository
4. Buat Pull Request

## License

[Sesuaikan dengan license project Anda]

## Contact

[Tambahkan informasi kontak atau link dokumentasi tambahan]
