'use client';

import { useEffect, useState } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Star, 
  Sparkles, 
  Loader2, 
  Eye, 
  Building2, 
  Code 
} from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';

interface OfferTemplate {
  id: string;
  name: string;
  content: any;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function OfferTemplatesPage() {
  const { showToast } = useGlassToast();
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OfferTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<any>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    isDefault: false,
    useAI: true
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/company/offers/templates');
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!formData.name.trim()) {
      showToast('failed', 'Please enter a template name first', 'danger');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await api.post('/company/offers/templates/generate-ai', {
        name: formData.name,
        description: formData.description
      });

      if (response.data.success) {
        setGeneratedPreview(response.data.data);
        setFormData(prev => ({
          ...prev,
          content: JSON.stringify(response.data.data.content, null, 2)
        }));
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      showToast('failed', error.response?.data?.message || 'Failed to generate template', 'danger');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const endpoint = editingTemplate 
        ? `/company/offers/templates/${editingTemplate.id}`
        : '/company/offers/templates';
      
      const method = editingTemplate ? 'put' : 'post';
      
      const payload = {
        name: formData.name,
        description: formData.description,
        content: formData.content ? JSON.parse(formData.content) : null,
        isDefault: formData.isDefault,
        useAI: formData.useAI && !formData.content
      };
      
      const response = await api[method](endpoint, payload);
      
      if (response.data.success) {
        fetchTemplates();
        resetForm();
      }
    } catch (error: any) {
      console.error('Template save error:', error);
      showToast('failed', error.response?.data?.message || 'Failed to save template', 'danger');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template permanently?')) return;

    try {
      await api.delete(`/company/offers/templates/${id}`);
      fetchTemplates();
    } catch (error) {
      console.error('Delete error:', error);
      showToast('failed', 'Failed to delete template.', 'danger');
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      description: '', 
      content: '', 
      isDefault: false,
      useAI: true 
    });
    setEditingTemplate(null);
    setGeneratedPreview(null);
    setIsModalOpen(false);
    setShowRawJson(false);
  };

