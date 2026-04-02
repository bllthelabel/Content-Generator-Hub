'use client'

import { useState, useRef, useEffect } from 'react'
import { toPng } from 'html-to-image'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import Artboard from '@/components/Artboard'
import {
  LayoutType,
  AspectRatio,
  LAYOUT_OPTIONS,
  FORMAT_OPTIONS,
  GeneratedContent,
  GenerationStatus,
  ContentVisibility,
  GenerationMode,
  BrandSettings,
  Company,
  LAYOUT_DEFAULTS,
  DEFAULT_BRAND_SETTINGS,
  DEFAULT_CONTENT,
} from '@/lib/types'

const supabase = createClient()

async function fetchCompanies() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: companies } = await supabase
    .from('companies')
    .select(`
      *,
      brand_settings (*),
      custom_templates (*)
    `)
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return companies || []
}

export default function DashboardPage() {
  const router = useRouter()
  const { data: companies = [], mutate } = useSWR('companies', fetchCompanies)
  
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null)
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')

  const [activeTab, setActiveTab] = useState<'DESIGN' | 'CONTENT'>('CONTENT')
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS)

  const [caption, setCaption] = useState('')
  const [generationMode, setGenerationMode] = useState<GenerationMode>('SINGLE')
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('THOUGHT_LEADERSHIP')
  const [selectedFormat, setSelectedFormat] = useState<AspectRatio>('SQUARE')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isImageSpread, setIsImageSpread] = useState(false)
  const [status, setStatus] = useState<GenerationStatus>({ isGenerating: false, step: 'IDLE' })

  const [slides, setSlides] = useState<GeneratedContent[]>([{
    ...DEFAULT_CONTENT,
    ...LAYOUT_DEFAULTS['THOUGHT_LEADERSHIP']
  }])
  const [generatedLayouts, setGeneratedLayouts] = useState<Record<string, GeneratedContent[]> | null>(null)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)

  const [visibility, setVisibility] = useState<ContentVisibility>({
    tagline: true, headline: true, subtext: true, body: true, cta: true, icon: true, logo: true, box: true
  })

  const artboardRefs = useRef<(HTMLDivElement | null)[]>([])
  const logoInputRef = useRef<HTMLInputElement>(null)

  const activeCompany = companies.find((c: Company) => c.id === activeCompanyId)

  useEffect(() => {
    if (companies.length > 0 && !activeCompanyId) {
      setActiveCompanyId(companies[0].id)
    }
  }, [companies, activeCompanyId])

  useEffect(() => {
    if (activeCompany?.brand_settings) {
      setBrandSettings(activeCompany.brand_settings)
    }
  }, [activeCompany])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: company, error } = await supabase
      .from('companies')
      .insert({ name: newCompanyName, owner_id: user.id })
      .select()
      .single()

    if (!error && company) {
      setActiveCompanyId(company.id)
      setNewCompanyName('')
      setShowCompanyModal(false)
      mutate()
    }
  }

  const handleSaveBrandSettings = async () => {
    if (!activeCompanyId || !activeCompany?.brand_settings?.id) return
    
    const { error } = await supabase
      .from('brand_settings')
      .update({
        primary_color: brandSettings.primary_color,
        secondary_color: brandSettings.secondary_color,
        accent_color: brandSettings.accent_color,
        logo_url: brandSettings.logo_url,
        logo_position: brandSettings.logo_position,
        company_type: brandSettings.company_type,
        target_audience: brandSettings.target_audience,
        tone_of_voice: brandSettings.tone_of_voice,
        company_description: brandSettings.company_description,
        usp: brandSettings.usp,
        visual_style_type: brandSettings.visual_style_type,
        illustration_style: brandSettings.illustration_style,
        default_hashtags: brandSettings.default_hashtags,
      })
      .eq('id', activeCompany.brand_settings.id)

    if (!error) {
      mutate()
      alert('Brand settings opgeslagen!')
    }
  }

  const handleLayoutChange = (newLayout: LayoutType) => {
    if (generatedLayouts) {
      setGeneratedLayouts(prev => ({ ...prev!, [selectedLayout]: slides }))
    }
    setSelectedLayout(newLayout)

    if (generatedLayouts && generatedLayouts[newLayout]) {
      const newLayoutSlides = generatedLayouts[newLayout].map((slide, index) => {
        const currentSlide = slides[index] || slides[0]
        return {
          ...slide,
          imageBase64: currentSlide?.imageBase64 || slide.imageBase64,
          secondaryImage: currentSlide?.secondaryImage || slide.secondaryImage,
          tertiaryImage: currentSlide?.tertiaryImage || slide.tertiaryImage,
        }
      })
      setSlides(newLayoutSlides)
    } else {
      const defaults = LAYOUT_DEFAULTS[newLayout] || {}
      setSlides(prevSlides => {
        const newSlides = [...prevSlides]
        newSlides[activeSlideIndex] = {
          ...newSlides[activeSlideIndex],
          ...defaults,
          imageBase64: newSlides[activeSlideIndex].imageBase64,
          secondaryImage: newSlides[activeSlideIndex].secondaryImage,
          tertiaryImage: newSlides[activeSlideIndex].tertiaryImage,
        }
        return newSlides
      })
    }
  }

  const updateSlideContent = (index: number, field: keyof GeneratedContent, value: string) => {
    setSlides(prevSlides => {
      const newSlides = [...prevSlides]
      newSlides[index] = { ...newSlides[index], [field]: value }
      return newSlides
    })
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, target: 'imageBase64' | 'secondaryImage' | 'tertiaryImage' | 'logo_url' = 'imageBase64') => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        if (target === 'logo_url') {
          setBrandSettings(prev => ({ ...prev, logo_url: reader.result as string }))
        } else {
          const targetIndex = isImageSpread && generationMode === 'CAROUSEL' && target === 'imageBase64' ? 0 : activeSlideIndex
          updateSlideContent(targetIndex, target, reader.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGenerate = async () => {
    if (!caption.trim()) return
    setStatus({ isGenerating: true, step: 'ANALYZING' })

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: caption,
          isCarousel: generationMode === 'CAROUSEL',
          brandContext: brandSettings
        })
      })

      if (!response.ok) throw new Error('Generation failed')
      
      const result = await response.json()
      const newGeneratedLayouts: Record<string, GeneratedContent[]> = {}

      for (const layoutId of Object.keys(result)) {
        const layoutResult = result[layoutId]
        if (Array.isArray(layoutResult)) {
          newGeneratedLayouts[layoutId] = layoutResult.map((content) => ({
            ...DEFAULT_CONTENT,
            ...content,
            imageBase64: slides[0]?.imageBase64 || null,
            secondaryImage: slides[0]?.secondaryImage || null,
            tertiaryImage: slides[0]?.tertiaryImage || null
          }))
        } else {
          newGeneratedLayouts[layoutId] = [{ ...slides[0], ...layoutResult }]
        }
      }

      setGeneratedLayouts(newGeneratedLayouts)

      if (newGeneratedLayouts[selectedLayout]) {
        setSlides(newGeneratedLayouts[selectedLayout])
      }

      setActiveSlideIndex(0)
      setStatus({ isGenerating: false, step: 'DONE' })
    } catch (error) {
      console.error(error)
      setStatus({ isGenerating: false, step: 'ERROR', error: 'Generatie mislukt.' })
    }
  }

  const handleDownload = async () => {
    const currentRef = artboardRefs.current[activeSlideIndex]
    if (currentRef) {
      try {
        const dataUrl = await toPng(currentRef, { cacheBust: true, pixelRatio: 2 })
        const link = document.createElement('a')
        link.download = `brand-social-${selectedLayout}-${activeSlideIndex + 1}.png`
        link.href = dataUrl
        link.click()
      } catch (err) {
        console.error('Download failed', err)
      }
    }
  }

  const activeContent = slides[activeSlideIndex] || DEFAULT_CONTENT

  const handleTextChange = (field: keyof GeneratedContent, value: string) => {
    updateSlideContent(activeSlideIndex, field, value)
  }

  return (
    <div className="flex h-screen bg-background text-foreground font-sans overflow-hidden">
      {/* Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-white">Nieuw Bedrijf</h2>
            <input
              type="text"
              placeholder="Bedrijfsnaam"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              className="w-full px-4 py-3 bg-input border border-border rounded-xl text-foreground"
            />
            <div className="flex gap-3">
              <button onClick={handleCreateCompany} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-medium">
                Aanmaken
              </button>
              <button onClick={() => setShowCompanyModal(false)} className="flex-1 py-3 bg-secondary text-secondary-foreground rounded-xl font-medium">
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-[400px] flex flex-col border-r border-border bg-card z-20 shadow-2xl">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h1 className="font-bold text-white text-lg">Content Generator</h1>
            <div className="text-[10px] font-mono text-primary mt-1 uppercase">Hub Edition</div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCompanyModal(true)} className="p-2 bg-secondary rounded hover:bg-secondary/80 text-muted-foreground">
              <i className="fa-solid fa-plus"></i>
            </button>
            <button onClick={handleLogout} className="p-2 bg-secondary rounded hover:bg-secondary/80 text-muted-foreground">
              <i className="fa-solid fa-sign-out-alt"></i>
            </button>
          </div>
        </div>

        {/* Company Selector */}
        {companies.length > 0 ? (
          <div className="px-6 py-3 bg-primary/10 border-b border-primary/20">
            <select
              value={activeCompanyId || ''}
              onChange={(e) => setActiveCompanyId(e.target.value)}
              className="w-full bg-transparent text-sm font-bold text-primary border-none focus:outline-none cursor-pointer"
            >
              {companies.map((company: Company) => (
                <option key={company.id} value={company.id} className="bg-card text-foreground">
                  {company.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="px-6 py-3 bg-accent/10 border-b border-accent/20 text-sm text-accent">
            Maak eerst een bedrijf aan.
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button onClick={() => setActiveTab('DESIGN')} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'DESIGN' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
            Design
          </button>
          <button onClick={() => setActiveTab('CONTENT')} className={`flex-1 py-3 text-xs font-bold uppercase ${activeTab === 'CONTENT' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}>
            Content
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === 'DESIGN' && (
            <>
              {/* Brand Colors */}
              <section className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-muted-foreground uppercase">Brand Colors</label>
                  <button onClick={handleSaveBrandSettings} className="text-[10px] bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-1 rounded">
                    Opslaan
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Primary</label>
                    <input type="color" value={brandSettings.primary_color} onChange={(e) => setBrandSettings(prev => ({ ...prev, primary_color: e.target.value }))} className="w-full h-10 rounded bg-input cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Secondary</label>
                    <input type="color" value={brandSettings.secondary_color} onChange={(e) => setBrandSettings(prev => ({ ...prev, secondary_color: e.target.value }))} className="w-full h-10 rounded bg-input cursor-pointer" />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block">Accent</label>
                    <input type="color" value={brandSettings.accent_color} onChange={(e) => setBrandSettings(prev => ({ ...prev, accent_color: e.target.value }))} className="w-full h-10 rounded bg-input cursor-pointer" />
                  </div>
                </div>
              </section>

              {/* Logo */}
              <section className="space-y-4">
                <label className="text-xs font-bold text-muted-foreground uppercase block">Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-input rounded flex items-center justify-center overflow-hidden border border-border">
                    {brandSettings.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brandSettings.logo_url} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xs text-muted-foreground">No Logo</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <button onClick={() => logoInputRef.current?.click()} className="w-full py-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs rounded">
                      Upload Logo
                    </button>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/png, image/svg+xml" onChange={(e) => handleImageUpload(e, 'logo_url')} />
                  </div>
                </div>
              </section>

              {/* Format */}
              <section className="space-y-4">
                <label className="text-xs font-bold text-muted-foreground uppercase block">Formaat</label>
                <div className="grid grid-cols-4 gap-2">
                  {FORMAT_OPTIONS.map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setSelectedFormat(fmt.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${selectedFormat === fmt.id ? 'bg-secondary border-white text-white' : 'bg-input border-border text-muted-foreground hover:border-muted-foreground'}`}
                      title={fmt.label}
                    >
                      <span className="text-[9px] font-bold uppercase">{fmt.id}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Toggles */}
              <section className="space-y-4">
                <label className="text-xs font-bold text-muted-foreground uppercase block">Opties</label>
                
                {/* Dark Mode */}
                <div className="flex items-center justify-between p-3 bg-input rounded-lg border border-border">
                  <div>
                    <div className="text-xs font-bold text-white">Dark Mode</div>
                    <div className="text-[10px] text-muted-foreground">Donkere achtergrond</div>
                  </div>
                  <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${isDarkMode ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>

                {/* Carousel Mode */}
                <div className="flex items-center justify-between p-3 bg-input rounded-lg border border-border">
                  <div>
                    <div className="text-xs font-bold text-white">Carousel Mode</div>
                    <div className="text-[10px] text-muted-foreground">Meerdere slides</div>
                  </div>
                  <button
                    onClick={() => {
                      const newMode = generationMode === 'SINGLE' ? 'CAROUSEL' : 'SINGLE'
                      setGenerationMode(newMode)
                      if (newMode === 'SINGLE') {
                        setSlides([slides[0]])
                        setActiveSlideIndex(0)
                      } else {
                        if (slides.length === 1) {
                          setSlides([slides[0], { ...slides[0], headline: 'Slide 2' }, { ...slides[0], headline: 'Slide 3' }])
                        }
                      }
                    }}
                    className={`w-10 h-5 rounded-full relative transition-colors ${generationMode === 'CAROUSEL' ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${generationMode === 'CAROUSEL' ? 'left-6' : 'left-1'}`}></div>
                  </button>
                </div>
              </section>
            </>
          )}

          {activeTab === 'CONTENT' && (
            <>
              {/* Content Input */}
              <section className="space-y-4">
                <label className="text-xs font-bold text-muted-foreground uppercase block">Content Input</label>
                <div className="relative">
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Waar wil je over posten?"
                    className="w-full h-32 bg-input rounded-xl p-4 text-sm text-foreground border border-border focus:border-primary focus:outline-none"
                  />
                  <div className="absolute bottom-3 right-3">
                    <button
                      onClick={handleGenerate}
                      disabled={status.isGenerating || !caption.trim()}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50"
                    >
                      {status.isGenerating ? 'Bezig...' : 'Genereer'}
                    </button>
                  </div>
                </div>
              </section>

              {/* Layout Selection */}
              <section className="space-y-4">
                <label className="text-xs font-bold text-muted-foreground uppercase block">Layout</label>
                <div className="grid grid-cols-2 gap-2">
                  {LAYOUT_OPTIONS.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => handleLayoutChange(layout.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${selectedLayout === layout.id ? 'bg-primary/10 border-primary text-primary' : 'bg-input border-border text-muted-foreground hover:border-muted-foreground'}`}
                    >
                      <i className={`fa-solid ${layout.icon} mr-2`}></i>
                      <span className="text-xs font-medium">{layout.label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Text Fields */}
              <section className="space-y-4">
                <label className="text-xs font-bold text-muted-foreground uppercase block">Tekst Aanpassen</label>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Tagline</label>
                    <input
                      type="text"
                      value={activeContent.tagline}
                      onChange={(e) => handleTextChange('tagline', e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Headline</label>
                    <input
                      type="text"
                      value={activeContent.headline}
                      onChange={(e) => handleTextChange('headline', e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Body</label>
                    <textarea
                      value={activeContent.body}
                      onChange={(e) => handleTextChange('body', e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground h-20"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">CTA</label>
                    <input
                      type="text"
                      value={activeContent.cta}
                      onChange={(e) => handleTextChange('cta', e.target.value)}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground"
                    />
                  </div>
                </div>
              </section>

              {/* Visibility Toggles */}
              <section className="space-y-4">
                <label className="text-xs font-bold text-muted-foreground uppercase block">Zichtbaarheid</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(visibility).map(([key, value]) => (
                    <button
                      key={key}
                      onClick={() => setVisibility(prev => ({ ...prev, [key]: !value }))}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${value ? 'bg-primary text-primary-foreground' : 'bg-input text-muted-foreground border border-border'}`}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </aside>

      {/* Main Content - Preview */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Toolbar */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-card">
          <div className="flex items-center gap-4">
            {generationMode === 'CAROUSEL' && slides.length > 1 && (
              <div className="flex gap-2">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveSlideIndex(index)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${activeSlideIndex === index ? 'bg-primary text-primary-foreground' : 'bg-input text-muted-foreground'}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg flex items-center gap-2"
          >
            <i className="fa-solid fa-download"></i>
            Download
          </button>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-8 flex items-center justify-center">
          <div className="transform scale-[0.4] origin-center">
            <Artboard
              ref={(el) => { artboardRefs.current[activeSlideIndex] = el }}
              layout={selectedLayout}
              format={selectedFormat}
              content={activeContent}
              visibility={visibility}
              isDarkMode={isDarkMode}
              applyEffect={false}
              slideIndex={activeSlideIndex}
              totalSlides={slides.length}
              isImageSpread={isImageSpread}
              brandSettings={brandSettings}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
