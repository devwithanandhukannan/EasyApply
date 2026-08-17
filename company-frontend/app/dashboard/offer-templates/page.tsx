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

import { useAuth } from '@/app/contexts/AuthContext';
import LockedFeaturePaywall from '@/app/components/LockedFeaturePaywall';

export default function OfferTemplatesPage() {
  const { showToast } = useGlassToast();
  const { hasFeature } = useAuth();
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OfferTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<any>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  const hasAccess = hasFeature('offerLetters');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    isDefault: false,
    useAI: true
  });

  if (!hasAccess) {
    return (
      <LockedFeaturePaywall
        featureKey="offerLetters"
        featureTitle="Digital Offer Templates & Contract Generator"
        featureDescription="Design reusable legal offer letter templates, insert smart candidate merge tags, and automate formal letter dispatches."
      />
    );
  }

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 text-[#1d1d1f] dark:text-[#f5f5f7] max-w-5xl mx-auto w-full">
      
      {/* Editorial Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#0071e3]" />
            Offer Frameworks
          </h1>
          <p className="text-xs sm:text-sm text-[#86868b] mt-0.5">Generate, customize, and manage formal candidate offer letters with AI assistance.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold rounded-2xl transition-all flex items-center gap-2 text-xs shadow-[0_4px_14px_rgba(0,113,227,0.3)] cursor-pointer"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New Template
        </button>
      </div>

      {/* Main Templates Grid */}
      {templates.length === 0 ? (
        <div className="border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-12 rounded-3xl text-center max-w-md mx-auto shadow-sm space-y-4">
          <div className="w-14 h-14 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-2xl flex items-center justify-center mx-auto text-[#0071e3]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">No templates found</h3>
            <p className="text-[#86868b] text-xs max-w-xs mx-auto leading-relaxed">
              Create and structure reusable offer templates or generate intelligent drafts with AI.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 mx-auto shadow-[0_4px_14px_rgba(0,113,227,0.3)] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Draft with AI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {templates.map((template) => {
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
                className="border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] hover:border-black/[0.12] dark:hover:border-white/[0.15] p-6 rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all flex flex-col justify-between group space-y-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-[#0071e3]/10 border border-[#0071e3]/20 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-[#0071e3]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-[#f5f5f7] truncate">
                          {template.name}
                        </h3>
                        <p className="text-[10px] text-[#86868b] font-medium mt-0.5">
                          Created {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {template.isDefault && (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => openEditModal(template)}
                        className="p-2 border border-black/[0.06] dark:border-white/[0.08] hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] rounded-xl text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors cursor-pointer"
                        title="Edit Template"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 border border-black/[0.06] dark:border-white/[0.08] hover:bg-[#ff3b30]/10 rounded-xl text-[#86868b] hover:text-[#ff3b30] transition-colors cursor-pointer"
                        title="Delete Template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Document Snippet */}
                  <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-4 space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-1.5 mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-1">
                        <Eye size={10} /> Document Snippet
                      </span>
                      {positionTitle && (
                        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold border border-black/[0.04] dark:border-white/[0.06] truncate max-w-[140px]">
                          {positionTitle}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-[#6e6e73] dark:text-[#aeaeb2] font-normal line-clamp-3 leading-relaxed">
                      {parsedTerms || "No formal offer terms defined inside template model parameters."}
                    </p>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center justify-end text-[11px] font-semibold border-t border-black/[0.04] dark:border-white/[0.06] pt-3">
                  {template.isActive ? (
                    <span className="text-[#248a3d] dark:text-[#30d158] flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-[#34c759] rounded-full shadow-[0_0_6px_rgba(52,199,89,0.5)]"></div>
                      Active Framework
                    </span>
                  ) : (
                    <span className="text-[#86868b] flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-[#86868b] rounded-full"></div>
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Generation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="border-b border-black/[0.06] dark:border-white/[0.08] p-5 flex items-center justify-between bg-[#f2f2f7]/50 dark:bg-[#2c2c2e]/50">
              <div>
                <h2 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7] tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0071e3]" />
                  {editingTemplate ? 'Modify Document Parameters' : 'AI Intent Formulation'}
                </h2>
                <p className="text-xs text-[#86868b] mt-0.5">
                  {editingTemplate ? 'Update standard layout parameters.' : 'Outline requirements to auto-compile formal letters through the configuration layout.'}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="w-8 h-8 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Modal Scroll Content Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Template Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
                  Framework Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:border-[#0071e3] outline-none font-medium"
                  placeholder="e.g. Senior Executive Engineering Offer"
                />
              </div>

              {/* Description Prompt Context Block */}
              {!editingTemplate && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#86868b]">
                      Context Requirements / Prompt
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:border-[#0071e3] outline-none resize-none leading-relaxed font-medium"
                      rows={3}
                      placeholder="e.g. Specify standard 60-day evaluation parameters, equity configurations, and hybrid schedules..."
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !formData.name.trim()}
                    className="px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-40 text-white rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 shadow-[0_4px_14px_rgba(0,113,227,0.3)] cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating Framework Layout...
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[#86868b] font-medium">
                      <Eye className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Document Simulation Preview</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowRawJson(!showRawJson)}
                      className="text-[10px] font-semibold text-[#0071e3] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Code size={12} />
                      <span>{showRawJson ? 'Hide Raw JSON' : 'Inspect JSON Schema'}</span>
                    </button>
                  </div>
                  
                  {/* Digital Paper Container Simulation */}
                  <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-2xl p-6 shadow-sm max-h-72 overflow-y-auto space-y-4 text-xs leading-relaxed">
                    <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-[#0071e3] flex items-center justify-center text-white shrink-0">
                        <Building2 size={14} />
                      </div>
                      <div>
                        <p className="font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Corporate Appointment Notice</p>
                        <p className="text-[10px] text-[#86868b]">Ref Framework Mapping // Dynamic Output</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868b] block mb-0.5">Designated Assignment Title</span>
                        <p className="font-bold text-[#1d1d1f] dark:text-[#f5f5f7] text-sm">{getDocumentFields()?.title}</p>
                      </div>

                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868b] block mb-0.5">Letter Body Content Overview</span>
                        <p className="text-[#6e6e73] dark:text-[#aeaeb2] whitespace-pre-line leading-relaxed">{getDocumentFields()?.body}</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868b] block mb-0.5">Remuneration / Salary Parameters</span>
                          <p className="font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{getDocumentFields()?.salary}</p>
                        </div>
                        {getDocumentFields()?.benefits && (
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868b] block mb-0.5">Ancillary Allowances / Benefits</span>
                            <p className="text-[#6e6e73] dark:text-[#aeaeb2] truncate">{String(getDocumentFields()?.benefits)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Best Practices Advice */}
              {generatedPreview?.industryBestPractices && (
                <div className="text-xs text-[#86868b] bg-[#0071e3]/5 border border-[#0071e3]/20 p-4 rounded-2xl space-y-1">
                  <p className="font-bold text-[#0071e3] flex items-center gap-1.5">💡 Industry Alignment Notes:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[#6e6e73] dark:text-[#aeaeb2]">
                    {generatedPreview.industryBestPractices.map((tip: string, idx: number) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Collapsible Hidden Developer JSON View */}
              <div className={showRawJson || !formData.content ? "block" : "hidden"}>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#86868b] mb-2">
                  System Content Structuring Data (JSON Mapping Block)
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:border-[#0071e3] outline-none font-mono leading-relaxed"
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
                  className="w-4 h-4 rounded-md accent-[#0071e3]"
                />
                <span className="text-xs text-[#6e6e73] dark:text-[#aeaeb2] font-semibold inline-flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  Set as primary default choice template
                </span>
              </label>

              {/* Action Buttons Panel */}
              <div className="flex items-center gap-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="submit"
                  className="flex-1 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white font-semibold rounded-2xl text-xs shadow-[0_4px_14px_rgba(0,113,227,0.3)] transition-all cursor-pointer"
                >
                  {editingTemplate ? 'Update Document' : 'Save Template'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white rounded-2xl text-xs font-semibold transition-colors cursor-pointer"
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