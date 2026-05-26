'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video } from 'lucide-react';
import api from '@/app/lib/axios';

interface ScheduleInterviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  selectedApplicationIds: string[];
  onSuccess: () => void;
}

export default function ScheduleInterviewsModal({
  isOpen,
  onClose,
  jobId,
  selectedApplicationIds,
  onSuccess
}: ScheduleInterviewsModalProps) {
  // Get today's local date string formatted as YYYY-MM-DD for the HTML 'min' attribute constraint
  const [minDateString, setMinDateString] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('10:00'); // Standard morning fallback default
  const [slotDuration, setSlotDuration] = useState('30');
  const [interviewFormat, setInterviewFormat] = useState('video');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Set the dynamic date boundary limits on initialization
  useEffect(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    const formattedDate = `${yyyy}-${mm}-${dd}`;
    setMinDateString(formattedDate);
    setCustomDate(formattedDate); // Autofill with today's date
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      // Direct combination of explicitly defined custom inputs into a unified ISO string
      const combinedDateTime = new Date(`${customDate}T${customTime}:00`);

      // Validation check to verify that the combined date time hasn't already passed
      if (combinedDateTime.getTime() < Date.now()) {
        setError('Selected execution window cannot target a timeline point in the past.');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        jobPostingId: jobId,
        startTime: combinedDateTime.toISOString(),
        slotDuration: parseInt(slotDuration, 10),
        interviewFormat: interviewFormat.toUpperCase(),
        interviewerIds: [], 
        selectedApplicationIds
      };

      const response = await api.post('/company/interviews/bulk-schedule', payload);
      if (response.data.success) {
        onSuccess();
      } else {
        setError(response.data.message || 'Failed to initialize booking session sequence.');
      }
    } catch (err: any) {
      console.error("Error dispatching bulk scheduling payload:", err);
      setError(err.response?.data?.message || 'Failed to complete pipeline block execution routine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-950 border border-zinc-900 w-full max-w-md rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
          <div>
            <h3 className="text-base font-semibold text-white">Batch Interview Config</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Configuring options for {selectedApplicationIds.length} candidate profiles</p>
          </div>
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Configuration Setup Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-xs text-red-400">
              {error}
            </div>
          )}

          {/* Custom Date & Custom Time Fields */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-400">Initial Batch Launch Window</label>
            <div className="grid grid-cols-2 gap-2">
              
              {/* Custom Date Field */}
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  type="date"
                  required
                  min={minDateString}
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 [color-scheme:dark] cursor-pointer"
                />
              </div>

              {/* Custom Time Field */}
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  type="time"
                  required
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 [color-scheme:dark] cursor-pointer"
                />
              </div>

            </div>
          </div>

          {/* Duration and Format Options */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Slot Duration</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <select 
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
                >
                  <option value="15">15 Min</option>
                  <option value="30">30 Min</option>
                  <option value="45">45 Min</option>
                  <option value="60">60 Min</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Channel Format</label>
              <div className="relative">
                <Video className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500 pointer-events-none" />
                <select 
                  value={interviewFormat}
                  onChange={(e) => setInterviewFormat(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 appearance-none cursor-pointer"
                >
                  <option value="video">WebRTC Video</option>
                  <option value="coding_test">Coding Stack</option>
                  <option value="mixed">Mixed Lab</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-zinc-900 flex justify-end gap-2">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium rounded-lg text-zinc-400 hover:text-white transition-colors"
            >
              Back
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 text-xs font-semibold rounded-lg transition-colors"
            >
              {isSubmitting ? 'Generating Slots...' : 'Confirm Pipeline Allocation'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}