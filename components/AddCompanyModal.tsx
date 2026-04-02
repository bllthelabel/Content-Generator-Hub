'use client'

import { useState, useRef } from 'react'

interface CompanyFormData {
  name: string
  description: string
  targetAudience: string
  usp: string
  toneOfVoice: string
  outputLanguage: string
}

interface AddCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CompanyFormData) => Promise<void>
}

const LANGUAGES = [
  { code: 'nl', label: 'Nederlands (Dutch)' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch (German)' },
  { code: 'fr', label: 'Français (French)' },
  { code: 'es', label: 'Español (Spanish)' },
]

export default function AddCompanyModal({ isOpen, onClose, onSubmit }: AddCompanyModalProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    description: '',
    targetAudience: '',
    usp: '',
    toneOfVoice: '',
    outputLanguage: 'nl'
  })
  const [importText, setImportText] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleAnalyzeText = async () => {
    if (!importText.trim()) return
    
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/analyze-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: importText })
      })

      if (response.ok) {
        const result = await response.json()
        setFormData(prev => ({
          ...prev,
          name: result.companyName || prev.name,
          description: result.description || prev.description,
          targetAudience: result.targetAudience || prev.targetAudience,
          usp: result.usp || prev.usp,
          toneOfVoice: result.toneOfVoice || prev.toneOfVoice,
        }))
        setImportText('')
      }
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const text = e.target?.result as string
        setImportText(text)
      }
      reader.readAsText(file)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) return
    
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setFormData({
        name: '',
        description: '',
        targetAudience: '',
        usp: '',
        toneOfVoice: '',
        outputLanguage: 'nl'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl my-8 shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Nieuw Bedrijf Toevoegen</h2>
              <p className="text-gray-500 mt-1">Vul de gegevens in om te starten</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 font-medium"
            >
              Annuleren
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Quick Import Section */}
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">&#9998;</span>
              <h3 className="font-semibold text-gray-800">Snelstart: Importeer Bedrijfsinfo</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload een bestand of plak een tekst (pitch, &apos;over ons&apos;, missie) om de velden automatisch in te vullen.
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Bestand (.txt)
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept=".txt,.md"
                onChange={handleFileUpload}
              />

              <div className="relative">
                <div className="absolute -top-2 left-3 px-2 bg-amber-50 text-xs text-gray-500">
                  of plak tekst
                </div>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Plak hier je pitch, website teksten of notities..."
                  className="w-full h-28 p-4 border border-amber-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-amber-300 bg-white resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAnalyzeText}
                  disabled={!importText.trim() || isAnalyzing}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-200 hover:bg-amber-300 disabled:bg-gray-200 disabled:text-gray-400 text-gray-800 rounded-lg font-medium text-sm transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Analyseren...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Analyseer Tekst
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Bedrijfsnaam
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Bijv. Motorparts-online.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-300"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                Wat doet het bedrijf? (Missie/Beschrijving)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Bijv. Europa's grootste online platform voor gebruikte motoronderdelen."
                className="w-full h-28 px-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-300 resize-none"
              />
            </div>

            {/* Two columns: Target Audience & USP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Doelgroep
                </label>
                <textarea
                  value={formData.targetAudience}
                  onChange={(e) => setFormData(prev => ({ ...prev, targetAudience: e.target.value }))}
                  placeholder="Bijv. DIY mechanics en professionele monteurs."
                  className="w-full h-24 px-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-300 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Unique Selling Points (USP&apos;s)
                </label>
                <textarea
                  value={formData.usp}
                  onChange={(e) => setFormData(prev => ({ ...prev, usp: e.target.value }))}
                  placeholder="Bijv. Grootste voorraad, geld-terug garantie, snelle levering."
                  className="w-full h-24 px-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-300 resize-none"
                />
              </div>
            </div>

            {/* Two columns: Tone of Voice & Language */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Tone of Voice
                </label>
                <input
                  type="text"
                  value={formData.toneOfVoice}
                  onChange={(e) => setFormData(prev => ({ ...prev, toneOfVoice: e.target.value }))}
                  placeholder="Bijv. Expert, gepassioneerd, behulpzaam."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Voertaal Output
                </label>
                <div className="relative">
                  <select
                    value={formData.outputLanguage}
                    onChange={(e) => setFormData(prev => ({ ...prev, outputLanguage: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-gray-300 appearance-none bg-white"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang.code} value={lang.code}>{lang.label}</option>
                    ))}
                  </select>
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium rounded-lg"
          >
            Annuleren
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isSubmitting}
            className="px-6 py-2.5 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? 'Aanmaken...' : 'Bedrijf Aanmaken'}
          </button>
        </div>
      </div>
    </div>
  )
}
