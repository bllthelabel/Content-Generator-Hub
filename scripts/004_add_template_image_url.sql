-- Add image_url column to custom_templates for storing template background images
ALTER TABLE custom_templates ADD COLUMN IF NOT EXISTS image_url TEXT;
