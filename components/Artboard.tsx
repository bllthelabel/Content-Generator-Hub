'use client'

import { forwardRef } from 'react';
import { LayoutType, AspectRatio, GeneratedContent, ContentVisibility, BrandSettings, CustomTemplate } from '@/lib/types';
import BrandLogo from './BrandLogo';

interface ArtboardProps {
  layout: LayoutType | string;
  format: AspectRatio;
  content: GeneratedContent;
  visibility: ContentVisibility;
  isDarkMode: boolean;
  applyEffect: boolean;
  slideIndex: number;
  totalSlides: number;
  isImageSpread: boolean;
  brandSettings: BrandSettings;
  customTemplate?: CustomTemplate;
}

const Artboard = forwardRef<HTMLDivElement, ArtboardProps>(({
  layout,
  format,
  content,
  visibility,
  isDarkMode,
  slideIndex,
  totalSlides,
  brandSettings,
  customTemplate
}, ref) => {
  
  const getFormatClasses = () => {
    switch (format) {
      case 'SQUARE': return 'w-[1080px] h-[1080px]';
      case 'PORTRAIT': return 'w-[1080px] h-[1350px]';
      case 'STORY': return 'w-[1080px] h-[1920px]';
      case 'LANDSCAPE': return 'w-[1920px] h-[1080px]';
      default: return 'w-[1080px] h-[1080px]';
    }
  };

  const getLogoPositionClasses = () => {
    switch (brandSettings.logo_position) {
      case 'top-left': return 'top-12 left-12';
      case 'top-right': return 'top-12 right-12';
      case 'bottom-left': return 'bottom-12 left-12';
      case 'bottom-right': return 'bottom-12 right-12';
      default: return 'top-12 left-12';
    }
  };

  const style = {
    '--color-primary': brandSettings.primary_color,
    '--color-secondary': brandSettings.secondary_color,
    '--color-accent': brandSettings.accent_color,
    backgroundColor: isDarkMode ? '#111827' : '#ffffff',
    color: isDarkMode ? '#ffffff' : '#111827',
  } as React.CSSProperties;

  // Convert pathname to API URL for private blob access
  const getImageUrl = (pathname?: string) => {
    if (!pathname) return undefined
    return `/api/file?pathname=${encodeURIComponent(pathname)}`
  }

  const renderContent = () => {
    // If custom template has an image, render it as background with content overlay
    if (customTemplate?.image_url) {
      const templateImageUrl = getImageUrl(customTemplate.image_url)
      
      return (
        <div className="absolute inset-0 z-10">
          {/* Template background image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={templateImageUrl} 
            alt="Template" 
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
          
          {/* Content overlay - positioned based on layout */}
          <div className="absolute inset-0 flex flex-col p-16">
            {visibility.logo && (
              <div className={`absolute ${getLogoPositionClasses()}`}>
                <BrandLogo logoUrl={brandSettings.logo_url} className="w-20 h-20" white={isDarkMode} />
              </div>
            )}
            
            <div className="flex-1 flex flex-col justify-center items-center text-center px-12">
              {visibility.tagline && content.tagline && (
                <div 
                  className="text-xl font-bold uppercase tracking-widest mb-4 px-4 py-2 rounded-lg"
                  style={{ 
                    color: brandSettings.primary_color,
                    backgroundColor: `${brandSettings.primary_color}15`
                  }}
                >
                  {content.tagline}
                </div>
              )}
              
              {visibility.headline && content.headline && (
                <h1 
                  className="text-5xl font-extrabold leading-tight mb-6 drop-shadow-lg"
                  style={{ color: isDarkMode ? '#ffffff' : brandSettings.secondary_color }}
                >
                  {content.headline}
                </h1>
              )}
              
              {visibility.body && content.body && (
                <p 
                  className="text-2xl leading-relaxed max-w-2xl mb-8 drop-shadow"
                  style={{ color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)' }}
                >
                  {content.body}
                </p>
              )}
              
              {visibility.cta && content.cta && (
                <div 
                  className="px-8 py-4 rounded-full text-xl font-bold text-white shadow-lg"
                  style={{ backgroundColor: brandSettings.accent_color }}
                >
                  {content.cta}
                </div>
              )}
            </div>

            {visibility.subtext && content.subtext && (
              <div 
                className="text-lg font-medium text-center"
                style={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)' }}
              >
                {content.subtext}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full w-full p-24 relative z-10">
        {visibility.logo && (
          <div className={`absolute ${getLogoPositionClasses()}`}>
            <BrandLogo logoUrl={brandSettings.logo_url} className="w-24 h-24" white={isDarkMode} />
          </div>
        )}
        
        <div className="flex-1 flex flex-col justify-center">
          {visibility.tagline && content.tagline && (
            <div className="text-2xl font-bold uppercase tracking-widest mb-6" style={{ color: 'var(--color-primary)' }}>
              {content.tagline}
            </div>
          )}
          
          {visibility.headline && content.headline && (
            <h1 className="text-7xl font-extrabold leading-tight mb-8" style={{ color: 'var(--color-secondary)' }}>
              {content.headline}
            </h1>
          )}
          
          {visibility.body && content.body && (
            <p className="text-3xl leading-relaxed opacity-80 max-w-3xl mb-12">
              {content.body}
            </p>
          )}
        </div>

        <div className="flex justify-between items-end">
          {visibility.subtext && content.subtext && (
            <div className="text-2xl font-medium opacity-60">
              {content.subtext}
            </div>
          )}
          
          {visibility.cta && content.cta && (
            <div className="px-8 py-4 rounded-full text-2xl font-bold text-white" style={{ backgroundColor: 'var(--color-accent)' }}>
              {content.cta}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={ref}
      className={`relative overflow-hidden shadow-2xl ${getFormatClasses()}`}
      style={style}
    >
      {content.imageBase64 && !customTemplate && (
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={content.imageBase64} 
            alt="Background" 
            className="w-full h-full object-cover opacity-20"
          />
        </div>
      )}
      {renderContent()}
      
      {totalSlides > 1 && !customTemplate && (
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full ${i === slideIndex ? 'opacity-100' : 'opacity-30'}`}
              style={{ backgroundColor: 'var(--color-primary)' }}
            />
          ))}
        </div>
      )}
    </div>
  );
});

Artboard.displayName = 'Artboard';

export default Artboard;
