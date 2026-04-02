-- Add new fields to companies table for the enhanced company form
ALTER TABLE companies ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS target_audience text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS usp text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tone_of_voice text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS output_language text DEFAULT 'nl';
