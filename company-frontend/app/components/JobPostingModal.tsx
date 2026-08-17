// app/components/JobPostingModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Wand2, ShieldAlert } from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from './GlassToastContainer';

interface JobPostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editJob?: any | null;
}

export default function JobPostingModal({ isOpen, onClose, onSuccess, editJob = null }: JobPostingModalProps) {
  const { showToast } = useGlassToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    jobType: 'Full-time',
    locationType: 'Remote',
    location: '',
    experienceRequired: '',
    skills: [] as string[],
    description: '',
    salaryRange: '',
    deadline: '',
    openings: 1,
    status: 'active',
    disallowAiCv: false,
  });

  // Load edit data when editJob changes
  useEffect(() => {
    if (editJob) {
      setFormData({
        title: editJob.title || '',
        department: editJob.department || '',
        jobType: editJob.jobType || 'Full-time',
        locationType: editJob.locationType || 'Remote',
        location: editJob.location || '',
        experienceRequired: editJob.experienceRequired || '',
        skills: editJob.requiredSkills || [],
        description: editJob.description || '',
        salaryRange: editJob.salaryRange || '',
        deadline: editJob.deadline ? new Date(editJob.deadline).toISOString().split('T')[0] : '',
        openings: editJob.openings || 1,
        status: editJob.status || 'active',
        disallowAiCv: Boolean(editJob.disallowAiCv),
      });
    } else {
      // Reset form for new job
      setFormData({
        title: '',
        department: '',
        jobType: 'Full-time',
        locationType: 'Remote',
        location: '',
        experienceRequired: '',
        skills: [],
        description: '',
        salaryRange: '',
        deadline: '',
        openings: 1,
        status: 'active',
        disallowAiCv: false,
      });
    }
  }, [editJob, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()]
      }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleGenerateDescription = async () => {
    if (!formData.description.trim()) {
      showToast('failed', 'Please enter a description first', 'danger');
      return;
    }

    try {
      setIsGenerating(true);
      
      const response = await api.post('/company/jobs/generate-description', {
        roughDescription: formData.description,
        title: formData.title,
        department: formData.department,
        locationType: formData.locationType,
        experienceRequired: formData.experienceRequired,
        skills: formData.skills,
        salaryRange: formData.salaryRange,
      });

      if (response.data.success) {
        setFormData(prev => ({
          ...prev,
          description: response.data.description
        }));
      }
    } catch (error) {
      console.error('Error generating description:', error);
      showToast('failed', 'Failed to generate description with AI', 'danger');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.department || !formData.description) {
      showToast('failed', 'Please fill in all required fields', 'danger');
      return;
    }

    try {
      setIsLoading(true);
      
      if (editJob) {
        await api.put(`/company/jobs/${editJob.id}`, formData);
      } else {
        await api.post('/company/jobs', formData);
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving job:', error);
      showToast('failed', `Failed to ${editJob ? 'update' : 'create'} job posting. Please try again. ` + error, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      department: '',
      jobType: 'Full-time',
      locationType: 'Remote',
      location: '',
      experienceRequired: '',
      skills: [],
      description: '',
      salaryRange: '',
      deadline: '',
      openings: 1,
      status: 'active',
      disallowAiCv: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl text-[#1d1d1f] dark:text-[#f5f5f7]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/[0.06] dark:border-white/[0.08] bg-[#f2f2f7]/40 dark:bg-[#2c2c2e]/40">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">
              {editJob ? 'Edit Job Posting' : 'Post New Job'}
            </h2>
            <p className="text-xs text-[#86868b] mt-0.5 font-medium">
              {editJob ? 'Update position requirements and application settings' : 'Define your vacancy parameters and candidate evaluation rules'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] transition-colors text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Job Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-2">
              Job Title <span className="text-[#ff3b30]">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Senior Frontend Engineer"
              className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] text-sm focus:outline-none focus:border-[#0071e3] transition-colors"
              required
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-2">
              Department <span className="text-[#ff3b30]">*</span>
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g., Engineering"
              className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] text-sm focus:outline-none focus:border-[#0071e3] transition-colors"
              required
            />
          </div>

          {/* Job Type and Location Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-2">
                Job Type
              </label>
              <select
                name="jobType"
                value={formData.jobType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-sm focus:outline-none focus:border-[#0071e3] transition-colors"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Spot">Spot</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-2">
                Location Type
              </label>
              <select
                name="locationType"
                value={formData.locationType}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-sm focus:outline-none focus:border-[#0071e3] transition-colors"
              >
                <option value="On-site">On-site</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Location & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-2">
                Location (City)
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., San Francisco, CA"
                className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] text-sm focus:outline-none focus:border-[#0071e3] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-2">
                Experience Required
              </label>
              <input
                type="text"
                name="experienceRequired"
                value={formData.experienceRequired}
                onChange={handleChange}
                placeholder="e.g., 2-5 years"
                className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] text-sm focus:outline-none focus:border-[#0071e3] transition-colors"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-2">
              Required Skills
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                placeholder="Type skill and press Enter"
                className="flex-1 px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] text-sm focus:outline-none focus:border-[#0071e3] transition-colors"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-4 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-[#0071e3]/10 border border-[#0071e3]/20 text-[#0071e3] rounded-full text-xs font-semibold"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-[#ff3b30] transition-colors cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Job Description with AI Rewrite */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b]">
                Job Description <span className="text-[#ff3b30]">*</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGenerating || !formData.description.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0071e3]/10 hover:bg-[#0071e3]/20 text-[#0071e3] border border-[#0071e3]/20 disabled:opacity-50 disabled:cursor-not-allowed rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                <Wand2 className="h-3.5 w-3.5" />
                {isGenerating ? 'Rewriting with AI...' : 'AI Rewrite'}
              </button>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={7}
              placeholder="Describe the role, responsibilities, and key requirements..."
              className="w-full px-4 py-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] text-sm focus:outline-none focus:border-[#0071e3] resize-none font-mono"
              required
            />
          </div>

          {/* Salary Range and Openings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-2">
                Salary Range (Optional)
              </label>
              <input
                type="text"
                name="salaryRange"
                value={formData.salaryRange}
                onChange={handleChange}
                placeholder="e.g., $80,000 - $120,000"
                className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] placeholder:text-[#86868b] text-sm focus:outline-none focus:border-[#0071e3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-2">
                Number of Openings
              </label>
              <input
                type="number"
                name="openings"
                value={formData.openings}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-sm focus:outline-none focus:border-[#0071e3]"
              />
            </div>
          </div>

          {/* Application Deadline & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-2">
                Application Deadline (Optional)
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-sm focus:outline-none focus:border-[#0071e3]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#86868b] mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-sm focus:outline-none focus:border-[#0071e3]"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          {/* Anti-AI CV / Verified Manual PDF Toggle */}
          <div className="p-4 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <h4 className="text-xs font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">
                  Require Manually Uploaded PDF (Disallow Direct AI CV)
                </h4>
              </div>
              <p className="text-[11px] text-[#86868b] mt-1 leading-relaxed">
                When enabled, applicants cannot attach 1-click platform-generated AI resumes. They must download their resume as a PDF and upload the document file to verify human review and reduce spam.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={formData.disallowAiCv}
                onChange={(e) => setFormData(prev => ({ ...prev, disallowAiCv: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0071e3]"></div>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#f2f2f7]/30 dark:bg-[#2c2c2e]/30">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-semibold text-xs shadow-[0_2px_8px_rgba(0,113,227,0.25)] transition-all cursor-pointer"
          >
            {isLoading ? (editJob ? 'Updating...' : 'Creating...') : (editJob ? 'Update Job' : 'Post Job')}
          </button>
        </div>
      </div>
    </div>
  );
}
