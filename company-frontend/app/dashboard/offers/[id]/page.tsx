'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { 
  ArrowLeft, 
  FileText, 
  Send, 
  Clock, 
  Eye, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Mail,
  FileSignature,
  Edit,
  Phone,
  Download,
  Loader2,
  Calendar,
  Building2,
  User,
  DollarSign,
  MapPin,
  Briefcase,
} from 'lucide-react';
import api from '@/app/lib/axios';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';

interface OfferDetails {
  id: string;
  position: string;
  department: string;
  salary: string;
  currency: string;
  startDate: string;
  location: string;
  employmentType: string;
  status: string;
  content: any;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  candidateResponse: string | null;
  negotiationNote: string | null;
  emailOpenCount: number;
  companySignature: any;
  candidateSignature: any;
  application: {
    jobSeekerProfile: {
      fullName: string;
      email: string;
      phone: string;
      profilePhotoUrl: string | null;
    };
    jobPosting: {
      title: string;
      company: {
        name: string;
        logoUrl: string | null;
      };
    };
  };
}

export default function OfferDetailsPage() {
  const { isAdmin, isHR } = useAuth();
  const { showToast } = useGlassToast();
  const params = useParams();
  const router = useRouter();
  const [offer, setOffer] = useState<OfferDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Negotiation response states
  const [showNegotiationResponse, setShowNegotiationResponse] = useState(false);
  const [negotiationAction, setNegotiationAction] = useState<'accept_negotiation' | 'reject_negotiation'>('accept_negotiation');
  const [updatedSalary, setUpdatedSalary] = useState('');
  const [updatedStartDate, setUpdatedStartDate] = useState('');
  const [responseNote, setResponseNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOfferDetails();
  }, [params.id]);

  const fetchOfferDetails = async () => {
    try {
      const response = await api.get(`/company/offers/${params.id}`);
      if (response.data.success) {
        setOffer(response.data.data);
        setUpdatedSalary(response.data.data.salary);
        setUpdatedStartDate(response.data.data.startDate.split('T')[0]);
      }
    } catch (error) {
      console.error('Fetch offer details error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNegotiationResponse = async () => {
    if (!offer) return;

    setIsSubmitting(true);
    try {
      const response = await api.post(`/company/offers/${offer.id}/respond-negotiation`, {
        action: negotiationAction,
        updatedSalary: negotiationAction === 'accept_negotiation' ? updatedSalary : undefined,
        updatedStartDate: negotiationAction === 'accept_negotiation' ? updatedStartDate : undefined,
        responseNote
      });

      if (response.data.success) {
        showToast('Success', 'Negotiation response sent successfully', 'success');
        fetchOfferDetails();
        setShowNegotiationResponse(false);
      }
    } catch (error: any) {
      console.error('Negotiation response error:', error);
      showToast('Action Failed', error.response?.data?.message || 'Failed to submit response', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!offer) return;
    try {
      const response = await api.get(`/company/offers/${offer.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `offer-letter-${offer.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; bg: string; text: string; border: string }> = {
      draft: { label: 'Draft', bg: 'bg-[#f2f2f7] dark:bg-[#2c2c2e]', text: 'text-[#86868b]', border: 'border-black/[0.06] dark:border-white/[0.08]' },
      pending: { label: 'Pending Signature', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-500/20' },
      sent: { label: 'Sent', bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-500/20' },
      viewed: { label: 'Viewed', bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-500/20' },
      accepted: { label: 'Accepted', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-500/20' },
      declined: { label: 'Declined', bg: 'bg-red-500/10', text: 'text-red-600 dark:text-red-400', border: 'border-red-500/20' },
      negotiating: { label: 'Negotiating', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' }
    };
    
    const badge = badges[status] || badges.draft;
    return (
      <span className={`px-3 py-1 border rounded-full text-xs font-bold uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="p-8 text-center text-[#86868b]">
        Offer letter record not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-1 text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
              Offer Letter Details
            </h1>
            <p className="text-xs text-[#86868b] font-medium">
              Complete terms, timeline, and candidate signature verification
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge(offer.status)}
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] text-[#1d1d1f] dark:text-white text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Negotiation Alert Panel */}
      {offer.status === 'negotiating' && (
        <div className="border border-amber-500/30 bg-amber-500/10 rounded-3xl p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-bold text-amber-700 dark:text-amber-300">
                Candidate Requested Negotiation
              </h3>
              <p className="text-xs italic text-amber-800 dark:text-amber-200">
                "{offer.negotiationNote}"
              </p>
            </div>
          </div>

          {(isAdmin || isHR) && (
            <div>
              {!showNegotiationResponse ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setNegotiationAction('accept_negotiation');
                      setShowNegotiationResponse(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white rounded-2xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Counter / Accept Terms
                  </button>
                  <button
                    onClick={() => {
                      setNegotiationAction('reject_negotiation');
                      setShowNegotiationResponse(true);
                    }}
                    className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-2xl text-xs font-bold hover:bg-[#e5e5ea] cursor-pointer"
                  >
                    Decline Negotiation
                  </button>
                </div>
              ) : (
                <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] p-4 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-[#1d1d1f] dark:text-white">
                    {negotiationAction === 'accept_negotiation' ? 'Update Offer Terms' : 'Decline Negotiation Note'}
                  </h4>

                  {negotiationAction === 'accept_negotiation' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-[#86868b] uppercase">Revised Salary</label>
                        <input
                          type="text"
                          value={updatedSalary}
                          onChange={(e) => setUpdatedSalary(e.target.value)}
                          className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#86868b] uppercase">Revised Start Date</label>
                        <input
                          type="date"
                          value={updatedStartDate}
                          onChange={(e) => setUpdatedStartDate(e.target.value)}
                          className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] px-3 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-bold text-[#86868b] uppercase">Response Message</label>
                    <textarea
                      rows={2}
                      value={responseNote}
                      onChange={(e) => setResponseNote(e.target.value)}
                      placeholder="Enter response details for the candidate..."
                      className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] p-3 rounded-xl text-xs font-medium focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowNegotiationResponse(false)}
                      className="px-3 py-1.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNegotiationResponse}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white rounded-xl text-xs font-bold"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Response'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Candidate Info Card */}
        <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Candidate Profile</h3>
          
          <div className="flex items-center gap-3">
            {offer.application?.jobSeekerProfile?.profilePhotoUrl ? (
              <img
                src={offer.application.jobSeekerProfile.profilePhotoUrl}
                alt={offer.application.jobSeekerProfile.fullName}
                className="w-12 h-12 rounded-2xl object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] font-bold flex items-center justify-center text-base">
                {offer.application?.jobSeekerProfile?.fullName?.charAt(0).toUpperCase() || 'C'}
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                {offer.application?.jobSeekerProfile?.fullName}
              </h4>
              <p className="text-xs text-[#86868b]">{offer.application?.jobSeekerProfile?.email}</p>
            </div>
          </div>

          {offer.application?.jobSeekerProfile?.phone && (
            <div className="text-xs text-[#86868b] flex items-center gap-2 pt-2 border-t border-black/[0.04]">
              <Phone className="w-3.5 h-3.5 text-[#0071e3]" />
              <span>{offer.application.jobSeekerProfile.phone}</span>
            </div>
          )}
        </div>

        {/* Position Details Card */}
        <div className="md:col-span-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 space-y-4">
          <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Position &amp; Compensation</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-[#86868b] uppercase text-[10px] font-bold">Position</p>
              <p className="font-bold text-[#1d1d1f] dark:text-white mt-0.5">{offer.position}</p>
            </div>
            <div>
              <p className="text-[#86868b] uppercase text-[10px] font-bold">Department</p>
              <p className="font-bold text-[#1d1d1f] dark:text-white mt-0.5">{offer.department || '—'}</p>
            </div>
            <div>
              <p className="text-[#86868b] uppercase text-[10px] font-bold">Employment</p>
              <p className="font-bold text-[#1d1d1f] dark:text-white mt-0.5">{offer.employmentType}</p>
            </div>
            <div>
              <p className="text-[#86868b] uppercase text-[10px] font-bold">Salary / Compensation</p>
              <p className="font-bold text-[#0071e3] text-sm mt-0.5">{offer.currency} {offer.salary}</p>
            </div>
            <div>
              <p className="text-[#86868b] uppercase text-[10px] font-bold">Start Date</p>
              <p className="font-bold text-[#1d1d1f] dark:text-white mt-0.5">{new Date(offer.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-[#86868b] uppercase text-[10px] font-bold">Location</p>
              <p className="font-bold text-[#1d1d1f] dark:text-white mt-0.5">{offer.location || 'Remote'}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Signature Verification Status */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 space-y-4">
        <h3 className="text-xs font-bold text-[#86868b] uppercase tracking-wider">Signature &amp; Verification Status</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-[#fbfbfd] dark:bg-[#18181a] border border-black/[0.04] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">Company Representative Signature</span>
              {offer.companySignature ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Verified</span>
              ) : (
                <span className="text-[10px] font-bold text-[#86868b] bg-[#f2f2f7] dark:bg-[#2c2c2e] px-2 py-0.5 rounded-full">Pending</span>
              )}
            </div>
            {offer.companySignature ? (
              <img src={offer.companySignature} alt="Company Signature" className="h-16 object-contain bg-white rounded-lg p-1 border border-black/[0.06]" />
            ) : (
              <p className="text-xs text-[#86868b] italic">Not signed yet</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-[#fbfbfd] dark:bg-[#18181a] border border-black/[0.04] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1d1d1f] dark:text-white">Candidate Signature</span>
              {offer.candidateSignature ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">Accepted</span>
              ) : (
                <span className="text-[10px] font-bold text-[#86868b] bg-[#f2f2f7] dark:bg-[#2c2c2e] px-2 py-0.5 rounded-full">Awaiting Response</span>
              )}
            </div>
            {offer.candidateSignature ? (
              <img src={offer.candidateSignature} alt="Candidate Signature" className="h-16 object-contain bg-white rounded-lg p-1 border border-black/[0.06]" />
            ) : (
              <p className="text-xs text-[#86868b] italic">No signature recorded</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
