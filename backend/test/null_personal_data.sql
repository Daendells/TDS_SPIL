-- Backup data pribadi sebelum di-NULL-kan (untuk rollback nanti)
-- Jalankan query ini untuk backup terlebih dahulu:
-- CREATE TABLE reports_backup_personal_data AS 
-- SELECT id, nama, tanggal_lahir, age, jabatan, vessel_name, seafarer_code, certificate, start_date, vessel_history 
-- FROM reports;

-- NULL-kan data pribadi di table reports untuk testing
-- GUNAKAN DENGAN HATI-HATI! Pastikan sudah backup dulu!
UPDATE reports 
SET 
    nama = NULL,
    tanggal_lahir = NULL,
    age = NULL,
    jabatan = NULL,
    vessel_name = NULL,
    seafarer_code = NULL,
    certificate = NULL,
    start_date = NULL,
    vessel_history = NULL;

-- Verifikasi bahwa data sudah NULL
SELECT COUNT(*) as total_reports,
       SUM(CASE WHEN nama IS NULL THEN 1 ELSE 0 END) as nama_null,
       SUM(CASE WHEN tanggal_lahir IS NULL THEN 1 ELSE 0 END) as tanggal_lahir_null,
       SUM(CASE WHEN age IS NULL THEN 1 ELSE 0 END) as age_null,
       SUM(CASE WHEN jabatan IS NULL THEN 1 ELSE 0 END) as jabatan_null,
       SUM(CASE WHEN vessel_name IS NULL THEN 1 ELSE 0 END) as vessel_name_null,
       SUM(CASE WHEN seafarer_code IS NULL THEN 1 ELSE 0 END) as seafarer_code_null,
       SUM(CASE WHEN certificate IS NULL THEN 1 ELSE 0 END) as certificate_null,
       SUM(CASE WHEN start_date IS NULL THEN 1 ELSE 0 END) as start_date_null,
       SUM(CASE WHEN vessel_history IS NULL THEN 1 ELSE 0 END) as vessel_history_null
FROM reports;
