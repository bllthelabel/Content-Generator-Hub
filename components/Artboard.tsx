'use client'

import { forwardRef } from 'react';
import Mustache from 'mustache';
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

  const renderContent = () => {
    if (customTemplate) {
      console.log("[v0] Artboard - Rendering custom template:", { templateId: customTemplate.id, templateName: customTemplate.name })
      
      const templateData = {
        ...content,
        brand: brandSettings,
        isDarkMode,
        slideIndex: slideIndex + 1,
        totalSlides
      };

      try {
        let cleanHtml = customTemplate.html;
        console.log("[v0] Artboard - Original HTML length:", cleanHtml.length)
        
        const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        if (bodyMatch) {
          cleanHtml = bodyMatch[1];
          console.log("[v0] Artboard - Extracted body content, new length:", cleanHtml.length)
        }
        
        cleanHtml = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
        cleanHtml = cleanHtml.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

        const renderedHtml = Mustache.render(cleanHtml, templateData);
        console.log("[v0] Artboard - Rendered HTML length:", renderedHtml.length)
        
        const scopedCssId = `custom-template-${customTemplate.id}-${slideIndex}`;
        const scopedCss = customTemplate.css.replace(/([^\{\}]+)\{/g, (match, selector) => {
          const selectors = selector.split(',').map((s: string) => `#${scopedCssId} ${s.trim()}`).join(', ');
          return `${selectors} {`;
        });

        let baseWidth = 540;
        let baseHeight = 540;
        switch (format) {
          case 'SQUARE': baseWidth = 540; baseHeight = 540; break;
          case 'PORTRAIT': baseWidth = 540; baseHeight = 675; break;
          case 'STORY': baseWidth = 540; baseHeight = 960; break;
          case 'LANDSCAPE': baseWidth = 960; baseHeight = 540; break;
        }

        return (
          <div className="absolute inset-0 z-10 overflow-hidden">
            <div 
              id={scopedCssId} 
              style={{ 
                width: `${baseWidth}px`, 
                height: `${baseHeight}px`, 
                transform: 'scale(2)', 
                transformOrigin: 'top left' 
              }}
            >
              <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
              <div dangerouslySetInnerHTML={{ __html: renderedHtml }} className="w-full h-full" />
            </div>
          </div>
        );
      } catch (e) {
        console.error("[v0] Artboard - Error rendering custom template:", e);
        return <div className="p-10 text-red-500">Error rendering template: {String(e)}</div>;
      }
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
