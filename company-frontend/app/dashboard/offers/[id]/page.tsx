'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Send, 
  Clock, 
  Eye, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  Mail,
  Signature,
  Edit
} from 'lucide-react';
import api from '@/app/lib/axios';
import Link from 'next/link';

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
  const params = useParams();
  const router = useRouter();
  const [offer, setOffer] = useState<OfferDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOfferDetails();
  }, [params.id]);

  const fetchOfferDetails = async () => {
    try {
      const response = await api.get(`/company/offers/${params.id}`);
      if (response.data.success) {
        setOffer(response.data.data);
      }
    } catch (error) {
      console.error('Fetch offer details error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get(`/company/offers/${params.id}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `offer-letter-${params.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-black">
        <p className="text-xs text-zinc-500 animate-pulse font-mono">Loading offer details...</p>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex h-[60vh] items-center justify-center bg-black">
        <p className="text-xs text-zinc-500">Offer not found</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string; icon: any }> = {
      draft: { label: 'Draft', color: 'bg-zinc-900 border-zinc-800 text-zinc-500', icon: Edit },
      pending: { label: 'Pending Signature', color: 'bg-blue-950/40 border-blue-900 text-blue-400', icon: Signature },
      sent: { label: 'Sent', color: 'bg-purple-950/40 border-purple-900 text-purple-400', icon: Send },
      viewed: { label: 'Viewed', color: 'bg-cyan-950/40 border-cyan-900 text-cyan-400', icon: Eye },
      accepted: { label: 'Accepted', color: 'bg-emerald-950/40 border-emerald-900 text-emerald-400', icon: CheckCircle },
      declined: { label: 'Declined', color: 'bg-red-950/40 border-red-900 text-red-400', icon: XCircle },
      negotiating: { label: 'Negotiating', color: 'bg-amber-950/40 border-amber-900 text-amber-400', icon: MessageSquare }
    };
    
    const badge = badges[status] || badges.draft;
    const Icon = badge.icon;

    return (
      <span className={`px-3 py-1.5 border rounded-lg text-xs font-semibold uppercase flex items-center gap-2 ${badge.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 text-white font-mono max-w-4xl mx-auto w-full p-4">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight text-white uppercase">Offer Letter Details</h1>
          <p className="text-xs text-zinc-500 mt-1">Complete offer information and tracking metrics</p>
        </div>
        {getStatusBadge(offer.status)}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Candidate Info */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Candidate Card */}
          <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              {offer.application.jobSeekerProfile.profilePhotoUrl ? (
                <img 
                  src={offer.application.jobSeekerProfile.profilePhotoUrl}
                  alt={offer.application.jobSeekerProfile.fullName}
                  className="w-12 h-12 rounded-full border border-zinc-800"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-zinc-600" />
                </div>
              )}
              
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-semibold text-white">
                  {offer.application.jobSeekerProfile.fullName}
                </h3>
                <p className="text-xs text-zinc-500">{offer.position}</p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-zinc-900">
              <div className="flex items-center gap-2 text-xs">
                <Mail className="w-3.5 h-3.5 text-zinc-600" />
                <span className="text-zinc-400">{offer.application.jobSeekerProfile.email}</span>
              </div>
              {offer.application.jobSeekerProfile.phone && (
                <div className="flex items-center gap-2 text-xs">
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-600" />
                  <span className="text-zinc-400">{offer.application.jobSeekerProfile.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tracking Stats */}
          <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase">Engagement Tracking</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Email Opens</span>
                <span className="text-zinc-300 font-semibold">{offer.emailOpenCount}x</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Sent On</span>
                <span className="text-zinc-300">
                  {offer.sentAt ? new Date(offer.sentAt).toLocaleDateString() : '—'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">First Viewed</span>
                <span className="text-zinc-300">
                  {offer.viewedAt ? new Date(offer.viewedAt).toLocaleDateString() : '—'}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-500">Responded</span>
                <span className="text-zinc-300">
                  {offer.respondedAt ? new Date(offer.respondedAt).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase">Digital Signatures</h4>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Company</span>
                  {offer.companySignature ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-zinc-600" />
                  )}
                </div>
                {offer.companySignature && (
                  <div className="bg-black border border-zinc-900 rounded-lg p-2">
                    <img 
                      src={offer.companySignature.signature} 
                      alt="Company signature"
                      className="w-full h-16 object-contain"
                    />
                    <p className="text-[10px] text-zinc-600 mt-1">
                      Signed: {new Date(offer.companySignature.signedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Candidate</span>
                  {offer.candidateSignature ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Clock className="w-4 h-4 text-zinc-600" />
                  )}
                </div>
                {offer.candidateSignature && (
                  <div className="bg-black border border-zinc-900 rounded-lg p-2">
                    <img 
                      src={offer.candidateSignature.signature} 
                      alt="Candidate signature"
                      className="w-full h-16 object-contain"
                    />
                    <p className="text-[10px] text-zinc-600 mt-1">
                      Signed: {new Date(offer.candidateSignature.signedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column - Offer Details */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Offer Information */}
          <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-4">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase border-b border-zinc-900 pb-3">
              Offer Details
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-zinc-600 uppercase font-bold">Position</p>
                <p className="text-sm text-zinc-300 font-semibold">{offer.position}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-zinc-600 uppercase font-bold">Department</p>
                <p className="text-sm text-zinc-300">{offer.department || '—'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-zinc-600 uppercase font-bold">Annual Salary</p>
                <p className="text-sm text-zinc-300 font-semibold">
                  {new Intl.NumberFormat('en-US', { 
                    style: 'currency', 
                    currency: offer.currency 
                  }).format(Number(offer.salary))}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-zinc-600 uppercase font-bold">Employment Type</p>
                <p className="text-sm text-zinc-300 capitalize">{offer.employmentType.replace('-', ' ')}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-zinc-600 uppercase font-bold">Start Date</p>
                <p className="text-sm text-zinc-300">
                  {new Date(offer.startDate).toLocaleDateString()}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-zinc-600 uppercase font-bold">Location</p>
                <p className="text-sm text-zinc-300">{offer.location || '—'}</p>
              </div>
            </div>
          </div>

          {/* Candidate Response */}
          {offer.candidateResponse && (
            <div className={`border rounded-xl p-5 space-y-3 ${
              offer.candidateResponse === 'accept' 
                ? 'border-emerald-900/50 bg-emerald-950/20' 
                : offer.candidateResponse === 'decline'
                ? 'border-red-900/50 bg-red-950/20'
                : 'border-amber-900/50 bg-amber-950/20'
            }`}>
              <div className="flex items-center gap-2">
                {offer.candidateResponse === 'accept' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                {offer.candidateResponse === 'decline' && <XCircle className="w-5 h-5 text-red-400" />}
                {offer.candidateResponse === 'negotiate' && <MessageSquare className="w-5 h-5 text-amber-400" />}
                <h4 className="text-sm font-semibold text-white uppercase">
                  Candidate {offer.candidateResponse === 'accept' ? 'Accepted' : offer.candidateResponse === 'decline' ? 'Declined' : 'Requested Negotiation'}
                </h4>
              </div>

              {offer.negotiationNote && (
                <div className="bg-black/30 border border-zinc-900/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 italic">"{offer.negotiationNote}"</p>
                </div>
              )}

              <p className="text-xs text-zinc-500">
                Responded on {new Date(offer.respondedAt!).toLocaleString()}
              </p>
            </div>
          )}

          {/* Letter Preview */}
          <div className="border border-zinc-900 bg-zinc-950 rounded-xl p-5 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase">Letter Preview</h4>
            <div className="bg-black border border-zinc-900 rounded-lg p-6 max-h-96 overflow-y-auto">
              <div 
                className="text-xs text-zinc-400 leading-relaxed prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(offer.content).replace(/\\n/g, '<br />') }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownload}
              className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </button>

            {offer.status === 'draft' && (
              <Link
                href={`/dashboard/offers/${offer.id}/edit`}
                className="px-4 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Offer
              </Link>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}