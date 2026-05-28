'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, FileText, Star, Sparkles, Loader2, Eye } from 'lucide-react';
import api from '@/app/lib/axios';

interface OfferTemplate {
  id: string;
  name: string;
  content: any;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export default function OfferTemplatesPage() {
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<OfferTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<any>(null);

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
      alert('Please enter a template name first');
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
      alert(error.response?.data?.message || 'Failed to generate template');
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
      alert(error.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;

    try {
      await api.delete(`/company/offers/templates/${id}`);
      fetchTemplates();
    } catch (error) {
      console.error('Delete error:', error);
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
    setIsModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-black">
        <p className="text-xs text-zinc-500 animate-pulse font-mono">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white font-mono max-w-5xl mx-auto w-full p-4">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white uppercase flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Offer Letter Templates
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Generate professional offer letters with AI assistance</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <div className="border border-dashed border-zinc-900 bg-zinc-950 p-12 rounded-xl text-center">
          <Sparkles className="w-12 h-12 text-purple-500/30 mx-auto mb-3" />
          <p className="text-sm text-zinc-500 mb-2">No templates created yet</p>
          <p className="text-xs text-zinc-600 mb-4">Use AI to generate your first professional offer letter template</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs transition-colors flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Create with AI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl hover:border-zinc-800 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-zinc-600" />
                  <h3 className="text-sm font-semibold text-white">{template.name}</h3>
                  {template.isDefault && (
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(template)}
                    className="p-1.5 hover:bg-zinc-900 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-zinc-500" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-1.5 hover:bg-zinc-900 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-zinc-500" />
                  </button>
                </div>
              </div>

              <div className="bg-black/40 border border-zinc-900/50 rounded-lg p-3 mb-3">
                <p className="text-xs text-zinc-500 line-clamp-3 font-mono">
                  {typeof template.content === 'string' 
                    ? template.content.substring(0, 150)
                    : JSON.stringify(template.content).substring(0, 150)}...
                </p>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600">
                  {new Date(template.createdAt).toLocaleDateString()}
                </span>
                {template.isActive ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
                    Active
                  </span>
                ) : (
                  <span className="text-zinc-600 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></div>
                    Inactive
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-4xl w-full my-8">
            
            {/* Modal Header */}
            <div className="border-b border-zinc-900 p-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white uppercase flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  {editingTemplate ? 'Edit Template' : 'Create AI Template'}
                </h2>
                <p className="text-xs text-zinc-500 mt-1">
                  {editingTemplate ? 'Update template details' : 'Describe your needs and let AI generate a professional template'}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              
              {/* Template Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-zinc-600 outline-none"
                  placeholder="e.g. Senior Software Engineer Offer"
                />
              </div>

              {/* Description (for AI) */}
              {!editingTemplate && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">
                    Description (Optional) - AI Context
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-zinc-600 outline-none"
                    rows={3}
                    placeholder="e.g. Include 3-month probation, equity options, remote work flexibility..."
                  />
                  
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !formData.name.trim()}
                    className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-zinc-800 text-white disabled:text-zinc-600 font-semibold rounded-lg text-xs transition-colors flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating with AI...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Template with AI
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* AI Preview */}
              {generatedPreview && (
                <div className="border border-purple-900/50 bg-purple-950/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">AI Generated Preview</span>
                  </div>
                  
                  <div className="bg-black/50 border border-zinc-900 rounded-lg p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-zinc-400 whitespace-pre-wrap font-mono">
                      {generatedPreview.previewText || JSON.stringify(generatedPreview.content, null, 2)}
                    </pre>
                  </div>

                  {generatedPreview.industryBestPractices && (
                    <div className="text-xs text-zinc-500">
                      <p className="font-semibold text-zinc-400 mb-1">💡 Best Practices:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {generatedPreview.industryBestPractices.map((tip: string, idx: number) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Template Content (JSON) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">
                  Template Content (JSON) {!editingTemplate && '- Auto-filled by AI'}
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-zinc-600 outline-none font-mono"
                  rows={10}
                  placeholder='AI will generate this automatically...'
                />
              </div>

              {/* Default Template Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="w-4 h-4 bg-black border-zinc-800 rounded accent-purple-600"
                />
                <span className="text-xs text-zinc-400 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5" />
                  Set as default template
                </span>
              </label>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-900">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg text-sm transition-colors"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2.5 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm transition-colors"
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