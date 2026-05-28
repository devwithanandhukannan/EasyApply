'use client';

import { useState, useEffect } from 'react';
import { X, FileText } from 'lucide-react';
import api from '@/app/lib/axios';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateOfferModal({ isOpen, onClose, onSuccess }: Props) {
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
    employmentType: 'full-time'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchApplications();
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchApplications = async () => {
    try {
      const response = await api.get('/company/jobs');
      // Extract applications from jobs
      const apps: any[] = [];
      response.data.data.forEach((job: any) => {
        if (job.applications) {
          job.applications
            .filter((app: any) => app.status === 'technical_round' || app.status === 'hr_round')
            .forEach((app: any) => apps.push({ ...app, jobTitle: job.title }));
        }
      });
      setApplications(apps);
    } catch (error) {
      console.error('Fetch applications error:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/company/offers/templates');
      if (response.data.success) {
        setTemplates(response.data.data);
      }
    } catch (error) {
      console.error('Fetch templates error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.post('/company/offers', formData);
      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Create offer error:', error);
      alert(error.response?.data?.message || 'Failed to create offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplicationChange = (appId: string) => {
    const app = applications.find(a => a.id === appId);
    if (app) {
      setFormData(prev => ({
        ...prev,
        applicationId: appId,
        position: app.jobTitle,
        department: app.jobPosting?.department || ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-400" />
            </div>
            <h2 className="text-sm font-semibold text-white uppercase">Generate Offer Letter</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Application Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Select Candidate</label>
            <select
              required
              value={formData.applicationId}
              onChange={(e) => handleApplicationChange(e.target.value)}
              className="w-full bg-black border border-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-zinc-700 outline-none"
            >
              <option value="">Choose application...</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>
                  {app.jobSeekerProfile?.fullName} - {app.jobTitle}
                </option>
              ))}
            </select>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Letter Template</label>
            <select
              value={formData.templateId}
              onChange={(e) => setFormData(prev => ({ ...prev, templateId: e.target.value }))}
              className="w-full bg-black border border-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-zinc-700 outline-none"
            >
              <option value="">Use default template</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Position & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Position</label>
              <input
                required
                type="text"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="w-full bg-black border border-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-zinc-700 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full bg-black border border-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-zinc-700 outline-none"
              />
            </div>
          </div>

          {/* Salary & Currency */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Annual Salary</label>
              <input
                required
                type="number"
                value={formData.salary}
                onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                className="w-full bg-black border border-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-zinc-700 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full bg-black border border-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-zinc-700 outline-none"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
                <option value="INR">INR</option>
              </select>
            </div>
          </div>

          {/* Start Date & Employment Type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Start Date</label>
              <input
                required
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full bg-black border border-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-zinc-700 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase">Employment Type</label>
              <select
                value={formData.employmentType}
                onChange={(e) => setFormData(prev => ({ ...prev, employmentType: e.target.value }))}
                className="w-full bg-black border border-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:border-zinc-700 outline-none"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., San Francisco, CA or Remote"
              className="w-full bg-black border border-zinc-900 rounded-lg px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:border-zinc-700 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-zinc-900">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Generating...' : 'Generate Offer'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}