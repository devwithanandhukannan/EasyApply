'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/app/lib/axios';
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

  // Automatically clear status feedback alerts after 4 seconds
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
      const targetStatus = isAvailable ? 'not_available' : 'spot_available';
      
      const response = await axiosInstance.put('/jobseeker/profile', {
        availabilityStatus: targetStatus
      });
      
      if (response.data?.success) {
        const nextState = targetStatus === 'spot_available';
        setIsAvailable(nextState);
        
        // Dynamic toggle feedback messages
        if (nextState) {
          setStatusAlert({
            message: '⚡ You are now Online! Companies matching your skills can invite you to instant jobs.',
            type: 'success'
          });
        } else {
          setStatusAlert({
            message: '📴 You went Offline. You will not receive any new on-demand job matches.',
            type: 'info'
          });
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error configuring backend availability matrix context.');
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
          alert('Gig position locked successfully! Check your dashboard for company coordinator touchpoints.');
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'This spot position could no longer be locked or has expired.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto text-zinc-200">
      
      {/* Top Navigation / Dashboard Action Control Matrix Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">On-Demand Spot Jobs</h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Get discovered and claim short-term freelance work instantly.</p>
        </div>

        {/* Simplified Status Switch Control Widget */}
        <div className="flex items-center gap-4 p-3 bg-zinc-950 border border-zinc-800 rounded-xl shadow-inner min-w-[280px] justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider block text-zinc-500">Your Status</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              <p className="text-xs font-semibold text-zinc-200">
                {isAvailable ? 'Online & Available' : 'Offline'}
              </p>
            </div>
          </div>
          
          <button
            onClick={toggleSpotAvailability}
            disabled={updatingAvailability}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              isAvailable 
                ? 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400' 
                : 'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 shadow-md shadow-emerald-950/20'
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
        <div className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs transition-all animate-in fade-in duration-300 ${
          statusAlert.type === 'success' 
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400' 
            : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
        }`}>
          <Radio className={`w-4 h-4 ${statusAlert.type === 'success' ? 'text-emerald-400' : 'text-zinc-400'}`} />
          <p className="font-medium">{statusAlert.message}</p>
        </div>
      )}

      {/* Persistent Live Banner Block when Active */}
      {isAvailable && !statusAlert && (
        <div className="p-3.5 rounded-xl border border-amber-500/10 bg-amber-500/5 flex items-start gap-2.5 text-xs text-amber-400/90 max-w-4xl">
          <Bell className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
          <p>
            <strong>Live matching is active:</strong> Verified hiring managers can find your profile and drop invites right here. Keep an eye on this page!
          </p>
        </div>
      )}

      {/* Workspace Display Grid Layer */}
      <div className="space-y-4 pt-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
          Incoming Offers ({invitations.length})
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 text-zinc-700 animate-spin" />
            <p className="text-xs text-zinc-500">Checking for open offers...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl border border-rose-900/30 bg-rose-950/10 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-zinc-900 rounded-2xl bg-zinc-950/40 p-6">
            <ShieldCheck className="w-8 h-8 text-zinc-800 mb-2.5" />
            <p className="text-xs font-medium text-zinc-400">No offers at the moment</p>
            <p className="text-[11px] text-zinc-600 mt-1 max-w-md">
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
                  className="p-5 rounded-xl border border-zinc-900 bg-zinc-950 flex flex-col justify-between transition-all hover:border-zinc-800 relative group shadow-md"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-bold shrink-0">
                          {job.company.name[0]}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-zinc-100 group-hover:text-amber-400 transition-colors truncate">{job.title}</h3>
                          <p className="text-[11px] text-zinc-500 truncate flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" /> {job.company.name} {job.company.industry && `• ${job.company.industry}`}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">{job.description}</p>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] pt-1">
                      <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-zinc-300">
                        <MapPin className="w-3 h-3 text-zinc-500" /> {job.location}
                      </span>
                      <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded text-zinc-300">
                        <Clock className="w-3 h-3 text-zinc-500" /> {new Date(job.startTime).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded font-bold text-amber-400">
                        <DollarSign className="w-3 h-3" /> {job.rate} {job.currency} / {job.rateType}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {job.requiredSkills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 text-[9px] font-medium bg-zinc-900/80 border border-zinc-800/60 rounded text-zinc-400">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-zinc-900/60 flex items-center gap-2">
                    <button
                      disabled={processingId !== null}
                      onClick={() => handleResponse(invitation.id, 'ACCEPT')}
                      className="flex-1 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                    >
                      {processingId === invitation.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" /> Accept & Join
                        </>
                      )}
                    </button>
                    
                    <button
                      disabled={processingId !== null}
                      onClick={() => handleResponse(invitation.id, 'DECLINE')}
                      className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-rose-400 hover:border-rose-900/50 rounded-lg transition-all flex items-center justify-center disabled:opacity-40"
                      aria-label="Decline invitation"
                    >
                      <X className="w-3.5 h-3.5" />
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