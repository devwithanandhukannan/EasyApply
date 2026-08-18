'use client';

import { useState, useEffect } from 'react';
import { X, Edit, Loader2 } from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from './GlassToastContainer';

interface EditOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  onSuccess: () => void;
}

export default function EditOfferModal({ isOpen, onClose, offerId, onSuccess }: EditOfferModalProps) {
  const [formData, setFormData] = useState({
    position: '',
    department: '',
    salary: '',
    currency: 'USD',
    startDate: '',
    location: '',
    employmentType: 'Full-time'
  });
  const { showToast } = useGlassToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOffer, setIsLoadingOffer] = useState(true);

  useEffect(() => {
    if (isOpen && offerId) {
      fetchOfferDetails();
    }
  }, [isOpen, offerId]);

  const fetchOfferDetails = async () => {
    try {
      const response = await api.get(`/company/offers/${offerId}`);
      if (response.data.success) {
        const offer = response.data.data;
        setFormData({
          position: offer.position || '',
          department: offer.department || '',
          salary: offer.salary ? offer.salary.toString() : '',
          currency: offer.currency || 'USD',
          startDate: offer.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : '',
          location: offer.location || '',
          employmentType: offer.employmentType || 'Full-time'
        });
      }
    } catch (error) {
      console.error('Failed to fetch offer:', error);
    } finally {
      setIsLoadingOffer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.put(`/company/offers/${offerId}`, formData);
      
      if (response.data.success) {
        showToast('Success', 'Offer details updated successfully', 'success');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Update offer error:', error);
      showToast('Update Failed', error.response?.data?.message || 'Failed to update offer', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1d1d1f] dark:text-white tracking-tight">Edit Offer Letter</h2>
              <p className="text-xs text-[#86868b] font-medium">Update offer compensation &amp; terms before signing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.06] text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {isLoadingOffer ? (
            <div className="text-center py-12">
              <Loader2 className="w-7 h-7 animate-spin text-[#0071e3] mx-auto mb-2" />
              <p className="text-xs text-[#86868b] font-medium">Loading offer details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Position Title</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Employment Type</label>
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
                <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Salary Compensation</label>
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
                    value={formData.salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Work Location</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] transition-colors"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-2xl text-xs font-semibold hover:bg-[#e5e5ea] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer hover:opacity-95 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}