  const openEditModal = (template: OfferTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: '',
      content: JSON.stringify(template.content, null, 2),
      isDefault: template.isDefault,
      useAI: false
    });
    setGeneratedPreview({ content: template.content });
    setIsModalOpen(true);
  };

  // Helper parser for dynamic fields rendering inside the structural model card view
  const getDocumentFields = () => {
    if (!formData.content) return null;
    try {
      const data = JSON.parse(formData.content);
      return {
        body: data.terms || data.body || data.text || "Formal appointment parameters generated.",
        title: data.title || data.role || "Specified Target Position",
        salary: data.salary || data.compensation || "[Compensation Parameter]",
        benefits: data.benefits || data.allowances || null
      };
    } catch (e) {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-black font-sans">
        <div className="flex flex-col items-center gap-2">
          <div className="w-5 h-5 border border-zinc-900 border-t-zinc-400 rounded-full animate-spin"></div>
          <p className="text-zinc-500 text-[11px] font-medium tracking-wide">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-zinc-300 font-sans antialiased max-w-5xl mx-auto w-full p-4 animate-fade-in">
      
      {/* Editorial Page Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-zinc-400" />
            Offer Frameworks
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">Generate and review streamlined offer templates with AI validation.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-2 text-xs shadow-md shadow-white/5"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New Template
        </button>
      </div>

      {/* Main Templates Grid */}
      {templates.length === 0 ? (
        <div className="border border-zinc-900 bg-zinc-950/40 p-12 rounded-2xl text-center max-w-md mx-auto shadow-xl">
          <Sparkles className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">No templates found</h3>
          <p className="text-zinc-500 text-xs mb-5 max-w-xs mx-auto leading-relaxed">
            Utilize integrated intelligence layers to draft clean templates for talent procurement structures.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-200 hover:text-white rounded-xl text-xs font-medium transition-all flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Draft with AI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => {
            // Safely parse individual template data variables down to human abstracts 
            let parsedTerms = '';
            let positionTitle = '';
            
            try {
              const contentObj = typeof template.content === 'string' 
                ? JSON.parse(template.content) 
                : template.content;
                
              parsedTerms = contentObj?.terms || contentObj?.body || contentObj?.text || '';
              positionTitle = contentObj?.title || contentObj?.role || '';
            } catch (e) {
              parsedTerms = String(template.content);
            }

            return (
              <div
                key={template.id}
                className="border border-zinc-900 bg-zinc-950 p-5 rounded-2xl hover:border-zinc-800 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Dynamic Card Header */}
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors truncate">
                          {template.name}
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                          Created {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {template.isDefault && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(template)}
                        className="p-1.5 border border-zinc-900 hover:border-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
                        title="Modify template parameters"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1.5 border border-zinc-900 hover:border-zinc-800 rounded-lg text-zinc-600 hover:text-red-400 transition-colors"
                        title="Remove template index"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ─── MINIATURE CARD DOCUMENT PREVIEW ABSTRACT ─── */}
                  <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-3.5 mb-4 space-y-2 relative overflow-hidden group-hover:border-zinc-800/80 transition-all">
                    <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1.5 mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                        <Eye size={10} /> Document Snippet
                      </span>
                      {positionTitle && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 font-medium border border-zinc-800 truncate max-w-[140px]">
                          {positionTitle}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-zinc-400 font-normal line-clamp-3 leading-relaxed">
                      {parsedTerms || "No formal offer terms defined inside template model parameters."}
                    </p>
                    
                    {/* Visual fading accent paper line block */}
                    <div className="absolute bottom-0 right-0 left-0 h-4 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Status Bar Row Footer */}
                <div className="flex items-center justify-end text-[11px] font-medium border-t border-zinc-900/60 pt-3 mt-1">
                  {template.isActive ? (
                    <span className="text-emerald-500 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_6px_rgba(16,185,129,0.5)]"></div>
                      Active Structure
                    </span>
                  ) : (
                    <span className="text-zinc-600 flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></div>
                      Inactive State
                  </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Structural Generation Modal Panel */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-fade-in">
            
            {/* Modal Header */}
            <div className="border-b border-zinc-900 p-5 flex items-center justify-between bg-zinc-900/20">
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-zinc-400" />
                  {editingTemplate ? 'Modify Document Parameters' : 'AI Intent Formulation'}
                </h2>
                <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                  {editingTemplate ? 'Update standard layout parameters.' : 'Outline requirements to auto-compile formal letters through the configuration layout.'}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="p-1.5 rounded-lg border border-zinc-900 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Scroll Content Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Template Structural Name */}
              <div className="grid grid-cols-1 gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  Framework Identity *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-900/40 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white focus:border-zinc-700 outline-none"
                  placeholder="e.g. Senior Executive Alignment Form"
                />
              </div>

              {/* Description Prompt Context Block */}
              {!editingTemplate && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Context Requirements / Prompt
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-zinc-900/40 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-white focus:border-zinc-700 outline-none resize-none leading-relaxed"
                      rows={3}
                      placeholder="e.g. Specify standard 60-day evaluation parameters, equity configurations, and hybrid schedules..."
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !formData.name.trim()}
                    className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 disabled:bg-zinc-900/20 disabled:border-zinc-900 text-zinc-200 disabled:text-zinc-600 rounded-xl text-xs font-medium transition-all flex items-center gap-2 shadow-sm"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing and processing layout states...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Compile Framework via AI
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* LIVE DOCUMENT MODAL PREVIEW */}
              {formData.content && getDocumentFields() && (
                <div className="space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
                      <Eye className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Document Simulation Preview</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRawJson(!showRawJson)}
                      className="text-[10px] font-medium text-zinc-600 hover:text-zinc-400 inline-flex items-center gap-1 transition-colors"
                    >
                      <Code size={12} />
                      <span>{showRawJson ? 'Hide Structural Array Data' : 'Inspect System JSON Matrix'}</span>
                    </button>
                  </div>
                  
                  {/* Digital Paper Container Simulation */}
                  <div className="bg-white border border-zinc-200 text-zinc-800 rounded-2xl p-6 shadow-xl max-h-72 overflow-y-auto space-y-4 font-sans text-xs leading-relaxed">
                    <div className="border-b border-zinc-100 pb-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded bg-zinc-900 flex items-center justify-center text-white shrink-0">
                        <Building2 size={14} />
                      </div>
                      <div>
                        <p className="font-bold text-zinc-950 tracking-tight">Corporate Appointment Notice</p>
                        <p className="text-[10px] text-zinc-400 font-medium">Ref Framework Mapping // Dynamic Output</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Designated Assignment Title</span>
                        <p className="font-bold text-zinc-950 text-sm">{getDocumentFields()?.title}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Letter Body Content Overview</span>
                        <p className="text-zinc-600 font-normal whitespace-pre-line">{getDocumentFields()?.body}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Remuneration / Salary Parameters</span>
                          <p className="font-semibold text-zinc-900">{getDocumentFields()?.salary}</p>
                        </div>
                        {getDocumentFields()?.benefits && (
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">Ancillary Allowances / Benefits</span>
                            <p className="text-zinc-600 font-normal truncate">{String(getDocumentFields()?.benefits)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Best Practices Advice */}
              {generatedPreview?.industryBestPractices && (
                <div className="text-[11px] text-zinc-500 font-medium leading-relaxed bg-zinc-900/10 border border-zinc-900 p-3 rounded-xl">
                  <p className="font-bold text-zinc-400 mb-1">💡 Industry Alignment Notes:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-zinc-500">
                    {generatedPreview.industryBestPractices.map((tip: string, idx: number) => (
                      <li key={idx} className="font-normal">{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Collapsible Hidden Developer JSON View */}
              <div className={showRawJson || !formData.content ? "block" : "hidden"}>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  System Content Structuring Data (JSON Mapping Block)
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-zinc-900/40 border border-zinc-900 rounded-xl px-4 py-2.5 text-xs text-zinc-400 focus:border-zinc-700 outline-none font-mono leading-relaxed"
                  rows={6}
                  placeholder="The operational parsing fields will update here automatically post-AI validation sequence..."
                />
              </div>

              {/* Default Placement Toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer py-1 select-none">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="w-3.5 h-3.5 bg-zinc-900 border-zinc-800 rounded accent-white text-zinc-950"
                />
                <span className="text-xs text-zinc-400 font-medium inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-zinc-500" />
                  Set as primary default choice template
                </span>
              </label>

              {/* Action Buttons Panel */}
              <div className="flex items-center gap-2 pt-4 border-t border-zinc-900 bg-zinc-950">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-white text-black font-bold rounded-xl text-xs hover:bg-zinc-200 transition-colors shadow-sm"
                >
                  {editingTemplate ? 'Update Document' : 'Save Template'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}