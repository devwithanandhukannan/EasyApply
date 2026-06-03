'use client';

import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
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
    employmentType: 'full-time'
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
          position: offer.position,
          department: offer.department || '',
          salary: offer.salary.toString(),
          currency: offer.currency,
          startDate: new Date(offer.startDate).toISOString().split('T')[0],
          location: offer.location || '',
          employmentType: offer.employmentType
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
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Update offer error:', error);
      showToast('failed', error.response?.data?.message || 'Failed to update offer', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-900 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white uppercase font-mono">Edit Offer Letter</h2>
            <p className="text-xs text-zinc-500 mt-1">Update offer details before signing</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-900 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoadingOffer ? (
            <div className="text-center py-12">
              <p className="text-sm text-zinc-500 animate-pulse">Loading offer details...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">
                    Position Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-zinc-600 outline-none"
                    placeholder="e.g. Senior Software Engineer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-zinc-600 outline-none"
                    placeholder="e.g. Engineering"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">
                    Employment Type *
                  </label>
                  <select
                    required
                    value={formData.employmentType}
                    onChange={(e) => setFormData(prev => ({ ...prev, employmentType: e.target.value }))}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-zinc-600 outline-none"
                  >
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">
                    Annual Salary *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-zinc-600 outline-none"
                    placeholder="120000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">
                    Currency *
                  </label>
                  <select
                    required
                    value={formData.currency}
                    onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-zinc-600 outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-zinc-600 outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-400 uppercase mb-2">
                    Work Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:border-zinc-600 outline-none"
                    placeholder="e.g. San Francisco, CA / Remote"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2.5 bg-white hover:bg-zinc-200 disabled:bg-zinc-800 text-black disabled:text-zinc-600 font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}