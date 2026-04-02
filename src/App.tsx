import React, { useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import Artboard from './components/Artboard';
import { 
  LayoutType, 
  AspectRatio, 
  LAYOUT_OPTIONS, 
  FORMAT_OPTIONS, 
  GeneratedContent, 
  GenerationStatus, 
  ContentVisibility, 
  GenerationMode, 
  ImageSize, 
  IMAGE_SIZE_OPTIONS,
  BrandSettings,
  Company
} from './types';
import { generateAllLayoutsText, generateBrandImage } from './services/geminiService';
import BrandLogo from './components/BrandLogo';
import { LAYOUT_DEFAULTS, LAYOUT_DESCRIPTIONS } from './constants';
import CompanySettings from './components/CompanySettings';
import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const DEFAULT_CONTENT: GeneratedContent = {
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

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [showCompanySettings, setShowCompanySettings] = useState(false);

  const [activeTab, setActiveTab] = useState<'DESIGN' | 'CONTENT'>('CONTENT');
  
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    primaryColor: '#4d7c3a',
    secondaryColor: '#1f2937',
    accentColor: '#f59e0b',
    logoUrl: null,
    logoPosition: 'top-left',
    companyType: '',
    targetAudience: '',
    toneOfVoice: '',
    companyDescription: ''
  });

  const [caption, setCaption] = useState('');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('SINGLE');
  const [selectedLayout, setSelectedLayout] = useState<LayoutType | string>('THOUGHT_LEADERSHIP');
  const [selectedFormat, setSelectedFormat] = useState<AspectRatio>('SQUARE');
  const [selectedImageSize, setSelectedImageSize] = useState<ImageSize>('1K');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [applyEffect, setApplyEffect] = useState(false); 
  const [isImageSpread, setIsImageSpread] = useState(false);
  const [status, setStatus] = useState<GenerationStatus>({ isGenerating: false, step: 'IDLE' });
  
  const [slides, setSlides] = useState<GeneratedContent[]>([{
     ...DEFAULT_CONTENT,
     ...LAYOUT_DEFAULTS['THOUGHT_LEADERSHIP']
  }]);
  const [generatedLayouts, setGeneratedLayouts] = useState<Record<string, GeneratedContent[]> | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const [visibility, setVisibility] = useState<ContentVisibility>({
    tagline: true, headline: true, subtext: true, body: true, cta: true, icon: true, logo: true, box: true
  });

  const artboardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const customTemplate = activeCompany?.templates?.find(t => t.id === selectedLayout);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setCompanies([]);
      return;
    }
    const q = query(collection(db, 'companies'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const comps: Company[] = [];
      snapshot.forEach(doc => {
        comps.push({ id: doc.id, ...doc.data() } as Company);
      });
      setCompanies(comps);
      if (comps.length > 0 && !activeCompanyId) {
        setActiveCompanyId(comps[0].id);
      }
    }, (error) => {
      console.error("Firestore error:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (activeCompany) {
      setBrandSettings(activeCompany.brandSettings);
    }
  }, [activeCompanyId]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleSaveBrandSettings = async () => {
    if (!activeCompanyId) return;
    try {
      await updateDoc(doc(db, 'companies', activeCompanyId), {
        brandSettings
      });
      alert('Brand settings saved!');
    } catch (e) {
      console.error("Error saving brand settings", e);
    }
  };

  const handleLayoutChange = (newLayout: string) => {
    if (generatedLayouts) {
        setGeneratedLayouts(prev => ({ ...prev!, [selectedLayout]: slides }));
    }
    setSelectedLayout(newLayout);
    
    if (generatedLayouts && generatedLayouts[newLayout]) {
        const newLayoutSlides = generatedLayouts[newLayout].map((slide, index) => {
            const currentSlide = slides[index] || slides[0];
            return {
                ...slide,
                imageBase64: currentSlide?.imageBase64 || slide.imageBase64,
                secondaryImage: currentSlide?.secondaryImage || slide.secondaryImage,
                tertiaryImage: currentSlide?.tertiaryImage || slide.tertiaryImage,
            };
        });
        setSlides(newLayoutSlides);
    } else {
        const defaults = LAYOUT_DEFAULTS[newLayout as LayoutType] || {};
        setSlides(prevSlides => {
            const newSlides = [...prevSlides];
            newSlides[activeSlideIndex] = {
                ...newSlides[activeSlideIndex],
                ...defaults,
                imageBase64: newSlides[activeSlideIndex].imageBase64,
                secondaryImage: newSlides[activeSlideIndex].secondaryImage,
                tertiaryImage: newSlides[activeSlideIndex].tertiaryImage,
            };
            return newSlides;
        });
    }
  };

  const updateSlideContent = (index: number, field: keyof GeneratedContent, value: string) => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides];
      newSlides[index] = { ...newSlides[index], [field]: value };
      return newSlides;
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, target: 'imageBase64' | 'secondaryImage' | 'tertiaryImage' | 'logoUrl' = 'imageBase64') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
         if (target === 'logoUrl') {
           setBrandSettings(prev => ({ ...prev, logoUrl: reader.result as string }));
         } else {
           const targetIndex = isImageSpread && generationMode === 'CAROUSEL' && target === 'imageBase64' ? 0 : activeSlideIndex;
           updateSlideContent(targetIndex, target, reader.result as string);
         }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!caption.trim()) return;
    setStatus({ isGenerating: true, step: 'ANALYZING' });
    try {
      const isCarousel = generationMode === 'CAROUSEL';
      const result = await generateAllLayoutsText(caption, isCarousel, brandSettings);
      
      const newGeneratedLayouts: Record<string, GeneratedContent[]> = {} as any;
      
      for (const layoutId of Object.keys(result)) {
          const layoutResult = result[layoutId];
          if (Array.isArray(layoutResult)) {
              newGeneratedLayouts[layoutId] = layoutResult.map((content) => ({
                  ...DEFAULT_CONTENT, 
                  ...content,         
                  imageBase64: slides[0]?.imageBase64 || null,
                  secondaryImage: slides[0]?.secondaryImage || null,
                  tertiaryImage: slides[0]?.tertiaryImage || null
              }));
          } else {
              newGeneratedLayouts[layoutId] = [{ ...slides[0], ...layoutResult }];
          }
      }
      
      // Also copy the generated content to custom templates if they exist
      if (activeCompany?.templates) {
        const defaultContent = newGeneratedLayouts['THOUGHT_LEADERSHIP'] || [DEFAULT_CONTENT];
        activeCompany.templates.forEach(t => {
          newGeneratedLayouts[t.id] = defaultContent;
        });
      }

      setGeneratedLayouts(newGeneratedLayouts);
      
      if (newGeneratedLayouts[selectedLayout]) {
          setSlides(newGeneratedLayouts[selectedLayout]);
      }
      
      setActiveSlideIndex(0);
      setStatus({ isGenerating: false, step: 'DONE' });
    } catch (error) {
      console.error(error);
      setStatus({ isGenerating: false, step: 'ERROR', error: 'Generation failed.' });
    }
  };

  const handleDownload = async () => {
    const currentRef = artboardRefs.current[activeSlideIndex];
    if (currentRef) {
      try {
        const dataUrl = await toPng(currentRef, { cacheBust: true, pixelRatio: 2 });
        const link = document.createElement('a');
        link.download = `brand-social-${selectedLayout}-${activeSlideIndex + 1}.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Download failed', err);
      }
    }
  };

  const activeContent = slides[activeSlideIndex] || DEFAULT_CONTENT;

  const handleTextChange = (field: keyof GeneratedContent, value: string) => {
    updateSlideContent(activeSlideIndex, field, value);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
            <h1 className="text-2xl font-bold text-white mb-4">Social Media Brand Engine</h1>
            <p className="text-slate-400 mb-8">Sign in to manage your companies and templates.</p>
            <button onClick={handleLogin} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl">
              Sign in with Google
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 font-sans overflow-hidden">
      {showCompanySettings && (
        <CompanySettings 
          companies={companies} 
          activeCompanyId={activeCompanyId} 
          onSelectCompany={setActiveCompanyId} 
          onClose={() => setShowCompanySettings(false)} 
        />
      )}

      <aside className="w-[400px] flex flex-col border-r border-slate-800 bg-slate-900/95 z-20 shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
              <h1 className="font-bold text-white text-lg">Brand Engine</h1>
              <div className="text-[10px] font-mono text-blue-400 mt-1 uppercase">SaaS Edition</div>
          </div>
          <button onClick={() => setShowCompanySettings(true)} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300">
            <i className="fa-solid fa-building"></i>
          </button>
        </div>

        {activeCompany ? (
          <div className="px-6 py-3 bg-blue-900/20 border-b border-blue-900/30 flex items-center justify-between">
            <span className="text-sm font-bold text-blue-400">{activeCompany.name}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Active</span>
          </div>
        ) : (
          <div className="px-6 py-3 bg-yellow-900/20 border-b border-yellow-900/30 text-sm text-yellow-500">
            Please select or create a company.
          </div>
        )}

        <div className="flex border-b border-slate-800">
          <button onClick={() => setActiveTab('DESIGN')} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'DESIGN' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>Design</button>
          <button onClick={() => setActiveTab('CONTENT')} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'CONTENT' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>Content</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === 'DESIGN' && (
            <>
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-400 uppercase">Brand Colors</label>
                  <button onClick={handleSaveBrandSettings} className="text-[10px] bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">Save</button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><label className="text-[10px] text-slate-500 block">Primary</label><input type="color" value={brandSettings.primaryColor} onChange={(e) => setBrandSettings(prev => ({ ...prev, primaryColor: e.target.value }))} className="w-full h-10 rounded bg-slate-800" /></div>
                  <div><label className="text-[10px] text-slate-500 block">Secondary</label><input type="color" value={brandSettings.secondaryColor} onChange={(e) => setBrandSettings(prev => ({ ...prev, secondaryColor: e.target.value }))} className="w-full h-10 rounded bg-slate-800" /></div>
                  <div><label className="text-[10px] text-slate-500 block">Accent</label><input type="color" value={brandSettings.accentColor} onChange={(e) => setBrandSettings(prev => ({ ...prev, accentColor: e.target.value }))} className="w-full h-10 rounded bg-slate-800" /></div>
                </div>
              </section>

              <section className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase block">Logo & Assets</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-800 rounded flex items-center justify-center overflow-hidden">
                    {brandSettings.logoUrl ? <img src={brandSettings.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <span className="text-xs text-slate-500">No Logo</span>}
                  </div>
                  <div className="flex-1">
                    <button onClick={() => logoInputRef.current?.click()} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs rounded">Upload Logo</button>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/png, image/svg+xml" onChange={(e) => handleImageUpload(e, 'logoUrl')} />
                  </div>
                </div>
              </section>

              {/* FORMAT & SETTINGS */}
              <section className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
                    Configuration
                </label>
                
                {/* Format Selector */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                    {FORMAT_OPTIONS.map((fmt) => (
                        <button
                            key={fmt.id}
                            onClick={() => setSelectedFormat(fmt.id)}
                            className={`
                                flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all
                                ${selectedFormat === fmt.id ? 'bg-slate-700 border-white text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'}
                            `}
                            title={fmt.label}
                        >
                            <span className="text-[9px] font-bold uppercase">{fmt.id}</span>
                        </button>
                    ))}
                </div>

                {/* Toggles */}
                <div className="space-y-2">
                    {/* Carousel Mode */}
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                        <div className="flex items-center gap-3">
                            <div>
                                <div className="text-xs font-bold text-white">Carousel Mode</div>
                                <div className="text-[10px] text-slate-400">Generate multi-slide post</div>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                const newMode = generationMode === 'SINGLE' ? 'CAROUSEL' : 'SINGLE';
                                setGenerationMode(newMode);
                                if (newMode === 'SINGLE') {
                                    setSlides([slides[0]]);
                                    setActiveSlideIndex(0);
                                } else {
                                    if (slides.length === 1) {
                                        setSlides([slides[0], {...slides[0], headline: 'Slide 2'}, {...slides[0], headline: 'Slide 3'}]);
                                    }
                                }
                            }}
                            className={`w-10 h-5 rounded-full relative transition-colors ${generationMode === 'CAROUSEL' ? 'bg-blue-500' : 'bg-slate-600'}`}
                        >
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${generationMode === 'CAROUSEL' ? 'left-6' : 'left-1'}`}></div>
                        </button>
                    </div>

                    {/* Image Spread (Only for Carousel) */}
                    {generationMode === 'CAROUSEL' && (
                        <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="text-xs font-bold text-white">Panorama Spread</div>
                                    <div className="text-[10px] text-slate-400">One image across all slides</div>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsImageSpread(!isImageSpread)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${isImageSpread ? 'bg-blue-500' : 'bg-slate-600'}`}
                            >
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${isImageSpread ? 'left-6' : 'left-1'}`}></div>
                            </button>
                        </div>
                    )}
                </div>
              </section>
            </>
          )}

          {activeTab === 'CONTENT' && (
            <>
              <section className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase block">Content Input</label>
                <div className="relative group">
                    <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="What do you want to post about?" className="w-full h-32 bg-slate-800 rounded-xl p-4 text-sm text-white" />
                    <div className="absolute bottom-3 right-3 flex gap-2">
                        <button onClick={() => handleGenerate()} disabled={status.isGenerating || !caption.trim()} className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                            {status.isGenerating ? '...' : 'GO'}
                        </button>
                    </div>
                </div>
              </section>

              <section className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase block">Layout Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {LAYOUT_OPTIONS.map((option) => (
                    <button key={option.id} onClick={() => handleLayoutChange(option.id)} className={`p-3 rounded-xl border-2 text-left ${selectedLayout === option.id ? 'bg-blue-500/10 border-blue-500' : 'bg-slate-800 border-slate-700'}`}>
                      <span className={`text-xs font-bold ${selectedLayout === option.id ? 'text-white' : 'text-slate-300'}`}>{option.label}</span>
                    </button>
                  ))}
                  {activeCompany?.templates?.map((template) => (
                    <button key={template.id} onClick={() => handleLayoutChange(template.id)} className={`p-3 rounded-xl border-2 text-left ${selectedLayout === template.id ? 'bg-purple-500/10 border-purple-500' : 'bg-slate-800 border-slate-700'}`}>
                      <span className={`text-xs font-bold ${selectedLayout === template.id ? 'text-white' : 'text-slate-300'}`}>⭐ {template.name}</span>
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden">
        <div className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50">
            <div className="flex items-center gap-4">
                 {generationMode === 'CAROUSEL' && (
                    <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg">
                        {slides.map((_, idx) => (
                            <button key={idx} onClick={() => setActiveSlideIndex(idx)} className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${activeSlideIndex === idx ? 'bg-blue-500 text-white' : 'text-slate-400'}`}>{idx + 1}</button>
                        ))}
                    </div>
                 )}
            </div>
            <button onClick={handleDownload} className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg">Download Current</button>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center p-10 relative">
            <div className="relative z-10 transform scale-[0.35] origin-center">
               {slides.map((slideContent, index) => (
                   <div key={index} className={`${activeSlideIndex === index ? 'block' : 'hidden'}`}>
                        <Artboard
                            ref={(el) => (artboardRefs.current[index] = el)}
                            layout={selectedLayout}
                            format={selectedFormat}
                            content={slideContent}
                            visibility={visibility}
                            isDarkMode={isDarkMode}
                            applyEffect={applyEffect}
                            slideIndex={index}
                            totalSlides={slides.length}
                            isImageSpread={isImageSpread}
                            brandSettings={brandSettings}
                            customTemplate={customTemplate}
                        />
                   </div>
               ))}
            </div>
        </div>

        <div className="h-64 border-t border-slate-800 bg-slate-900 z-20 flex flex-col">
            <div className="px-6 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Editor</span>
                <div className="flex gap-2">
                     <button onClick={() => fileInputRef.current?.click()} className="text-[10px] bg-slate-800 text-slate-300 px-3 py-1.5 rounded">Upload Image</button>
                     <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'imageBase64')} />
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Tagline</label><input type="text" value={activeContent.tagline || ''} onChange={(e) => handleTextChange('tagline', e.target.value)} className="w-full bg-slate-800 rounded px-3 py-2 text-sm text-white" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Headline</label><textarea value={activeContent.headline || ''} onChange={(e) => handleTextChange('headline', e.target.value)} rows={2} className="w-full bg-slate-800 rounded px-3 py-2 text-sm text-white resize-none" /></div>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">Subtext</label><textarea value={activeContent.subtext || ''} onChange={(e) => handleTextChange('subtext', e.target.value)} rows={2} className="w-full bg-slate-800 rounded px-3 py-2 text-sm text-white resize-none" /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold text-slate-500 uppercase">CTA Button</label><input type="text" value={activeContent.cta || ''} onChange={(e) => handleTextChange('cta', e.target.value)} className="w-full bg-slate-800 rounded px-3 py-2 text-sm text-white" /></div>
                    </div>
                    <div className="space-y-1 h-full flex flex-col">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Body Text</label>
                        <textarea value={activeContent.body || ''} onChange={(e) => handleTextChange('body', e.target.value)} className="w-full flex-1 bg-slate-800 rounded px-3 py-2 text-sm text-white resize-y min-h-[100px]" />
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}
