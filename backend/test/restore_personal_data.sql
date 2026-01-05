-- Restore data pribadi dari backup table
-- Jalankan ini setelah testing selesai untuk restore data asli

-- Pastikan table backup ada
-- SELECT COUNT(*) FROM reports_backup_personal_data;

-- Restore data pribadi dari backup
UPDATE reports r
INNER JOIN reports_backup_personal_data b ON r.id = b.id
SET 
    r.nama = b.nama,
    r.tanggal_lahir = b.tanggal_lahir,
    r.age = b.age,
    r.jabatan = b.jabatan,
    r.vessel_name = b.vessel_name,
    r.seafarer_code = b.seafarer_code,
    r.certificate = b.certificate,
    r.start_date = b.start_date,
    r.vessel_history = b.vessel_history;

-- Verifikasi restore berhasil
SELECT COUNT(*) as total_reports,
       SUM(CASE WHEN nama IS NOT NULL THEN 1 ELSE 0 END) as nama_not_null,
       SUM(CASE WHEN tanggal_lahir IS NOT NULL THEN 1 ELSE 0 END) as tanggal_lahir_not_null,
       SUM(CASE WHEN age IS NOT NULL THEN 1 ELSE 0 END) as age_not_null,
       SUM(CASE WHEN jabatan IS NOT NULL THEN 1 ELSE 0 END) as jabatan_not_null,
       SUM(CASE WHEN vessel_name IS NOT NULL THEN 1 ELSE 0 END) as vessel_name_not_null
FROM reports;

-- Drop backup table setelah restore berhasil (optional)
-- DROP TABLE reports_backup_personal_data;
