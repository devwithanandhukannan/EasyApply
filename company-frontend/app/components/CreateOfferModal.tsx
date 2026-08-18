'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ChevronDown, Search, Loader2, Sparkles, FileText, User, Building, Calendar, DollarSign, MapPin, Briefcase } from 'lucide-react';
import api from '../lib/axios';
import { useGlassToast } from './GlassToastContainer';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateOfferModal({ isOpen, onClose, onSuccess }: CreateOfferModalProps) {
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

  useEffect(() => {
    if (!isOpen) return;

    const fetchInitialData = async () => {
      setLoadingPipelines(true);
      try {
        const tempRes = await api.get('/company/offers/templates');
        setTemplates(tempRes.data?.templates || tempRes.data?.data || []);

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
                    const targetId = app.applicationId || app.id || app._id;
                    return {
                      ...app,
                      id: targetId,
                      candidateName: app.candidateName || app.jobSeekerProfile?.fullName || 'Candidate',
                      jobTitle: job.title,
                      department: job.department || ''
                    };
                  });
              }
              return [];
            } catch (err) {
              return [];
            }
          });

          const results = await Promise.all(pipelinePromises);
          setApplications(results.flat());
        }
      } catch (error) {
        console.error('Data initialization trace failure:', error);
      } finally {
        setLoadingPipelines(false);
      }
    };

    fetchInitialData();
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredApplications = applications.filter((app: any) => {
    const name = app.candidateName || '';
    const title = app.jobTitle || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || title.toLowerCase().includes(query);
  });

  const handleSelectCandidate = (app: any) => {
    const validId = app.id || app.applicationId || app._id;
    if (!validId) {
      showToast('Validation Error', 'Cannot select candidate: Record has an invalid ID.', 'danger');
      return;
    }

    setFormData(prev => ({
      ...prev,
      applicationId: validId,
      position: app.jobTitle || '',
      department: app.department || '',
      location: app.candidate?.location || app.jobSeekerProfile?.location || ''
    }));
    setSearchQuery(`${app.candidateName} — ${app.jobTitle}`);
    setIsDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicationId) {
      showToast('Validation Error', 'Please select a valid candidate from the pipeline first.', 'danger');
      return;
    }
    setIsSubmitting(true);

    try {
      const response = await api.post('/company/offers/create', formData);
      if (response.data?.success) {
        showToast('Success', 'Offer letter generated successfully', 'success');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Create offer letter error:', error);
      showToast('Creation Failed', error.response?.data?.message || 'Failed to generate offer letter.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased">
        
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                Generate Offer Letter
              </h3>
              <p className="text-xs text-[#86868b] dark:text-slate-400 font-medium">
                Prepare and dispatch a formal offer letter to active candidates
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Candidate Pipeline Dropdown Select */}
          <div className="space-y-1.5" ref={dropdownRef}>
            <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
              Target Candidate Profile
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={loadingPipelines}
                className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-3 text-left text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] flex items-center justify-between focus:outline-none focus:border-[#0071e3] disabled:opacity-50 cursor-pointer transition-colors"
              >
                <span className="truncate">
                  {loadingPipelines ? 'Loading pipeline matches...' : (searchQuery || 'Select a candidate profile...')}
                </span>
                {loadingPipelines ? (
                  <Loader2 className="w-4 h-4 text-[#86868b] animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#86868b]" />
                )}
              </button>

              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#fbfbfd] dark:bg-[#18181a] flex items-center gap-2">
                    <Search className="w-4 h-4 text-[#86868b] shrink-0 ml-1" />
                    <input
                      type="text"
                      placeholder="Filter by candidate name or position..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-0 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] focus:outline-none p-1"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                    {filteredApplications.length === 0 ? (
                      <p className="p-4 text-xs text-[#86868b] text-center font-medium">No candidate matches found</p>
                    ) : (
                      filteredApplications.map((app, index) => {
                        const currentAppId = app.applicationId || app.id;
                        const isSelected = formData.applicationId === currentAppId;
                        
                        return (
                          <button
                            key={`candidate-item-${currentAppId || 'unmapped'}-${index}`}
                            type="button"
                            onClick={() => handleSelectCandidate(app)}
                            className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between hover:bg-black/[0.04] dark:hover:bg-white/[0.06] cursor-pointer ${
                              isSelected ? 'bg-[#0071e3]/10 text-[#0071e3] font-bold' : 'text-[#1d1d1f] dark:text-[#f5f5f7]'
                            }`}
                          >
                            <div>
                              <p className="font-bold text-xs">{app.candidateName}</p>
                              <p className="text-[11px] text-[#86868b] font-medium">
                                {app.jobTitle} &bull; <span className="capitalize text-[#0071e3]">{app.status?.replace('_', ' ')}</span>
                              </p>
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#0071e3]" />}
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
              <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Position Title</label>
              <input
                type="text"
                required
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                placeholder="e.g. Software Engineer Trainee"
                className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="e.g. Engineering"
                className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Offer Template Mapping</label>
              <select
                value={formData.templateId}
                onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
                className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] cursor-pointer"
              >
                <option value="">Select a template model...</option>
                {templates.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name} {t.isDefault ? '(Default)' : ''}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Employment Nature</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData(prev => ({ ...prev, employmentType: e.target.value }))}
                className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] cursor-pointer"
              >
                <option value="Full-time">Full-time Regular</option>
                <option value="Part-time">Part-time Schedule</option>
                <option value="Contract">Contractual Basis</option>
                <option value="Internship">Internship Structural</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Compensation Rate</label>
              <div className="flex rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08]">
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                  className="bg-[#e5e5ea] dark:bg-[#3a3a3c] px-3 text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none cursor-pointer border-r border-black/[0.06] dark:border-white/[0.08]"
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
                  className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Effective Start Date</label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Work Location Deployment</label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. Remote, Bangalore Office, Kochi InfoPark"
              className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Custom Addendums (Optional)</label>
            <textarea
              rows={3}
              value={formData.customContent}
              onChange={(e) => setFormData(prev => ({ ...prev, customContent: e.target.value }))}
              placeholder="Enter optional markdown template overrides or dynamic clauses here..."
              className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-3 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] custom-scrollbar resize-none transition-colors"
            />
          </div>

          {/* Modal Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-2xl text-xs font-semibold hover:bg-[#e5e5ea] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.applicationId}
              className="px-5 py-2 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Offer...</span>
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