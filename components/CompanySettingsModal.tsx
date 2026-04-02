'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LAYOUT_OPTIONS, LayoutType, CustomTemplate } from '@/lib/types'

interface CompanySettingsModalProps {
  isOpen: boolean
  onClose: () => void
  companyId: string
  companyName: string
  onUpdate: () => void
}

export default function CompanySettingsModal({
  isOpen,
  onClose,
  companyId,
  companyName,
  onUpdate
}: CompanySettingsModalProps) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [activeTab, setActiveTab] = useState<'layouts' | 'templates'>('layouts')
  const [enabledLayouts, setEnabledLayouts] = useState<LayoutType[]>([])
  const [templates, setTemplates] = useState<(CustomTemplate & { layout_type?: string; is_active?: boolean })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<LayoutType | null>(null)

  useEffect(() => {
    if (isOpen && companyId) {
      loadSettings()
    }
  }, [isOpen, companyId])

  const loadSettings = async () => {
    setLoading(true)
    
    // Load company enabled layouts
    const { data: company } = await supabase
      .from('companies')
      .select('enabled_layouts')
      .eq('id', companyId)
      .single()
    
    if (company?.enabled_layouts) {
      setEnabledLayouts(company.enabled_layouts as LayoutType[])
    } else {
      // Default: all layouts enabled
      setEnabledLayouts(LAYOUT_OPTIONS.map(l => l.id))
    }

    // Load templates
    const { data: templateData } = await supabase
      .from('custom_templates')
      .select('*')
      .eq('company_id', companyId)
    
    if (templateData) {
      setTemplates(templateData)
    }

    setLoading(false)
  }

  const toggleLayout = (layoutId: LayoutType) => {
    setEnabledLayouts(prev => {
      if (prev.includes(layoutId)) {
        return prev.filter(id => id !== layoutId)
      } else {
        return [...prev, layoutId]
      }
    })
  }

  const saveLayoutSettings = async () => {
    setSaving(true)
    
    const { error } = await supabase
      .from('companies')
      .update({ enabled_layouts: enabledLayouts })
      .eq('id', companyId)
    
    if (!error) {
      onUpdate()
    }
    
    setSaving(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, layoutType: LayoutType) => {
    const file = e.target.files?.[0]
    if (!file) return

    const text = await file.text()
    
    // Check if template already exists for this layout
    const existingTemplate = templates.find(t => t.layout_type === layoutType)
    
    if (existingTemplate) {
      // Update existing template
      const { error } = await supabase
        .from('custom_templates')
        .update({ 
          html: text, 
          name: file.name.replace('.html', ''),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingTemplate.id)
      
      if (!error) {
        loadSettings()
      }
    } else {
      // Create new template
      const { error } = await supabase
        .from('custom_templates')
        .insert({
          company_id: companyId,
          name: file.name.replace('.html', ''),
          html: text,
          css: '',
          layout_type: layoutType,
          is_active: true
        })
      
      if (!error) {
        loadSettings()
      }
    }
    
    setUploadingFor(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const deleteTemplate = async (templateId: string) => {
    const { error } = await supabase
      .from('custom_templates')
      .delete()
      .eq('id', templateId)
    
    if (!error) {
      loadSettings()
    }
  }

  const toggleTemplateActive = async (templateId: string, isActive: boolean) => {
    const { error } = await supabase
      .from('custom_templates')
      .update({ is_active: !isActive })
      .eq('id', templateId)
    
    if (!error) {
      loadSettings()
    }
  }

  const getTemplateForLayout = (layoutType: LayoutType) => {
    return templates.find(t => t.layout_type === layoutType)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">Bedrijfsinstellingen</h2>
            <p className="text-sm text-muted-foreground">{companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Sluiten
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setActiveTab('layouts')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'layouts'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <i className="fas fa-th-large mr-2"></i>
            Layouts Beheren
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'templates'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <i className="fas fa-code mr-2"></i>
            HTML Templates
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <i className="fas fa-spinner fa-spin text-2xl text-muted-foreground"></i>
            </div>
          ) : activeTab === 'layouts' ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Selecteer welke layouts beschikbaar zijn voor dit bedrijf.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {LAYOUT_OPTIONS.map(layout => (
                  <button
                    key={layout.id}
                    onClick={() => toggleLayout(layout.id)}
                    className={`p-4 rounded-xl border transition-all text-left ${
                      enabledLayouts.includes(layout.id)
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        enabledLayouts.includes(layout.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}>
                        <i className={`fas ${layout.icon}`}></i>
                      </div>
                      <div>
                        <div className="font-medium">{layout.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {enabledLayouts.includes(layout.id) ? 'Actief' : 'Uitgeschakeld'}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={saveLayoutSettings}
                  disabled={saving}
                  className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Opslaan...
                    </>
                  ) : (
                    'Instellingen Opslaan'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Upload een eigen HTML template per layout type. Het template wordt gebruikt in plaats van de standaard layout.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".html"
                className="hidden"
                onChange={(e) => uploadingFor && handleFileUpload(e, uploadingFor)}
              />

              <div className="space-y-3">
                {LAYOUT_OPTIONS.map(layout => {
                  const template = getTemplateForLayout(layout.id)
                  
                  return (
                    <div
                      key={layout.id}
                      className="p-4 rounded-xl border border-border bg-card"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-secondary-foreground">
                            <i className={`fas ${layout.icon}`}></i>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{layout.label}</div>
                            {template ? (
                              <div className="text-xs text-green-500 flex items-center gap-1">
                                <i className="fas fa-check-circle"></i>
                                {template.name}.html
                              </div>
                            ) : (
                              <div className="text-xs text-muted-foreground">
                                Geen template - gebruikt standaard
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {template && (
                            <>
                              <button
                                onClick={() => toggleTemplateActive(template.id, template.is_active ?? true)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                  template.is_active
                                    ? 'bg-green-500/20 text-green-500'
                                    : 'bg-secondary text-muted-foreground'
                                }`}
                              >
                                {template.is_active ? 'Actief' : 'Inactief'}
                              </button>
                              <button
                                onClick={() => deleteTemplate(template.id)}
                                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Verwijder template"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => {
                              setUploadingFor(layout.id)
                              fileInputRef.current?.click()
                            }}
                            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                          >
                            <i className="fas fa-upload mr-1"></i>
                            {template ? 'Vervangen' : 'Upload'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
