export type LayoutType = 'THOUGHT_LEADERSHIP' | 'TEAM_CULTURE' | 'CONVERSION' | 'KNOWLEDGE_SHARE' | 'GROWTH_METRICS' | 'COMPARISON' | 'PROCESS_TIMELINE' | 'VENTURE_SPOTLIGHT' | 'VISUAL_STORY' | 'PHOTO_COLLAGE';
export type AspectRatio = 'SQUARE' | 'PORTRAIT' | 'STORY' | 'LANDSCAPE';
export type GenerationMode = 'SINGLE' | 'CAROUSEL';
export type ImageSize = '512px' | '1K' | '2K' | '4K';

export interface GeneratedContent {
  imageBase64: string | null;
  secondaryImage: string | null;
  tertiaryImage: string | null;
  tagline: string;
  headline: string;
  subtext: string;
  body: string;
  cta: string;
  imagePrompt: string;
  icon: string;
}

export interface GenerationStatus {
  isGenerating: boolean;
  step: 'IDLE' | 'ANALYZING' | 'GENERATING_IMAGE' | 'DONE' | 'ERROR';
  error?: string;
}

export interface ContentVisibility {
  tagline: boolean;
  headline: boolean;
  subtext: boolean;
  body: boolean;
  cta: boolean;
  icon: boolean;
  logo: boolean;
  box: boolean;
}

export interface CustomTemplate {
  id: string;
  name: string;
  html: string;
  css: string;
}

export interface BrandSettings {
  id?: string;
  company_id?: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string | null;
  logo_position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  company_type: string;
  target_audience: string;
  tone_of_voice: string;
  company_description: string;
  usp?: string;
  visual_style_type?: string;
  illustration_style?: string;
  default_hashtags?: string;
}

export interface Company {
  id: string;
  name: string;
  owner_id: string;
  brand_settings?: BrandSettings;
  templates?: CustomTemplate[];
  created_at: string;
  updated_at: string;
}

export const LAYOUT_OPTIONS: { id: LayoutType; label: string; icon: string; hasImage?: boolean }[] = [
  { id: 'THOUGHT_LEADERSHIP', label: 'Thought Leadership', icon: 'fa-star', hasImage: true },
  { id: 'TEAM_CULTURE', label: 'Team Culture', icon: 'fa-users', hasImage: true },
  { id: 'CONVERSION', label: 'Conversion', icon: 'fa-bullhorn', hasImage: true },
  { id: 'KNOWLEDGE_SHARE', label: 'Knowledge Share', icon: 'fa-lightbulb', hasImage: true },
  { id: 'GROWTH_METRICS', label: 'Growth Metrics', icon: 'fa-chart-line', hasImage: true },
  { id: 'COMPARISON', label: 'Comparison', icon: 'fa-balance-scale', hasImage: true },
  { id: 'PROCESS_TIMELINE', label: 'Process Timeline', icon: 'fa-stream', hasImage: true },
  { id: 'VENTURE_SPOTLIGHT', label: 'Venture Spotlight', icon: 'fa-rocket', hasImage: true },
  { id: 'VISUAL_STORY', label: 'Visual Story', icon: 'fa-image', hasImage: true },
  { id: 'PHOTO_COLLAGE', label: 'Photo Collage', icon: 'fa-images', hasImage: true },
];

export const FORMAT_OPTIONS: { id: AspectRatio; label: string; icon: string }[] = [
  { id: 'SQUARE', label: 'Square (1:1)', icon: 'fa-square' },
  { id: 'PORTRAIT', label: 'Portrait (4:5)', icon: 'fa-portrait' },
  { id: 'STORY', label: 'Story (9:16)', icon: 'fa-mobile' },
  { id: 'LANDSCAPE', label: 'Landscape (16:9)', icon: 'fa-image' },
];

export const IMAGE_SIZE_OPTIONS: ImageSize[] = ['512px', '1K', '2K', '4K'];

export const LAYOUT_DEFAULTS: Partial<Record<LayoutType, Partial<GeneratedContent>>> = {
  THOUGHT_LEADERSHIP: { tagline: 'Insight', headline: 'The future is now', subtext: 'Industry Trends', body: 'Lorem ipsum...', cta: 'Read More' },
  TEAM_CULTURE: { tagline: 'Team', headline: 'Meet our team', subtext: 'Behind the scenes', body: 'Lorem ipsum...', cta: 'Join Us' },
  CONVERSION: { tagline: 'Offer', headline: 'Special Offer', subtext: 'Limited Time', body: 'Lorem ipsum...', cta: 'Buy Now' },
  KNOWLEDGE_SHARE: { tagline: 'Tip', headline: 'Did you know?', subtext: 'Fun Fact', body: 'Lorem ipsum...', cta: 'Learn More' },
  GROWTH_METRICS: { tagline: 'Growth', headline: 'Our impact', subtext: 'By the numbers', body: 'Lorem ipsum...', cta: 'See Report' },
  COMPARISON: { tagline: 'Versus', headline: 'Option A vs B', subtext: 'Which is better?', body: 'Lorem ipsum...', cta: 'Compare' },
  PROCESS_TIMELINE: { tagline: 'Process', headline: 'How it works', subtext: 'Step by step', body: 'Lorem ipsum...', cta: 'Start Now' },
  VENTURE_SPOTLIGHT: { tagline: 'New', headline: 'Introducing X', subtext: 'Our latest venture', body: 'Lorem ipsum...', cta: 'Explore' },
  VISUAL_STORY: { tagline: 'Story', headline: 'A visual journey', subtext: 'In pictures', body: 'Lorem ipsum...', cta: 'View Gallery' },
  PHOTO_COLLAGE: { tagline: 'Gallery', headline: 'Our work', subtext: 'Portfolio', body: 'Lorem ipsum...', cta: 'See More' },
};

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  primary_color: '#4d7c3a',
  secondary_color: '#1f2937',
  accent_color: '#f59e0b',
  logo_url: null,
  logo_position: 'top-left',
  company_type: '',
  target_audience: '',
  tone_of_voice: '',
  company_description: '',
  usp: '',
  visual_style_type: '',
  illustration_style: '',
  default_hashtags: ''
};

export const DEFAULT_CONTENT: GeneratedContent = {
  imageBase64: null,
  secondaryImage: null,
  tertiaryImage: null,
  tagline: 'Review',
  headline: 'Eindelijk overzicht in mijn planning.',
  subtext: 'Jan de Hovenier',
  body: 'Green Gardens BV',
  cta: '5 Sterren',
  imagePrompt: '',
  icon: 'fa-solid fa-star'
};
