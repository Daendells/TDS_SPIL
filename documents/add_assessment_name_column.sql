-- Migration to add assessment_name column to assessments table
ALTER TABLE `assessments` 
ADD COLUMN `assessment_name` varchar(50) NOT NULL AFTER `role`;

-- Update existing records with default assessment names based on role
UPDATE `assessments` 
SET `assessment_name` = CONCAT(UPPER(LEFT(`role`, 1)), LOWER(SUBSTRING(`role`, 2)), ' Assessment')
WHERE `assessment_name` = '';