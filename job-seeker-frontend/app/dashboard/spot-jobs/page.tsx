'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { 
  Zap, 
  MapPin, 
  Clock, 
  Building2, 
  Check, 
  X, 
  Loader2, 
  DollarSign, 
  Bell, 
  ShieldCheck,
  AlertCircle,
  Radio
} from 'lucide-react';

interface CompanyData {
  id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
}

interface SpotJob {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  rate: number;
  rateType: string;
  currency: string;
  startTime: string;
  endTime: string;
  location: string;
  company: CompanyData;
}

interface Invitation {
  id: string;
  status: 'PENDING_RESPONSE' | 'ACCEPTED' | 'DECLINED' | 'TIMED_OUT';
  createdAt: string;
  spotJob: SpotJob;
}

export default function JobSeekerSpotWorkspace() {
  const { showToast } = useGlassToast();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [statusAlert, setStatusAlert] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  useEffect(() => {
    fetchIncomingInvitations();
    syncAvailabilityStatus();
  }, []);

  useEffect(() => {
    if (statusAlert) {
      const timer = setTimeout(() => setStatusAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [statusAlert]);

  const fetchIncomingInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/jobseeker/spot-jobs/invitations');
      if (response.data?.success) {
        setInvitations(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to sync incoming request signals.');
    } finally {
      setLoading(false);
    }
  };

  const syncAvailabilityStatus = async () => {
    try {
      const response = await axiosInstance.get('/jobseeker/profile');
      if (response.data?.success && response.data?.data) {
        setIsAvailable(response.data.data.availabilityStatus === 'spot_available');
      }
    } catch (err) {
      console.error('Error parsing core availability metadata profile index:', err);
    }
  };

  const toggleSpotAvailability = async () => {
    try {
      setUpdatingAvailability(true);
      const targetState = !isAvailable;
      const targetStatus = targetState ? 'spot_available' : 'available';

      const response = await axiosInstance.put('/jobseeker/profile', {
        availabilityStatus: targetStatus
      });

      if (response.data?.success) {
        setIsAvailable(targetState);
        setStatusAlert({
          message: targetState 
            ? 'You are now marked Online for on-demand spot opportunities.' 
            : 'You are now marked Offline. You will not receive instantaneous booking requests.',
          type: targetState ? 'success' : 'info'
        });
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to update discovery status.', 'danger');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleResponse = async (bookingId: string, action: 'ACCEPT' | 'DECLINE') => {
    try {
      setProcessingId(bookingId);
      const response = await axiosInstance.patch(`/jobseeker/spot-jobs/respond/${bookingId}`, { action });
      
      if (response.data?.success) {
        setInvitations(prev => prev.filter(inv => inv.id !== bookingId));
        if (action === 'ACCEPT') {
          showToast('Success', 'Gig position locked successfully! Check your dashboard for company coordinator touchpoints.', 'success');
        }
      }
    } catch (err: any) {
      showToast('Lock Error', err.response?.data?.message || 'This spot position could no longer be locked or has expired.', 'danger');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased p-1">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#ff9500] fill-[#ff9500]" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">On-Demand Spot Jobs</h1>
          </div>
          <p className="text-xs sm:text-sm text-[#86868b] mt-0.5 font-medium">Get discovered and claim short-term freelance work instantly.</p>
        </div>

        {/* Status Switch Control Widget */}
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl shadow-[0_2px_12px_rgba(0,0,0,0.03)] min-w-[280px] justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-[#86868b]">Your Status</span>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-[#34c759] animate-pulse' : 'bg-[#86868b]'}`} />
              <p className="text-xs font-bold text-[#1d1d1f] dark:text-white">
                {isAvailable ? 'Online & Available' : 'Offline'}
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleSpotAvailability}
            disabled={updatingAvailability}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs ${
              isAvailable 
                ? 'bg-[#ff3b30]/10 hover:bg-[#ff3b30]/20 border border-[#ff3b30]/20 text-[#ff3b30]' 
                : 'bg-[#34c759] text-white hover:bg-[#2db84d] shadow-[0_4px_14px_rgba(52,199,89,0.25)]'
            }`}
          >
            {updatingAvailability ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isAvailable ? (
              <>Go Offline</>
            ) : (
              <>Go Online</>
            )}
          </button>
        </div>
      </div>

      {/* Dynamic Status Action Alert Boxes */}
      {statusAlert && (
        <div className={`p-4 rounded-2xl border flex items-center gap-3 text-xs transition-all animate-in fade-in duration-300 ${
          statusAlert.type === 'success' 
            ? 'border-[#34c759]/30 bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158]' 
            : 'border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] text-[#86868b]'
        }`}>
          <Radio className={`w-4 h-4 ${statusAlert.type === 'success' ? 'text-[#34c759]' : 'text-[#86868b]'}`} />
          <p className="font-semibold">{statusAlert.message}</p>
        </div>
      )}

      {/* Persistent Live Banner Block when Active */}
      {isAvailable && !statusAlert && (
        <div className="p-4 rounded-3xl border border-[#ff9500]/20 bg-[#ff9500]/10 flex items-start gap-3 text-xs text-[#b25e00] dark:text-[#ff9f0a] max-w-4xl shadow-xs">
          <Bell className="w-4 h-4 shrink-0 text-[#ff9500] mt-0.5" />
          <p className="font-medium leading-relaxed">
            <strong className="font-bold">Live matching is active:</strong> Verified hiring managers can find your profile and drop invites right here. Keep an eye on this page!
          </p>
        </div>
      )}

      {/* Workspace Display Grid */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#86868b] flex items-center gap-2">
          Incoming Offers ({invitations.length})
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-6 h-6 text-[#0071e3] animate-spin" />
            <p className="text-xs text-[#86868b] font-medium">Checking for open offers...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl border border-[#ff3b30]/20 bg-[#ff3b30]/10 text-[#ff3b30] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-black/[0.1] dark:border-white/[0.1] rounded-3xl bg-white dark:bg-[#1c1c1e] p-8 shadow-xs">
            <ShieldCheck className="w-10 h-10 text-[#86868b] mb-3" />
            <p className="text-sm font-bold text-[#1d1d1f] dark:text-white">No offers at the moment</p>
            <p className="text-xs text-[#86868b] mt-1 max-w-md font-medium">
              {isAvailable 
                ? "Your pipeline is empty right now. As soon as a business posts a job looking for your skills, it will show up here instantly." 
                : "You are currently offline. Turn your status back to 'Online' above so matching engines can start routing jobs your way."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {invitations.map((invitation) => {
              const job = invitation.spotJob;
              return (
                <div 
                  key={invitation.id} 
                  className="p-6 rounded-3xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] flex flex-col justify-between transition-all hover:border-[#0071e3]/40 relative group shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-center text-[#0071e3] text-sm font-bold shrink-0">
                          {job.company.name[0]}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-[#1d1d1f] dark:text-white group-hover:text-[#0071e3] transition-colors truncate">{job.title}</h3>
                          <p className="text-xs text-[#86868b] truncate flex items-center gap-1 mt-0.5 font-medium">
                            <Building2 className="w-3.5 h-3.5" /> {job.company.name} {job.company.industry && `• ${job.company.industry}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[#86868b] line-clamp-3 leading-relaxed font-medium">{job.description}</p>

                    <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                      <span className="flex items-center gap-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] px-2.5 py-1 rounded-xl text-[#1d1d1f] dark:text-white text-[11px] font-medium">
                        <MapPin className="w-3 h-3 text-[#86868b]" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] px-2.5 py-1 rounded-xl text-[#1d1d1f] dark:text-white text-[11px] font-medium">
                        <Clock className="w-3 h-3 text-[#86868b]" /> {new Date(job.startTime).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-0.5 bg-[#34c759]/10 border border-[#34c759]/20 px-2.5 py-1 rounded-xl font-bold text-[#248a3d] dark:text-[#30d158] text-[11px]">
                        <DollarSign className="w-3 h-3" /> {job.rate} {job.currency} / {job.rateType}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {job.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="px-2.5 py-0.5 text-[10px] font-medium bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-lg text-[#86868b]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2.5">
                    <button
                      disabled={processingId !== null}
                      onClick={() => handleResponse(invitation.id, 'ACCEPT')}
                      className="flex-1 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 shadow-[0_4px_14px_rgba(0,113,227,0.25)] cursor-pointer"
                    >
                      {processingId === invitation.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Accept &amp; Join
                        </>
                      )}
                    </button>
                    
                    <button
                      disabled={processingId !== null}
                      onClick={() => handleResponse(invitation.id, 'DECLINE')}
                      className="px-3.5 py-2.5 bg-[#f2f2f7] hover:bg-[#ff3b30]/10 dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] text-[#86868b] hover:text-[#ff3b30] hover:border-[#ff3b30]/30 rounded-2xl transition-all flex items-center justify-center disabled:opacity-40 cursor-pointer"
                      aria-label="Decline invitation"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}