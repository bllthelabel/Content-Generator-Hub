-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create brand_settings table
CREATE TABLE IF NOT EXISTS public.brand_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE UNIQUE,
  primary_color TEXT DEFAULT '#4d7c3a',
  secondary_color TEXT DEFAULT '#1f2937',
  accent_color TEXT DEFAULT '#f59e0b',
  logo_url TEXT,
  logo_position TEXT DEFAULT 'top-left',
  company_type TEXT,
  target_audience TEXT,
  tone_of_voice TEXT,
  company_description TEXT,
  usp TEXT,
  visual_style_type TEXT,
  illustration_style TEXT,
  default_hashtags TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create custom_templates table
CREATE TABLE IF NOT EXISTS public.custom_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  html TEXT NOT NULL,
  css TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their own companies" ON public.companies
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert their own companies" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own companies" ON public.companies
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own companies" ON public.companies
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for brand_settings
CREATE POLICY "Users can view brand settings of their companies" ON public.brand_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE companies.id = brand_settings.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert brand settings for their companies" ON public.brand_settings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE companies.id = brand_settings.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update brand settings of their companies" ON public.brand_settings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE companies.id = brand_settings.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete brand settings of their companies" ON public.brand_settings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE companies.id = brand_settings.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- RLS Policies for custom_templates
CREATE POLICY "Users can view templates of their companies" ON public.custom_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE companies.id = custom_templates.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert templates for their companies" ON public.custom_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE companies.id = custom_templates.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update templates of their companies" ON public.custom_templates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE companies.id = custom_templates.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete templates of their companies" ON public.custom_templates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.companies 
      WHERE companies.id = custom_templates.company_id 
      AND companies.owner_id = auth.uid()
    )
  );

-- Create function to auto-create brand_settings when company is created
CREATE OR REPLACE FUNCTION public.handle_new_company()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.brand_settings (company_id)
  VALUES (NEW.id)
  ON CONFLICT (company_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_company_created ON public.companies;
CREATE TRIGGER on_company_created
  AFTER INSERT ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_company();
