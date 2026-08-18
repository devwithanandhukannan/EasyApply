'use client';

import { useEffect, useState } from 'react';
import { 
  FileText, 
  Send, 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  Search,
  SlidersHorizontal,
  Plus,
  ChevronDown,
  Mail,
  MessageSquare,
  Bell,
  Edit,
  FileSignature,
  Loader2,
  Calendar,
  DollarSign,
  Building2,
  User,
} from 'lucide-react';
import api from '@/app/lib/axios';
import Link from 'next/link';
import CreateOfferModal from '@/app/components/CreateOfferModal';
import SignOfferModal from '@/app/components/SignOfferModal';
import SendOfferModal from '@/app/components/SendOfferModal';
import EditOfferModal from '@/app/components/EditOfferModal';
import { useAuth } from '@/app/contexts/AuthContext';
import LockedFeaturePaywall from '@/app/components/LockedFeaturePaywall';

interface OfferLetter {
  id: string;
  position: string;
  salary: string;
  startDate: string;
  status: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  candidateResponse: string | null;
  emailOpenCount: number;
  companySignature: any;
  candidateSignature: any;
  application: {
    jobSeekerProfile: {
      fullName: string;
      email: string;
      profilePhotoUrl: string | null;
    };
    jobPosting: {
      title: string;
      department: string;
    };
  };
}

