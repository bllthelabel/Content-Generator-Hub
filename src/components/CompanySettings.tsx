import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Company, CustomTemplate, BrandSettings } from '../types';
import { analyzeCompanyContext } from '../services/geminiService';

interface CompanySettingsProps {
  companies: Company[];
  activeCompanyId: string | null;
  onSelectCompany: (id: string) => void;
  onClose: () => void;
}

const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  primaryColor: '#4d7c3a',
  secondaryColor: '#1f2937',
  accentColor: '#f59e0b',
  logoUrl: null,
  logoPosition: 'top-left',
  companyType: '',
  targetAudience: '',
  toneOfVoice: '',
  companyDescription: '',
  usp: '',
  visualStyleType: '',
  illustrationStyle: '',
  defaultHashtags: ''
};

export default function CompanySettings({ companies, activeCompanyId, onSelectCompany, onClose }: CompanySettingsProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  
  const activeCompany = companies.find(c => c.id === activeCompanyId);
  
  const [localBrandSettings, setLocalBrandSettings] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
  const [localCompanyName, setLocalCompanyName] = useState('');
  const [quickstartText, setQuickstartText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeCompany) {
      setLocalBrandSettings(activeCompany.brandSettings || DEFAULT_BRAND_SETTINGS);
      setLocalCompanyName(activeCompany.name || '');
    }
  }, [activeCompany]);

  const handleDeleteCompany = async () => {
    if (!activeCompany) return;
    if (!window.confirm(`Are you sure you want to delete ${activeCompany.name}? This action cannot be undone.`)) return;
    
    try {
      await deleteDoc(doc(db, 'companies', activeCompany.id));
      const remainingCompanies = companies.filter(c => c.id !== activeCompany.id);
      if (remainingCompanies.length > 0) {
        onSelectCompany(remainingCompanies[0].id);
      } else {
        onSelectCompany(''); // or null if your type allows, but App.tsx seems to handle empty string
      }
    } catch (e) {
      console.error("Error deleting company", e);
    }
  };

  const handleQuickstartAnalyze = async () => {
    if (!quickstartText.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeCompanyContext(quickstartText);
      
      // Update local brand settings with AI results
      setLocalBrandSettings(prev => ({
        ...prev,
        companyType: result.companyType || prev.companyType,
        companyDescription: result.companyDescription || prev.companyDescription,
        targetAudience: result.targetAudience || prev.targetAudience,
        usp: result.usp || prev.usp,
        toneOfVoice: result.toneOfVoice || prev.toneOfVoice,
        visualStyleType: result.visualStyleType || prev.visualStyleType,
        illustrationStyle: result.illustrationStyle || prev.illustrationStyle,
        defaultHashtags: result.defaultHashtags || prev.defaultHashtags,
      }));

      // If we are creating a new company, we might want to set the name too
      if (isCreating && result.companyName) {
        setNewCompanyName(result.companyName);
      } else if (activeCompany && result.companyName && result.companyName !== activeCompany.name) {
        // Optionally update the active company's name
        await updateDoc(doc(db, 'companies', activeCompany.id), {
          name: result.companyName
        });
      }

      setQuickstartText('');
    } catch (e) {
      console.error("Error analyzing text", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        setQuickstartText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveBrandContext = async () => {
    if (!activeCompany) return;
    try {
      // Firestore does not support undefined values, so we remove them or set them to null/empty string
      const sanitizedSettings = { ...localBrandSettings };
      Object.keys(sanitizedSettings).forEach(key => {
        const k = key as keyof BrandSettings;
        if (sanitizedSettings[k] === undefined) {
          delete sanitizedSettings[k];
        }
      });

      await updateDoc(doc(db, 'companies', activeCompany.id), {
        name: localCompanyName,
        brandSettings: sanitizedSettings
      });
      // Optionally show a success message here
    } catch (e) {
      console.error("Error saving brand context", e);
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim() || !auth.currentUser) return;
    
    try {
      const docRef = await addDoc(collection(db, 'companies'), {
        name: newCompanyName,
        ownerId: auth.currentUser.uid,
        brandSettings: DEFAULT_BRAND_SETTINGS,
        templates: [],
        createdAt: serverTimestamp()
      });
      onSelectCompany(docRef.id);
      setIsCreating(false);
      setNewCompanyName('');
    } catch (e) {
      console.error("Error creating company", e);
    }
  };

  const handleSaveTemplate = async () => {
    if (!activeCompany || !editingTemplate) return;
    
    try {
      let updatedTemplates = [...(activeCompany.templates || [])];
      
      if (editingTemplate.id) {
        // Update existing
        updatedTemplates = updatedTemplates.map(t => t.id === editingTemplate.id ? editingTemplate : t);
      } else {
        // Add new
        updatedTemplates.push({
          ...editingTemplate,
          id: Date.now().toString()
        });
      }
      
      await updateDoc(doc(db, 'companies', activeCompany.id), {
        templates: updatedTemplates
      });
      
      setEditingTemplate(null);
    } catch (e) {
      console.error("Error saving template", e);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!activeCompany) return;
    try {
      const updatedTemplates = activeCompany.templates.filter(t => t.id !== templateId);
      await updateDoc(doc(db, 'companies', activeCompany.id), {
        templates: updatedTemplates
      });
    } catch (e) {
      console.error("Error deleting template", e);
    }
  };

  const handleCloneDefaultTemplate = () => {
    const defaultHtml = `<div class="template-container">
  {{#brand.logoUrl}}
  <div class="logo-container logo-{{brand.logoPosition}}">
    <img src="{{brand.logoUrl}}" class="logo" />
  </div>
  {{/brand.logoUrl}}
  
  {{#imageBase64}}
  <div class="background-image">
    <img src="{{imageBase64}}" />
  </div>
  {{/imageBase64}}

  <div class="content-wrapper">
    <div class="main-content">
      {{#tagline}}
      <div class="tagline">{{tagline}}</div>
      {{/tagline}}
      
      {{#headline}}
      <h1 class="headline">{{headline}}</h1>
      {{/headline}}
      
      {{#body}}
      <p class="body-text">{{body}}</p>
      {{/body}}
    </div>

    <div class="footer">
      {{#subtext}}
      <div class="subtext">{{subtext}}</div>
      {{/subtext}}
      
      {{#cta}}
      <div class="cta">{{cta}}</div>
      {{/cta}}
    </div>
  </div>
</div>`;

    const defaultCss = `.template-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  background-color: {{#isDarkMode}}#111827{{/isDarkMode}}{{^isDarkMode}}#ffffff{{/isDarkMode}};
  color: {{#isDarkMode}}#ffffff{{/isDarkMode}}{{^isDarkMode}}#111827{{/isDarkMode}};
  font-family: system-ui, -apple-system, sans-serif;
}

.background-image {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.background-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.2;
}

.content-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  padding: 6rem;
  position: relative;
  z-index: 10;
  box-sizing: border-box;
}

.logo-container {
  position: absolute;
  z-index: 20;
}
.logo-top-left { top: 3rem; left: 3rem; }
.logo-top-right { top: 3rem; right: 3rem; }
.logo-bottom-left { bottom: 3rem; left: 3rem; }
.logo-bottom-right { bottom: 3rem; right: 3rem; }

.logo {
  width: 6rem;
  height: 6rem;
  object-fit: contain;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.tagline {
  font-size: 1.5rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1.5rem;
  color: {{brand.primaryColor}};
}

.headline {
  font-size: 4.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 2rem;
  margin-top: 0;
  color: {{brand.secondaryColor}};
}

.body-text {
  font-size: 1.875rem;
  line-height: 1.625;
  opacity: 0.8;
  max-width: 48rem;
  margin-bottom: 3rem;
  margin-top: 0;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.subtext {
  font-size: 1.5rem;
  font-weight: 500;
  opacity: 0.6;
}

.cta {
  padding: 1rem 2rem;
  border-radius: 9999px;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  background-color: {{brand.accentColor}};
}`;

    setEditingTemplate({
      id: '',
      name: 'Default Template (Copy)',
      html: defaultHtml,
      css: defaultCss
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <h2 className="text-xl font-bold text-white">Company & Template Settings</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Companies */}
          <div className="w-64 border-r border-slate-800 bg-slate-900/30 p-4 flex flex-col gap-4 overflow-y-auto">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Your Companies</h3>
            
            <div className="space-y-2">
              {companies.map(company => (
                <button
                  key={company.id}
                  onClick={() => onSelectCompany(company.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all ${activeCompanyId === company.id ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                >
                  <div className="font-bold text-sm">{company.name}</div>
                </button>
              ))}
            </div>

            {isCreating ? (
              <div className="bg-slate-800 p-3 rounded-xl space-y-3 border border-slate-700">
                <input 
                  type="text" 
                  placeholder="Company Name"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-0"
                />
                <div className="flex gap-2">
                  <button onClick={handleCreateCompany} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded transition-colors">Save</button>
                  <button onClick={() => setIsCreating(false)} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold py-2 rounded transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setIsCreating(true)}
                className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-300 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-plus"></i> Add Company
              </button>
            )}
          </div>

          {/* Right Content - Templates */}
          <div className="flex-1 p-6 overflow-y-auto bg-slate-950">
            {activeCompany ? (
              <div className="space-y-8">
                
                {/* Brand Context Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">Brand Context</h3>
                      <p className="text-sm text-slate-400">Define the core identity and voice of this company.</p>
                    </div>
                    <button onClick={handleSaveBrandContext} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors">
                      Save Context
                    </button>
                  </div>

                  {/* Quickstart AI Import */}
                  <div className="mb-6 bg-blue-900/20 border border-blue-800/50 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <i className="fa-solid fa-wand-magic-sparkles text-blue-400"></i>
                      <h4 className="text-sm font-bold text-blue-100">Snelstart: Importeer Bedrijfsinfo</h4>
                    </div>
                    <p className="text-xs text-blue-200/70 mb-4">
                      Plak een tekst (bijv. van je 'Over ons' pagina) of upload een tekstbestand. Onze AI vult automatisch alle velden hieronder voor je in.
                    </p>
                    
                    <div className="space-y-3">
                      <textarea 
                        value={quickstartText}
                        onChange={(e) => setQuickstartText(e.target.value)}
                        placeholder="Plak hier je bedrijfsinformatie, pitch deck of website tekst..."
                        className="w-full h-24 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 focus:ring-0"
                      />
                      
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={handleQuickstartAnalyze}
                          disabled={isAnalyzing || !quickstartText.trim()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                          {isAnalyzing ? (
                            <><i className="fa-solid fa-circle-notch fa-spin"></i> Bezig...</>
                          ) : (
                            <><i className="fa-solid fa-robot"></i> Analyseer Tekst</>
                          )}
                        </button>
                        
                        <div className="text-slate-500 text-xs font-bold">OF</div>
                        
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                        >
                          <i className="fa-solid fa-file-upload"></i> Upload Bestand (.txt, .md)
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept=".txt,.md" 
                          onChange={handleFileUpload} 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Company Name</label>
                      <input type="text" placeholder="e.g., Acme Corp" value={localCompanyName} onChange={(e) => setLocalCompanyName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-0" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Company Type</label>
                        <input type="text" placeholder="e.g., B2B SaaS, Local Bakery" value={localBrandSettings.companyType} onChange={(e) => setLocalBrandSettings(prev => ({ ...prev, companyType: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-0" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Target Audience</label>
                        <input type="text" placeholder="e.g., Marketing Managers, Young Professionals" value={localBrandSettings.targetAudience} onChange={(e) => setLocalBrandSettings(prev => ({ ...prev, targetAudience: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-0" />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Tone of Voice</label>
                        <input type="text" placeholder="e.g., Professional and helpful, Playful and energetic" value={localBrandSettings.toneOfVoice} onChange={(e) => setLocalBrandSettings(prev => ({ ...prev, toneOfVoice: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-0" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Unique Selling Points (USP)</label>
                        <input type="text" placeholder="e.g., 24/7 Support, Eco-friendly" value={localBrandSettings.usp || ''} onChange={(e) => setLocalBrandSettings(prev => ({ ...prev, usp: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-0" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Visual Style</label>
                        <input type="text" placeholder="e.g., Modern, Minimalist, Vibrant" value={localBrandSettings.visualStyleType || ''} onChange={(e) => setLocalBrandSettings(prev => ({ ...prev, visualStyleType: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-0" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Illustration/Photo Style</label>
                        <input type="text" placeholder="e.g., 3D Renders, Flat Design, Realistic Photos" value={localBrandSettings.illustrationStyle || ''} onChange={(e) => setLocalBrandSettings(prev => ({ ...prev, illustrationStyle: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-0" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Default Hashtags</label>
                      <input type="text" placeholder="e.g., #tech #innovation #startup" value={localBrandSettings.defaultHashtags || ''} onChange={(e) => setLocalBrandSettings(prev => ({ ...prev, defaultHashtags: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:border-blue-500 focus:ring-0" />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description / Mission</label>
                      <textarea placeholder="Briefly describe what the company does..." value={localBrandSettings.companyDescription} onChange={(e) => setLocalBrandSettings(prev => ({ ...prev, companyDescription: e.target.value }))} className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white h-24 focus:border-blue-500 focus:ring-0" />
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
                      <button 
                        onClick={handleDeleteCompany}
                        className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
                      >
                        <i className="fa-solid fa-trash"></i> Delete Company
                      </button>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-800" />

                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Custom HTML Templates</h3>
                  <p className="text-sm text-slate-400 mb-6">Create custom layouts using HTML and CSS. Use Mustache syntax like {'{{headline}}'}, {'{{body}}'}, {'{{imageBase64}}'} to inject content.</p>
                  
                  {editingTemplate ? (
                    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-4">
                      <input 
                        type="text" 
                        placeholder="Template Name (e.g., 'Modern Overlay')"
                        value={editingTemplate.name}
                        onChange={(e) => setEditingTemplate({...editingTemplate, name: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-4 py-3 text-white font-bold focus:border-blue-500 focus:ring-0"
                      />
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">HTML Structure</label>
                        <textarea 
                          value={editingTemplate.html}
                          onChange={(e) => setEditingTemplate({...editingTemplate, html: e.target.value})}
                          placeholder="<div class='my-custom-layout'>\n  <h1>{{headline}}</h1>\n  <p>{{body}}</p>\n</div>"
                          className="w-full h-48 bg-slate-950 border border-slate-700 rounded p-4 text-sm font-mono text-slate-300 focus:border-blue-500 focus:ring-0"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">CSS Styling</label>
                        <textarea 
                          value={editingTemplate.css}
                          onChange={(e) => setEditingTemplate({...editingTemplate, css: e.target.value})}
                          placeholder=".my-custom-layout {\n  padding: 2rem;\n  background: var(--color-primary);\n}"
                          className="w-full h-48 bg-slate-950 border border-slate-700 rounded p-4 text-sm font-mono text-slate-300 focus:border-blue-500 focus:ring-0"
                        />
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button onClick={handleSaveTemplate} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors">Save Template</button>
                        <button onClick={() => setEditingTemplate(null)} className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {activeCompany.templates?.map(template => (
                          <div key={template.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-white">{template.name}</h4>
                              <p className="text-xs text-slate-400 mt-1">Custom Template</p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => setEditingTemplate(template)} className="w-8 h-8 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 flex items-center justify-center transition-colors">
                                <i className="fa-solid fa-pen"></i>
                              </button>
                              <button onClick={() => handleDeleteTemplate(template.id)} className="w-8 h-8 rounded bg-red-900/30 hover:bg-red-900/50 text-red-400 flex items-center justify-center transition-colors">
                                <i className="fa-solid fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        <button 
                          onClick={() => setEditingTemplate({ id: '', name: '', html: '', css: '' })}
                          className="bg-slate-900 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-slate-300 transition-colors min-h-[100px]"
                        >
                          <i className="fa-solid fa-plus text-2xl mb-2"></i>
                          <span className="font-bold text-sm">Create Blank Template</span>
                        </button>
                        
                        <button 
                          onClick={handleCloneDefaultTemplate}
                          className="bg-slate-900 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-slate-300 transition-colors min-h-[100px]"
                        >
                          <i className="fa-solid fa-copy text-2xl mb-2"></i>
                          <span className="font-bold text-sm">Clone Default Template</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500">
                <i className="fa-solid fa-building text-4xl mb-4 opacity-50"></i>
                <p>Select or create a company to manage templates.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
