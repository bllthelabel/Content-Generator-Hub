import { LayoutType, GeneratedContent } from './types';

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

export const LAYOUT_DESCRIPTIONS: Record<LayoutType, { title: string; description: string }> = {
  THOUGHT_LEADERSHIP: { title: 'Thought Leadership', description: 'Share industry insights and expertise.' },
  TEAM_CULTURE: { title: 'Team Culture', description: 'Highlight your team and company culture.' },
  CONVERSION: { title: 'Conversion', description: 'Drive sales or sign-ups with a strong CTA.' },
  KNOWLEDGE_SHARE: { title: 'Knowledge Share', description: 'Educate your audience with tips and facts.' },
  GROWTH_METRICS: { title: 'Growth Metrics', description: 'Showcase your success with data and numbers.' },
  COMPARISON: { title: 'Comparison', description: 'Compare products, services, or approaches.' },
  PROCESS_TIMELINE: { title: 'Process Timeline', description: 'Explain how your process works step-by-step.' },
  VENTURE_SPOTLIGHT: { title: 'Venture Spotlight', description: 'Announce new projects, products, or ventures.' },
  VISUAL_STORY: { title: 'Visual Story', description: 'Tell a story primarily through images.' },
  PHOTO_COLLAGE: { title: 'Photo Collage', description: 'Display multiple images in a collage format.' },
};
