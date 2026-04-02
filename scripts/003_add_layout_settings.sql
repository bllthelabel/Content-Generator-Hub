-- Add enabled_layouts to companies (JSON array of enabled layout types)
ALTER TABLE companies ADD COLUMN IF NOT EXISTS enabled_layouts jsonb DEFAULT '["THOUGHT_LEADERSHIP", "TEAM_CULTURE", "CONVERSION", "KNOWLEDGE_SHARE", "GROWTH_METRICS", "COMPARISON", "PROCESS_TIMELINE", "VENTURE_SPOTLIGHT", "VISUAL_STORY", "PHOTO_COLLAGE"]'::jsonb;

-- Add layout_type to custom_templates to link templates to specific layouts
ALTER TABLE custom_templates ADD COLUMN IF NOT EXISTS layout_type text;

-- Add is_active to custom_templates
ALTER TABLE custom_templates ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