export default function OffersPage() {
  const { isAdmin, isHR, hasFeature, can } = useAuth();
  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const hasAccess = hasFeature('offerLetters');

  if (!hasAccess) {
    return (
      <LockedFeaturePaywall
        featureKey="offerLetters"
        featureTitle="Digital Offer Letters & Signature Workflows"
        featureDescription="Generate company-branded digital offer letters, manage legal templates, and track candidate signature responses in real-time."
      />
    );
  }

  const fetchOffers = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await api.get('/company/offers/company/list', { params });
      if (response.data.success) {
        setOffers(response.data.data);
      }
    } catch (error) {
      console.error('Failed fetching offers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [statusFilter]);

  const handleSign = (offerId: string) => {
    setSelectedOfferId(offerId);
    setIsSignModalOpen(true);
  };

  const handleSend = (offerId: string) => {
    setSelectedOfferId(offerId);
    setIsSendModalOpen(true);
  };

  const handleDownload = async (offerId: string) => {
    try {
      const response = await api.get(`/company/offers/${offerId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `offer-letter-${offerId}.pdf`);
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
      negotiating: { label: 'Negotiating', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-500/20' },
      expired: { label: 'Expired', bg: 'bg-[#f2f2f7] dark:bg-[#2c2c2e]', text: 'text-[#86868b]', border: 'border-black/[0.06] dark:border-white/[0.08]' },
      withdrawn: { label: 'Withdrawn', bg: 'bg-[#f2f2f7] dark:bg-[#2c2c2e]', text: 'text-[#86868b]', border: 'border-black/[0.06] dark:border-white/[0.08]' }
    };
    
    const badge = badges[status] || badges.draft;
    return (
      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-bold uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border}`}>
        {badge.label}
      </span>
    );
  };

  const filteredOffers = offers.filter(offer => {
    const candidateName = offer.application?.jobSeekerProfile?.fullName || '';
    const position = offer.position || '';
    const email = offer.application?.jobSeekerProfile?.email || '';
    const query = searchQuery.toLowerCase();
    
    return candidateName.toLowerCase().includes(query) ||
      position.toLowerCase().includes(query) ||
      email.toLowerCase().includes(query);
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#0071e3]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-1 text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1d1d1f] dark:text-white">
              Offer Letter Pipeline
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#86868b] dark:text-slate-400 mt-1 font-medium">
            Manage digital offer generation, e-signatures, compensation packages, and candidate responses.
          </p>
        </div>

        {(isAdmin || isHR || can('offers', 'create')) && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] hover:from-[#0062c4] hover:to-[#1d4ed8] text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Offer Letter</span>
          </button>
        )}
      </div>

      {/* ── FILTERS & SEARCH ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 relative flex items-center">
          <Search className="absolute left-3.5 w-4 h-4 text-[#86868b]" />
          <input 
            type="text"
            placeholder="Search candidates, positions, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl pl-10 pr-4 py-2.5 text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] focus:border-[#0071e3] outline-none transition-colors shadow-xs"
          />
        </div>
        <div className="relative flex items-center">
          <SlidersHorizontal className="absolute left-3.5 w-3.5 h-3.5 text-[#86868b] pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl pl-10 pr-8 py-2.5 text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] focus:border-[#0071e3] outline-none appearance-none cursor-pointer shadow-xs"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending Signature</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="negotiating">Negotiating</option>
          </select>
          <ChevronDown className="absolute right-3.5 w-4 h-4 text-[#86868b] pointer-events-none" />
        </div>
      </div>

      {/* ── OFFERS LIST ────────────────────────────────────────────── */}
      {filteredOffers.length === 0 ? (
        <div className="border border-dashed border-black/[0.08] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-12 rounded-3xl text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">No Offers Found</h3>
            <p className="text-xs text-[#86868b] mt-0.5">No offer letters matching your filter criteria.</p>
          </div>
          {(isAdmin || isHR || can('offers', 'create')) && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] text-[#0071e3] text-xs font-bold rounded-2xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Offer Letter</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOffers.map((offer) => (
            <div 
              key={offer.id}
              className="border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1c1c1e] p-5 sm:p-6 rounded-3xl space-y-4 hover:shadow-md transition-all"
            >
              
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  {offer.application?.jobSeekerProfile?.profilePhotoUrl ? (
                    <img 
                      src={offer.application.jobSeekerProfile.profilePhotoUrl}
                      alt={offer.application.jobSeekerProfile.fullName}
                      className="w-11 h-11 rounded-2xl object-cover border border-black/[0.06] dark:border-white/[0.08]"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center text-[#0071e3] font-bold text-sm">
                      {offer.application?.jobSeekerProfile?.fullName?.charAt(0).toUpperCase() || 'C'}
                    </div>
                  )}
                  
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white">
                      {offer.application?.jobSeekerProfile?.fullName || 'Candidate'}
                    </h3>
                    <p className="text-xs text-[#86868b] font-medium">
                      {offer.position} &bull; {offer.application?.jobPosting?.department || 'Department'}
                    </p>
                    <p className="text-[11px] text-[#86868b]">
                      {offer.application?.jobSeekerProfile?.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(offer.status)}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#fbfbfd] dark:bg-[#18181a] p-3.5 rounded-2xl border border-black/[0.04] dark:border-white/[0.04] text-xs">
                <div className="space-y-0.5">
                  <p className="text-[#86868b] uppercase text-[10px] font-bold tracking-wider">Salary Package</p>
                  <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-bold">{offer.salary}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[#86868b] uppercase text-[10px] font-bold tracking-wider">Start Date</p>
                  <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-semibold">{new Date(offer.startDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[#86868b] uppercase text-[10px] font-bold tracking-wider">Sent Date</p>
                  <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-medium">
                    {offer.sentAt ? new Date(offer.sentAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[#86868b] uppercase text-[10px] font-bold tracking-wider">Email Opens</p>
                  <p className="text-[#1d1d1f] dark:text-[#f5f5f7] font-medium">{offer.emailOpenCount || 0}x</p>
                </div>
              </div>

              {/* Tracking Status Timeline */}
              {offer.status !== 'draft' && (
                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                  <div className={`flex items-center gap-1.5 ${offer.sentAt ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-[#86868b]'}`}>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email {offer.sentAt ? '✓' : '—'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${offer.viewedAt ? 'text-cyan-600 dark:text-cyan-400 font-semibold' : 'text-[#86868b]'}`}>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Viewed {offer.viewedAt ? '✓' : '—'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${offer.companySignature ? 'text-purple-600 dark:text-purple-400 font-semibold' : 'text-[#86868b]'}`}>
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>Company Signed {offer.companySignature ? '✓' : '—'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${offer.candidateSignature ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-[#86868b]'}`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Candidate Signed {offer.candidateSignature ? '✓' : '—'}</span>
                  </div>
                </div>
              )}

              {/* Negotiation Note */}
              {offer.status === 'negotiating' && offer.candidateResponse && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-2xl text-xs text-amber-700 dark:text-amber-300 space-y-1">
                  <p className="font-bold uppercase text-[10px] tracking-wider">Candidate Negotiation Request:</p>
                  <p className="italic">"{offer.candidateResponse}"</p>
                </div>
              )}

              {/* Actions Row */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                
                {/* DRAFT STATUS - Edit + Sign */}
                {(isAdmin || isHR || can('offers', 'edit')) && offer.status === 'draft' && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedOfferId(offer.id);
                        setIsEditModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5 text-[#0071e3]" />
                      <span>Edit Offer</span>
                    </button>
                    
                    <button
                      onClick={() => handleSign(offer.id)}
                      className="px-3.5 py-1.5 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      <span>Sign Document</span>
                    </button>
                  </>
                )}

                {/* PENDING STATUS WITHOUT SIGNATURE */}
                {(isAdmin || isHR || can('offers', 'edit')) && offer.status === 'pending' && !offer.companySignature && (
                  <button
                    onClick={() => handleSign(offer.id)}
                    className="px-3.5 py-1.5 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>Sign Updated Offer</span>
                  </button>
                )}

                {/* PENDING STATUS WITH SIGNATURE - Send to Candidate */}
                {(isAdmin || isHR || can('offers', 'send')) && offer.status === 'pending' && offer.companySignature && (
                  <button
                    onClick={() => handleSend(offer.id)}
                    className="px-3.5 py-1.5 bg-gradient-to-tr from-[#0071e3] to-[#2563eb] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send to Candidate</span>
                  </button>
                )}

                {/* DOWNLOAD PDF */}
                {(offer.status === 'sent' || offer.status === 'viewed' || offer.status === 'accepted' || offer.status === 'declined' || offer.status === 'negotiating') && (
                  <button
                    onClick={() => handleDownload(offer.id)}
                    className="px-3.5 py-1.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#0071e3]" />
                    <span>Download PDF</span>
                  </button>
                )}

                {/* VIEW DETAILS */}
                <Link
                  href={`/dashboard/offers/${offer.id}`}
                  className="px-3.5 py-1.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ml-auto"
                >
                  <Eye className="w-3.5 h-3.5 text-[#86868b]" />
                  <span>View Details</span>
                </Link>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateOfferModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchOffers}
      />
      
      {selectedOfferId && (
        <EditOfferModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedOfferId(null);
          }}
          offerId={selectedOfferId}
          onSuccess={fetchOffers}
        />
      )}

      {selectedOfferId && (
        <>
          <SignOfferModal
            isOpen={isSignModalOpen}
            onClose={() => {
              setIsSignModalOpen(false);
              setSelectedOfferId(null);
            }}
            offerId={selectedOfferId}
            onSuccess={fetchOffers}
          />

          <SendOfferModal
            isOpen={isSendModalOpen}
            onClose={() => {
              setIsSendModalOpen(false);
              setSelectedOfferId(null);
            }}
            offerId={selectedOfferId}
            onSuccess={fetchOffers}
          />
        </>
      )}

    </div>
  );
}