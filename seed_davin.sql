-- =====================================================================
-- Seed Script: User Default untuk Login
-- Jalankan dengan:
--   docker cp seed_davin.sql mysql-container:/tmp/seed_davin.sql
--   docker exec mysql-container mysql -u tds_user -ptds_pass tds -e "source /tmp/seed_davin.sql"
-- =====================================================================

-- Buat tabel users jika belum ada (optional, biasanya sudah dibuat oleh migrate)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin') DEFAULT 'admin' NOT NULL,
    sso_id VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert atau update user davin
-- Password: davin (bcrypt hash, cost=10, compatible dengan golang.org/x/crypto/bcrypt)
INSERT INTO users (username, password, role, created_at, updated_at)
VALUES (
    'davin',
    '$2b$10$uwgivjPjqhktcXm.t6uzSuq9vcTiaFpR5ONtKrdGv5xlK/3nyaf8W',
    'admin',
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE 
    password = '$2b$10$uwgivjPjqhktcXm.t6uzSuq9vcTiaFpR5ONtKrdGv5xlK/3nyaf8W',
    updated_at = NOW();

-- Verifikasi hasil
SELECT id, username, role, created_at FROM users;
