import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronDown, Search, Loader2, Sparkles } from 'lucide-react';
import api from '../lib/axios'; // Adjust based on your actual api utility import path
import { useGlassToast } from './GlassToastContainer'; // Assuming you have a toast system in place for user feedback

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateOfferModal({ isOpen, onClose, onSuccess }: CreateOfferModalProps) {
  // ─── STATE MANAGEMENT ──────────────────────────────────────────────────
  const { showToast } = useGlassToast();
  const [loadingPipelines, setLoadingPipelines] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    applicationId: '',
    templateId: '',
    position: '',
    department: '',
    salary: '',
    currency: 'USD',
    startDate: '',
    location: '',
    employmentType: 'Full-time',
    customContent: ''
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // ─── INITIALIZATION DATA FETCHING ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      setLoadingPipelines(true);
      try {
        // 1. Fetch Company Templates
        const tempRes = await api.get('/company/offers/templates');
        setTemplates(tempRes.data?.templates || tempRes.data?.data || []);

        // 2. Fetch Company Jobs to extract Candidate Pipelines
        const jobsRes = await api.get('/company/jobs');
        const jobsArray = jobsRes.data?.jobs || jobsRes.data?.data || [];

        if (Array.isArray(jobsArray) && jobsArray.length > 0) {
          const pipelinePromises = jobsArray.map(async (job: any) => {
            try {
              const appRes = await api.get(`/company/jobs/${job.id}/applications`);
              const originalApps = appRes.data?.applications || appRes.data?.data || [];
              
              if (Array.isArray(originalApps)) {
                return originalApps
                  .filter((app: any) => 
                    app.status === 'technical_round' || 
                    app.status === 'hr_round' || 
                    app.status === 'applied'
                  )
                  .map((app: any) => {
                    // Extract exact application identifier explicitly
                    const targetId = app.applicationId || app.id || app._id;
                    return {
                      ...app,
                      id: targetId, // Safeguard fallback field
                      applicationId: targetId, // Explicitly keep backend payload structural naming
                      jobTitle: job.title,
                      department: job.department,
                      candidateName: app.candidate?.fullName || app.jobSeekerProfile?.fullName || 'Unknown Candidate'
                    };
                  });
              }
              return [];
            } catch (err) {
              console.error(`Error pulling pipeline for job ${job.id}:`, err);
              return [];
            }
          });

          const resolvedPipelines = await Promise.all(pipelinePromises);
          setApplications(resolvedPipelines.flat());
        }
      } catch (error) {
        console.error('Failed to load initial component initialization context:', error);
      } finally {
        setLoadingPipelines(false);
      }
    };

    fetchInitialData();
  }, [isOpen]);

  // Click Outside Dropdown Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── FILTER AND SELECTION LOGIC ────────────────────────────────────────
  const filteredApplications = applications.filter(app =>
    app.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCandidate = (app: any) => {
    // FIXED: Directly verify either field formatting variations to perfectly prevent alert intercepts
    const validId = app.applicationId || app.id;

    if (!validId) {
      console.error("Critical: Selected candidate object is missing a valid identifier tracking ID", app);
      showToast('failed', "Cannot select candidate: Record has an invalid ID payload mapping.", 'danger');
      return;
    }

    setFormData(prev => ({
      ...prev,
      applicationId: validId, // Safely mapped to state payload variable
      position: app.jobTitle || '',
      department: app.department || '',
      location: app.candidate?.location || app.jobSeekerProfile?.location || ''
    }));
    setSearchQuery(`${app.candidateName} — ${app.jobTitle}`);
    setIsDropdownOpen(false);
  };

  // ─── FORM ACTION SUBMIT HANDLER ────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicationId) {
      showToast('failed', 'Please select a valid candidate from the pipeline first.', 'danger');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await api.post('/company/offers/create', formData);
      if (response.data?.success) {
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Create offer letter generation error:', error);
      showToast('failed', error.response?.data?.message || 'Failed to generate offer letter.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Generate Offer Letter
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5 font-sans">Prepare and dispatch a formal offer template to active candidates</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-900 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Pipeline Block */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Candidate Pipeline Dropdown Select */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Target Candidate Profile</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={loadingPipelines}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2.5 text-left text-sm text-zinc-200 shadow-sm flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
              >
                <span className="truncate">
                  {loadingPipelines ? 'Loading pipeline matches...' : (searchQuery || 'Select a candidate profile...')}
                </span>
                {loadingPipelines ? (
                  <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-400" />
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-zinc-950 border border-zinc-800 rounded-lg shadow-xl overflow-hidden animate-in slide-in-from-top-2 duration-150">
                  <div className="p-2 border-b border-zinc-800 bg-zinc-900/30 flex items-center gap-2">
                    <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                    <input
                      type="text"
                      placeholder="Filter by name or posting role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-0 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-0 p-0"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-zinc-900">
                    {filteredApplications.length === 0 ? (
                      <p className="p-4 text-sm text-zinc-600 text-center font-sans">No structural pipeline matches found</p>
                    ) : (
                      filteredApplications.map((app, index) => {
                        const currentAppId = app.applicationId || app.id;
                        const isSelected = formData.applicationId === currentAppId;
                        const renderItemKey = `candidate-item-${currentAppId || 'unmapped'}-${index}`;
                        
                        return (
                          <button
                            key={renderItemKey}
                            type="button"
                            onClick={() => handleSelectCandidate(app)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between hover:bg-zinc-900 ${
                              isSelected ? 'bg-zinc-900 text-white' : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <div>
                              <p className="font-medium text-zinc-200">{app.candidateName}</p>
                              <p className="text-xs text-zinc-500 font-sans">
                                {app.jobTitle} • <span className="capitalize text-purple-400/80">{app.status?.replace('_', ' ')}</span>
                              </p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Position Title</label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                placeholder="e.g. Software Engineer Trainee"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="e.g. Engineering"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Offer Template Mapping</label>
              <select
                value={formData.templateId}
                onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="">Select a template model...</option>
                {templates.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name} {t.isDefault ? '(Default)' : ''}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Employment Nature Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData(prev => ({ ...prev, employmentType: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="Full-time">Full-time Regular</option>
                <option value="Part-time">Part-time Schedule</option>
                <option value="Contract">Contractual Basis</option>
                <option value="Internship">Internship Structural</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Compensation Rate (Annual/Monthly)</label>
              <div className="flex rounded-lg shadow-sm">
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="bg-zinc-900 border border-zinc-800 rounded-l-lg px-3 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-purple-500 border-r-0"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
                <input
                  type="number"
                  required
                  placeholder="0.00"
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-r-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Effective Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Work Location Deployment</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Remote, Bangalore Office, Kochi InfoPark"
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Custom Addendums (Optional)</label>
            <textarea
              rows={4}
              value={formData.customContent}
              onChange={(e) => setFormData(prev => ({ ...prev, customContent: e.target.value }))}
              placeholder="Enter optional markdown template overrides or dynamic clauses here..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-purple-500 custom-scrollbar resize-none"
            />
          </div>

          {/* Action Trigger Row */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-900">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.applicationId}
              className="px-5 py-2 text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white rounded-lg shadow-md transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Offer...
                </>
              ) : (
                'Generate & Prepare Offer'
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}