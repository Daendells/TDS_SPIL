-- Migration: Add missing columns to support image uploads and assessments
-- Run this script to update your existing database

USE tds;

-- Add missing columns to questions table
ALTER TABLE `questions` 
ADD COLUMN `assessment_id` BIGINT AFTER `question_id`,
ADD COLUMN `category` VARCHAR(255) DEFAULT NULL AFTER `question_text`,
ADD COLUMN `is_image` INT DEFAULT 0 AFTER `category`,
ADD COLUMN `image_url` VARCHAR(500) DEFAULT NULL AFTER `is_image`;

-- Add foreign key constraint for assessment_id if assessments table exists
-- ALTER TABLE `questions` ADD CONSTRAINT `fk_questions_assessment` 
-- FOREIGN KEY (`assessment_id`) REFERENCES `assessments`(`assessment_id`) ON DELETE CASCADE;

-- Add missing image_url column to options table
ALTER TABLE `options` 
ADD COLUMN `image_url` VARCHAR(500) DEFAULT NULL AFTER `is_image`;

-- Create index for better query performance
CREATE INDEX idx_questions_assessment_id ON questions(assessment_id);
CREATE INDEX idx_questions_role ON questions(role(50));
CREATE INDEX idx_options_question_id ON options(question_id);

COMMIT;
