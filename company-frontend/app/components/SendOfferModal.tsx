'use client';

import { useState } from 'react';
import { X, Send, Mail, MessageSquare, Bell, CheckCircle, Loader2 } from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from './GlassToastContainer';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  offerId: string;
  onSuccess: () => void;
}

export default function SendOfferModal({ isOpen, onClose, offerId, onSuccess }: Props) {
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['email', 'inapp']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useGlassToast();

  const channels = [
    { 
      id: 'email', 
      label: 'Email Dispatch', 
      icon: Mail, 
      description: 'Official digital delivery with real-time open and view tracking',
      color: 'text-[#0071e3]'
    },
    { 
      id: 'whatsapp', 
      label: 'WhatsApp Alert', 
      icon: MessageSquare, 
      description: 'Instant notification link sent to candidate phone number',
      color: 'text-emerald-500'
    },
    { 
      id: 'inapp', 
      label: 'In-App Portal Notification', 
      icon: Bell, 
      description: 'Interactive offer notification card in candidate dashboard',
      color: 'text-purple-500'
    }
  ];

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev => 
      prev.includes(channelId) 
        ? prev.filter(c => c !== channelId)
        : [...prev, channelId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedChannels.length === 0) {
      showToast('Validation Error', 'Please select at least one delivery channel', 'danger');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post(`/company/offers/${offerId}/send`, {
        channels: selectedChannels
      });

      if (response.data.success) {
        showToast('Success', 'Offer letter sent successfully to candidate', 'success');
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Send offer error:', error);
      showToast('Dispatch Failed', error.response?.data?.message || 'Failed to send offer', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl max-w-md w-full shadow-2xl text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1d1d1f] dark:text-white tracking-tight">Send Offer Letter</h2>
              <p className="text-xs text-[#86868b] font-medium">Select candidate delivery channels</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">
              Dispatch Delivery Channels
            </label>
            
            <div className="space-y-2">
              {channels.map((channel) => {
                const isSelected = selectedChannels.includes(channel.id);
                const Icon = channel.icon;

                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => toggleChannel(channel.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'border-[#0071e3] bg-[#0071e3]/10 dark:bg-[#0071e3]/20 shadow-xs'
                        : 'border-black/[0.06] dark:border-white/[0.08] bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea]'
                    }`}
                  >
                    <div className={`p-2 rounded-xl bg-white dark:bg-[#1c1c1e] shadow-2xs ${channel.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#1d1d1f] dark:text-white">
                          {channel.label}
                        </span>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-[#0071e3]" />
                        )}
                      </div>
                      <p className="text-[11px] text-[#86868b] font-medium mt-0.5">
                        {channel.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-2xl text-xs font-semibold hover:bg-[#e5e5ea] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedChannels.length === 0}
              className="px-5 py-2 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/25 cursor-pointer hover:opacity-95 flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Offer Now</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}