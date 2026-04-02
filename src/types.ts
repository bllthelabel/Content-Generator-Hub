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

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  brandSettings: BrandSettings;
  templates: CustomTemplate[];
  createdAt: any;
}

export interface BrandSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  logoPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  companyType: string;
  targetAudience: string;
  toneOfVoice: string;
  companyDescription: string;
  usp?: string;
  visualStyleType?: string;
  illustrationStyle?: string;
  defaultHashtags?: string;
}

export const LAYOUT_OPTIONS: { id: LayoutType; label: string; icon: string; hasImage?: boolean }[] = [
  { id: 'THOUGHT_LEADERSHIP', label: 'Thought Leadership', icon: 'la-star', hasImage: true },
  { id: 'TEAM_CULTURE', label: 'Team Culture', icon: 'la-users', hasImage: true },
  { id: 'CONVERSION', label: 'Conversion', icon: 'la-bullhorn', hasImage: true },
  { id: 'KNOWLEDGE_SHARE', label: 'Knowledge Share', icon: 'la-lightbulb', hasImage: true },
  { id: 'GROWTH_METRICS', label: 'Growth Metrics', icon: 'la-chart-line', hasImage: true },
  { id: 'COMPARISON', label: 'Comparison', icon: 'la-balance-scale', hasImage: true },
  { id: 'PROCESS_TIMELINE', label: 'Process Timeline', icon: 'la-stream', hasImage: true },
  { id: 'VENTURE_SPOTLIGHT', label: 'Venture Spotlight', icon: 'la-rocket', hasImage: true },
  { id: 'VISUAL_STORY', label: 'Visual Story', icon: 'la-image', hasImage: true },
  { id: 'PHOTO_COLLAGE', label: 'Photo Collage', icon: 'la-images', hasImage: true },
];

export const FORMAT_OPTIONS: { id: AspectRatio; label: string; icon: string }[] = [
  { id: 'SQUARE', label: 'Square (1:1)', icon: 'la-square' },
  { id: 'PORTRAIT', label: 'Portrait (4:5)', icon: 'la-portrait' },
  { id: 'STORY', label: 'Story (9:16)', icon: 'la-mobile' },
  { id: 'LANDSCAPE', label: 'Landscape (16:9)', icon: 'la-image' },
];

export const IMAGE_SIZE_OPTIONS: ImageSize[] = ['512px', '1K', '2K', '4K'];
