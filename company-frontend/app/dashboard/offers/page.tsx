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
  Signature
} from 'lucide-react';
import api from '@/app/lib/axios';
import Link from 'next/link';
import CreateOfferModal from '@/app/components/CreateOfferModal';
import SignOfferModal from '@/app/components/SignOfferModal';
import SendOfferModal from '@/app/components/SendOfferModal';

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
  const [offers, setOffers] = useState<OfferLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);

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
    const badges: Record<string, { label: string; color: string }> = {
      draft: { label: 'Draft', color: 'bg-zinc-900 border-zinc-800 text-zinc-500' },
      pending: { label: 'Pending', color: 'bg-blue-950/40 border-blue-900 text-blue-400' },
      sent: { label: 'Sent', color: 'bg-purple-950/40 border-purple-900 text-purple-400' },
      viewed: { label: 'Viewed', color: 'bg-cyan-950/40 border-cyan-900 text-cyan-400' },
      accepted: { label: 'Accepted', color: 'bg-emerald-950/40 border-emerald-900 text-emerald-400' },
      declined: { label: 'Declined', color: 'bg-red-950/40 border-red-900 text-red-400' },
      negotiating: { label: 'Negotiating', color: 'bg-amber-950/40 border-amber-900 text-amber-400' },
      expired: { label: 'Expired', color: 'bg-zinc-900 border-zinc-800 text-zinc-600' },
      withdrawn: { label: 'Withdrawn', color: 'bg-zinc-900 border-zinc-800 text-zinc-600' }
    };
    
    const badge = badges[status] || badges.draft;
    return (
      <span className={`px-2 py-1 border rounded-lg text-xs font-semibold uppercase ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const filteredOffers = offers.filter(offer => {
    const matchesSearch = 
      offer.application.jobSeekerProfile.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.application.jobSeekerProfile.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-black">
        <p className="text-xs text-zinc-500 animate-pulse font-mono">Loading offer pipeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white font-mono max-w-6xl mx-auto w-full p-4">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white uppercase">Offer Letter Pipeline</h1>
          <p className="text-xs text-zinc-500 mt-1">Manage digital offer generation, signatures, and candidate responses.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-zinc-200 transition-colors flex items-center gap-2 text-xs"
        >
          <Plus className="w-4 h-4" />
          Generate Offer Letter
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-950 p-3 border border-zinc-900 rounded-xl">
        <div className="sm:col-span-2 relative flex items-center">
          <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-600" />
          <input 
            type="text"
            placeholder="Search candidates, positions, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black border border-zinc-900 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:border-zinc-700 outline-none transition-colors"
          />
        </div>
        <div className="relative flex items-center">
          <SlidersHorizontal className="absolute left-3 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-black border border-zinc-900 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-400 uppercase focus:border-zinc-700 outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="accepted">Accepted</option>
            <option value="declined">Declined</option>
            <option value="negotiating">Negotiating</option>
          </select>
          <ChevronDown className="absolute right-3 w-3.5 h-3.5 text-zinc-600 pointer-events-none" />
        </div>
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="border border-dashed border-zinc-900 bg-zinc-950 p-12 rounded-xl text-center text-xs text-zinc-500">
          No offers found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredOffers.map((offer) => (
            <div 
              key={offer.id}
              className="border border-zinc-900 bg-zinc-950 p-5 rounded-xl space-y-4 hover:border-zinc-800 transition-all"
            >
              
              {/* Header Row */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {offer.application.jobSeekerProfile.profilePhotoUrl ? (
                    <img 
                      src={offer.application.jobSeekerProfile.profilePhotoUrl}
                      alt={offer.application.jobSeekerProfile.fullName}
                      className="w-10 h-10 rounded-full border border-zinc-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-zinc-600" />
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-white">
                      {offer.application.jobSeekerProfile.fullName}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      {offer.position} • {offer.application.jobPosting.department}
                    </p>
                    <p className="text-[11px] text-zinc-600 font-mono">
                      {offer.application.jobSeekerProfile.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(offer.status)}
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="space-y-1">
                  <p className="text-zinc-600 uppercase text-[10px] font-bold">Salary Package</p>
                  <p className="text-zinc-300 font-semibold">{offer.salary}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-600 uppercase text-[10px] font-bold">Start Date</p>
                  <p className="text-zinc-300">{new Date(offer.startDate).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-600 uppercase text-[10px] font-bold">Sent</p>
                  <p className="text-zinc-300">
                    {offer.sentAt ? new Date(offer.sentAt).toLocaleDateString() : '—'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-600 uppercase text-[10px] font-bold">Email Opens</p>
                  <p className="text-zinc-300">{offer.emailOpenCount}x</p>
                </div>
              </div>

              {/* Tracking Icons */}
              {offer.status !== 'draft' && (
                <div className="flex items-center gap-4 pt-2 border-t border-zinc-900/50">
                  <div className={`flex items-center gap-1.5 text-xs ${offer.sentAt ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email {offer.sentAt ? '✓' : '—'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${offer.viewedAt ? 'text-cyan-400' : 'text-zinc-600'}`}>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Viewed {offer.viewedAt ? '✓' : '—'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${offer.companySignature ? 'text-purple-400' : 'text-zinc-600'}`}>
                    <Signature className="w-3.5 h-3.5" />
                    <span>Company {offer.companySignature ? '✓' : '—'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${offer.candidateSignature ? 'text-emerald-400' : 'text-zinc-600'}`}>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Candidate {offer.candidateSignature ? '✓' : '—'}</span>
                  </div>
                </div>
              )}

              {/* Negotiation Note */}
              {offer.status === 'negotiating' && offer.candidateResponse && (
                <div className="bg-amber-950/20 border border-amber-900/50 p-3 rounded-lg text-xs text-amber-500">
                  <p className="font-bold uppercase text-[10px] mb-1">Negotiation Request:</p>
                  <p className="text-amber-400/80 italic">"{offer.candidateResponse}"</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-900/50">
                
                {offer.status === 'draft' && (
                  <button
                    onClick={() => handleSign(offer.id)}
                    className="px-3 py-1.5 bg-purple-500 hover:bg-purple-400 text-black font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Signature className="w-3.5 h-3.5" />
                    Sign Document
                  </button>
                )}

                {offer.status === 'pending' && (
                  <button
                    onClick={() => handleSend(offer.id)}
                    className="px-3 py-1.5 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send to Candidate
                  </button>
                )}

                {offer.status !== 'draft' && (
                  <button
                    onClick={() => handleDownload(offer.id)}
                    className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </button>
                )}

                <Link
                  href={`/dashboard/offers/${offer.id}`}
                  className="px-3 py-1.5 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-xs transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
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