'use client';

import { useState } from 'react';
import { X, Send, Mail, MessageSquare, Bell, CheckCircle } from 'lucide-react';
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
      label: 'Email', 
      icon: Mail, 
      description: 'Send via SMTP with tracking pixel',
      color: 'text-blue-400'
    },
    { 
      id: 'whatsapp', 
      label: 'WhatsApp', 
      icon: MessageSquare, 
      description: 'Send direct message (if number available)',
      color: 'text-emerald-400'
    },
    { 
      id: 'inapp', 
      label: 'In-App Notification', 
      icon: Bell, 
      description: 'Push notification to candidate dashboard',
      color: 'text-purple-400'
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
      showToast('failed', 'Please select at least one delivery channel', 'danger');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post(`/company/offers/${offerId}/send`, {
        channels: selectedChannels
      });

      if (response.data.success) {
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      console.error('Send offer error:', error);
      showToast('failed', error.response?.data?.message || 'Failed to send offer', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl max-w-lg w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold text-white uppercase">Send Offer to Candidate</h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-400 uppercase">
              Select Delivery Channels
            </label>

            <div className="space-y-2">
              {channels.map(channel => {
                const Icon = channel.icon;
                const isSelected = selectedChannels.includes(channel.id);

                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => toggleChannel(channel.id)}
                    className={`w-full p-4 border rounded-lg transition-all text-left ${
                      isSelected 
                        ? 'border-zinc-700 bg-zinc-900' 
                        : 'border-zinc-900 bg-zinc-950 hover:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-zinc-800' : 'bg-zinc-900'
                      }`}>
                        <Icon className={`w-5 h-5 ${isSelected ? channel.color : 'text-zinc-600'}`} />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold ${
                            isSelected ? 'text-white' : 'text-zinc-400'
                          }`}>
                            {channel.label}
                          </span>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                          )}
                        </div>
                        <p className="text-xs text-zinc-600">{channel.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-blue-950/20 border border-blue-900/50 rounded-lg p-3 space-y-2">
            <div className="flex items-start gap-2">
              <Mail className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-400">
                <p className="font-semibold mb-1">Email Tracking Enabled</p>
                <p className="text-blue-500/80">
                  You'll be notified when the candidate opens the email and views the offer letter.
                </p>
              </div>
            </div>
          </div>

          {/* Legal Notice */}
          <div className="bg-zinc-900/50 border border-zinc-900 rounded-lg p-3">
            <p className="text-xs text-zinc-500 leading-relaxed">
              The candidate will receive a PDF copy and a web link to review and respond to the offer. 
              They can accept, decline, or request negotiation directly from their dashboard.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedChannels.length === 0}
              className="flex-1 px-4 py-2 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                'Sending...'
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Offer Letter
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}