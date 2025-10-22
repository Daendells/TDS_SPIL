-- Add unique constraint to prevent duplicate roles in assessments table
ALTER TABLE `assessments` ADD UNIQUE KEY `unique_role` (`role`);