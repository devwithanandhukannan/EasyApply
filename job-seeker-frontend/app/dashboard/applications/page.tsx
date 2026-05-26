// app/dashboard/applications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Building2, 
  Clock, 
  Calendar,
  MapPin,
  Search,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import api from '@/app/lib/axios';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, applications]);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const response = await api.get(`/jobseeker/applications?${params}`);
      if (response.data.success) {
        setApplications(response.data.data);
        setFilteredApplications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredApplications(applications);
      return;
    }

    const filtered = applications.filter((app: any) =>
      app.jobPosting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobPosting.company.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredApplications(filtered);
  };

  const handleWithdraw = async (id: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;

    try {
      await api.delete(`/jobseeker/applications/${id}`);
      fetchApplications();
      alert('Application withdrawn successfully');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to withdraw application');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      applied: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      reviewed: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      shortlisted: 'bg-green-500/10 text-green-500 border-green-500/20',
      interview: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      offer: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      hired: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'shortlisted':
      case 'hired':
        return <CheckCircle2 size={16} />;
      case 'rejected':
        return <XCircle size={16} />;
      case 'interview':
        return <Calendar size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const calculateDaysAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    interview: applications.filter(a => a.status === 'interview').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">My Applications</h1>
        <p className="text-gray-500">Track and manage your job applications</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-4">
          <p className="text-gray-500 text-sm mb-1">Total</p>
          <p className="text-2xl font-semibold text-white">{stats.total}</p>
        </div>
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-4">
          <p className="text-gray-500 text-sm mb-1">Applied</p>
          <p className="text-2xl font-semibold text-blue-500">{stats.applied}</p>
        </div>
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-4">
          <p className="text-gray-500 text-sm mb-1">Shortlisted</p>
          <p className="text-2xl font-semibold text-green-500">{stats.shortlisted}</p>
        </div>
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-4">
          <p className="text-gray-500 text-sm mb-1">Interviews</p>
          <p className="text-2xl font-semibold text-yellow-500">{stats.interview}</p>
        </div>
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl p-4">
          <p className="text-gray-500 text-sm mb-1">Rejected</p>
          <p className="text-2xl font-semibold text-red-500">{stats.rejected}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-black border border-[#2c2c2e] rounded-xl text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 bg-black border border-[#2c2c2e] rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="applied">Applied</option>
            <option value="reviewed">Reviewed</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500">Loading applications...</p>
          </div>
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-12 text-center">
          <Briefcase className="mx-auto mb-4 text-gray-600" size={48} />
          <h3 className="text-xl font-semibold text-white mb-2">No applications yet</h3>
          <p className="text-gray-500 mb-6">
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start applying to jobs to see them here'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/dashboard/jobs"
              className="inline-block px-6 py-3 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors"
            >
              Browse Jobs
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application) => (
            <div
              key={application.id}
              className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6 hover:border-white transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  {application.jobPosting.company.logoUrl ? (
                    <img
                      src={application.jobPosting.company.logoUrl}
                      alt={application.jobPosting.company.name}
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Building2 size={28} className="text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <Link
                      href={`/dashboard/jobs/${application.jobPosting.id}`}
                      className="text-xl font-semibold text-white hover:underline"
                    >
                      {application.jobPosting.title}
                    </Link>
                    <p className="text-gray-400 mt-1">{application.jobPosting.company.name}</p>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                      {application.jobPosting.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin size={14} />
                          <span>{application.jobPosting.location}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <Briefcase size={14} />
                        <span>{application.jobPosting.jobType}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/dashboard/applications/${application.id}`}
                    className="p-2 hover:bg-[#2c2c2e] rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </Link>
                  {['applied', 'reviewed'].includes(application.status) && (
                    <button
                      onClick={() => handleWithdraw(application.id)}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-500"
                      title="Withdraw Application"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#2c2c2e]">
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${getStatusColor(application.status)}`}>
                    {getStatusIcon(application.status)}
                    <span className="capitalize">{application.status.replace('_', ' ')}</span>
                  </span>
                  {application.resume.atsScore && (
                    <span className="text-sm text-gray-500">
                      ATS Score: <span className="text-green-500 font-medium">{application.resume.atsScore}%</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Clock size={14} />
                  <span>Applied {calculateDaysAgo(application.appliedAt)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}