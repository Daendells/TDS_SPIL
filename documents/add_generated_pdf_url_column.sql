-- Migration: Add generated_pdf_url column to training table
-- Purpose: Store URL for generated detailed PDF learning guide

USE tds;

-- Add generated_pdf_url column to training table
ALTER TABLE `training` 
ADD COLUMN `generated_pdf_url` varchar(512) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL 
AFTER `generated_file_url`;

-- Verify the change
DESCRIBE `training`;
