// app/components/JobPostingModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Wand2 } from 'lucide-react';
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
      showToast('failed', 'Failed to rewrite description using AI. Please try again.', 'danger');
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
      showToast('failed', `Failed to ${editJob ? 'update' : 'create'} job posting. Please try again.`+ error, 'danger');
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
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-900">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {editJob ? 'Edit Job Posting' : 'Post New Job'}
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              {editJob ? 'Update job details' : 'Fill in the details to create a job posting'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Senior Flutter Developer"
                className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g., Engineering"
                className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                required
              />
            </div>

            {/* Job Type and Location Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Job Type
                </label>
                <select
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Spot">Spot</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Location Type
                </label>
                <select
                  name="locationType"
                  value={formData.locationType}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                >
                  <option value="On-site">On-site</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Location (City)
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., San Francisco, CA"
                className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>

            {/* Experience Required */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Experience Required
              </label>
              <input
                type="text"
                name="experienceRequired"
                value={formData.experienceRequired}
                onChange={handleChange}
                placeholder="e.g., 2-5 years"
                className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Skills Required
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  placeholder="Type a skill and press Enter"
                  className="flex-1 px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-white transition-colors"
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
              
              {formData.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Job Description - ENHANCED */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-white">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGenerating || !formData.description.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-xs font-medium transition-all"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    {isGenerating ? 'Rewriting with AI...' : 'AI Rewrite'}
                  </button>
                </div>
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={8}
                placeholder="Describe the role, responsibilities, and requirements..."
                className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent resize-none font-mono text-sm"
                required
              />
              <p className="mt-2 text-xs text-zinc-500">
                <span className="font-semibold">AI Rewrite:</span> Structurally optimizes structure, highlights matching skills, and formats using professional Markdown conventions.
              </p>
            </div>

            {/* Salary Range and Openings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Salary Range (Optional)
                </label>
                <input
                  type="text"
                  name="salaryRange"
                  value={formData.salaryRange}
                  onChange={handleChange}
                  placeholder="e.g., $80k - $120k"
                  className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Number of Openings
                </label>
                <input
                  type="number"
                  name="openings"
                  value={formData.openings}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                />
              </div>
            </div>

            {/* Application Deadline */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Application Deadline (Optional)
              </label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-900">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2.5 bg-white hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-black font-medium transition-colors"
          >
            {isLoading ? (editJob ? 'Updating...' : 'Creating...') : (editJob ? 'Update Job' : 'Post Job')}
          </button>
        </div>
      </div>
    </div>
  );
}
