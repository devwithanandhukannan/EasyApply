'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { 
  Zap, 
  Plus, 
  MapPin, 
  Clock, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  User, 
  Phone, 
  Mail, 
  DollarSign 
} from 'lucide-react';

interface CandidateProfile {
  fullName: string;
  email: string;
  phone: string;
  profilePhotoUrl?: string;
}

interface Booking {
  id: string;
  status: 'PENDING_RESPONSE' | 'ACCEPTED' | 'DECLINED' | 'TIMED_OUT';
  respondedAt: string | null;
  createdAt: string;
  jobSeekerProfile: CandidateProfile;
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
  status: 'POSTED' | 'SEARCHING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
  bookings: Booking[];
}

export default function SpotJobsDashboard() {
  const { showToast } = useGlassToast();
  const [spotJobs, setSpotJobs] = useState<SpotJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal Creation Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    rate: '',
    rateType: 'HOURLY',
    currency: 'INR',
    startTime: '',
    endTime: '',
    location: ''
  });

  // Tracking details drawer state
  const [selectedJob, setSelectedJob] = useState<SpotJob | null>(null);

  useEffect(() => {
    fetchSpotDashboard();
  }, []);

  const fetchSpotDashboard = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/company/spot-jobs/company-dashboard');
      if (response.data?.success) {
        setSpotJobs(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tracking workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSpotJob = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        rate: parseFloat(formData.rate),
        requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
      };

      const response = await axiosInstance.post('/company/spot-jobs', payload);
      if (response.data?.success) {
        setIsModalOpen(false);
        setFormData({
          title: '',
          description: '',
          requiredSkills: '',
          rate: '',
          rateType: 'HOURLY',
          currency: 'INR',
          startTime: '',
          endTime: '',
          location: ''
        });
        fetchSpotDashboard();
      }
    } catch (err: any) {
      showToast('Submission Error', err.response?.data?.message || 'Submission error caught on matching service.', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (jobId: string, status: string) => {
    try {
      const response = await axiosInstance.patch(`/company/spot-jobs/${jobId}/status`, { status });
      if (response.data?.success) {
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob({ ...selectedJob, status: status as any });
        }
        fetchSpotDashboard();
      }
    } catch (err: any) {
      showToast('Status Update Error', err.response?.data?.message || 'Failed to mutate state indices.', 'danger');
    }
  };

  const getStatusBadge = (status: SpotJob['status']) => {
    const styles = {
      POSTED: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      SEARCHING: 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse',
      CONFIRMED: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      COMPLETED: 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400',
      CANCELLED: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
    };
    return <span className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md border ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-zinc-200">
      {/* Upper Information Deck */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Spot Gigs System Workspace</h1>
          </div>
          <p className="text-xs text-zinc-500 mt-1">Deploy automated pipelines to broadcast requirements and match on-demand talent instantly.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-zinc-200 text-zinc-950 text-xs font-semibold rounded-xl transition-all shadow-md shadow-white/5"
        >
          <Plus className="w-4 h-4" /> Broadcast Spot Gig
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
          <p className="text-xs text-zinc-500">Querying live metrics matrices...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-rose-900/30 bg-rose-950/10 text-rose-400 text-xs">{error}</div>
      ) : spotJobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-zinc-900 rounded-2xl bg-zinc-900/10 p-6">
          <Zap className="w-10 h-10 text-zinc-700 mb-3" />
          <p className="text-xs font-medium text-zinc-400">No Spot Jobs broadcast history discovered</p>
          <p className="text-[11px] text-zinc-600 mt-1 max-w-sm">Tap on the broadcast command link at the top right to start immediate pipeline candidate matching algorithms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main List Stream */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Active Broad-scale Trackings</h2>
            {spotJobs.map((job) => (
              <div 
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`p-4 rounded-xl border transition-all cursor-pointer bg-zinc-950 ${
                  selectedJob?.id === job.id ? 'border-zinc-500 shadow-md shadow-black' : 'border-zinc-900 hover:border-zinc-800'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-sm text-zinc-100">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-zinc-500 mt-2">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(job.startTime).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1 font-medium text-zinc-300">
                        <DollarSign className="w-3.5 h-3.5 text-zinc-500" /> {job.rate} {job.currency} / {job.rateType}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.requiredSkills.map((skill, idx) => (
                    <span key={idx} className="px-2 py-0.5 text-[10px] font-medium bg-zinc-900 border border-zinc-800 rounded text-zinc-400">{skill}</span>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-zinc-900 flex justify-between items-center text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-zinc-600" />
                    {job.bookings.length} targeted alert response instances
                  </span>
                  {job.bookings.some(b => b.status === 'ACCEPTED') && (
                    <span className="text-emerald-400 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Position Locked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Operational Metrics Sub-drawer */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Live Matching Inspection</h2>
            {selectedJob ? (
              <div className="p-4 rounded-xl border border-zinc-900 bg-zinc-950 space-y-4 sticky top-6">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-zinc-100">{selectedJob.title}</h3>
                    <button onClick={() => setSelectedJob(null)} className="text-zinc-600 hover:text-zinc-400 text-xs">Close</button>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1 line-clamp-3">{selectedJob.description}</p>
                </div>

                {/* Operations Control Matrix Panel */}
                <div className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Workspace Actions</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedJob.status !== 'COMPLETED' && selectedJob.status !== 'CANCELLED' && (
                      <>
                        <button 
                          onClick={() => updateStatus(selectedJob.id, 'COMPLETED')}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          Mark Finished
                        </button>
                        <button 
                          onClick={() => updateStatus(selectedJob.id, 'CANCELLED')}
                          className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 rounded-lg text-[11px] font-medium transition-colors"
                        >
                          Revoke Gig
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Candidate Responses */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 block">Target Routing Queues</span>
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
                    {selectedJob.bookings.length === 0 ? (
                      <p className="text-[11px] text-zinc-600 italic">No matching candidate engines found in immediate range alerts.</p>
                    ) : (
                      selectedJob.bookings.map((booking) => (
                        <div key={booking.id} className="p-3 rounded-xl border border-zinc-900 bg-zinc-900/20 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 border border-zinc-700 text-[10px] uppercase font-bold">
                                {booking.jobSeekerProfile.fullName[0]}
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-zinc-200">{booking.jobSeekerProfile.fullName}</h4>
                              </div>
                            </div>
                            
                            {/* Response status indicators */}
                            {booking.status === 'ACCEPTED' && <span className="text-emerald-400 text-[10px] font-bold uppercase bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Matched</span>}
                            {booking.status === 'PENDING_RESPONSE' && <span className="text-amber-400 text-[10px] font-bold uppercase bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded animate-pulse">Alerted</span>}
                            {booking.status === 'DECLINED' && <span className="text-zinc-500 text-[10px] font-bold uppercase bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">Declined</span>}
                            {booking.status === 'TIMED_OUT' && <span className="text-zinc-600 text-[10px] font-bold uppercase bg-zinc-900/50 border border-transparent px-1.5 py-0.5 rounded">Timed Out</span>}
                          </div>

                          {booking.status === 'ACCEPTED' && (
                            <div className="pt-2 border-t border-zinc-900 space-y-1 text-[11px] text-zinc-400">
                              <p className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-zinc-600" /> {booking.jobSeekerProfile.phone}</p>
                              <p className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-zinc-600" /> {booking.jobSeekerProfile.email}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 border border-zinc-900 bg-zinc-950/40 rounded-xl text-center text-xs text-zinc-600 italic">
                Select any targeted broadcast vector node from the stream list to inspect linked telemetry profiles.
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPONENT MODAL - CREATE SPOT GIG OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h3 className="font-bold text-sm text-zinc-100">Broadcast Instant Matching Target</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-xs font-medium">Cancel</button>
            </div>

            <form onSubmit={handleCreateSpotJob} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-400">Functional Job Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="e.g. On-Demand Network Penetration Consultant" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-700 text-zinc-200" />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-400">Contextual Requirements Description</label>
                <textarea required name="description" value={formData.description} onChange={handleInputChange} rows={3} placeholder="Provide specific operational criteria for instant dispatch matching..." className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-700 text-zinc-200 resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-400">Required Skill Array tokens (Comma Separated)</label>
                <input required type="text" name="requiredSkills" value={formData.requiredSkills} onChange={handleInputChange} placeholder="Burp Suite, Nmap, VAPT, React" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-700 text-zinc-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400">Compensation Matrix Rate</label>
                  <input required type="number" name="rate" value={formData.rate} onChange={handleInputChange} placeholder="4500" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-700 text-zinc-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400">Metrics Interval Type</label>
                  <select name="rateType" value={formData.rateType} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-700 text-zinc-200">
                    <option value="HOURLY">Hourly Payment</option>
                    <option value="FIXED">Fixed Budget Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400">Operations Start Metric</label>
                  <input required type="datetime-local" name="startTime" value={formData.startTime} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-700 text-zinc-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="font-semibold text-zinc-400">Operations End Boundary</label>
                  <input required type="datetime-local" name="endTime" value={formData.endTime} onChange={handleInputChange} className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-700 text-zinc-200" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-zinc-400">Operational Target Location Context</label>
                <input required type="text" name="location" value={formData.location} onChange={handleInputChange} placeholder="Kochi, Kerala (or Remote)" className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl focus:outline-none focus:border-zinc-700 text-zinc-200" />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2.5 bg-white text-zinc-950 font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Executing Matching Automations...
                  </>
                ) : (
                  'Initialize Targeted Broadcast Engine'
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}