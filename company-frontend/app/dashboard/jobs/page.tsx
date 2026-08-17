'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Briefcase, MapPin, Clock, CheckCircle, 
  XCircle, Users, TrendingUp, Filter 
} from 'lucide-react';
import JobPostingModal from '@/app/components/JobPostingModal';
import JobCard from '@/app/components/JobCard';
import api from '@/app/lib/axios';
import { useAuth } from '@/app/contexts/AuthContext';

export default function JobsPage() {
  const { isAdmin, isHR } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    jobType: 'all',
    location: 'all',
    status: 'all',
  });
  const [activeTab, setActiveTab] = useState<'recent' | 'all'>('recent');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/company/jobs');
      setJobs(response.data.jobs || []);
      setFilteredJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
      setFilteredJobs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = jobs;

    if (searchQuery) {
      result = result.filter((job: any) =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.jobType !== 'all') {
      result = result.filter((job: any) => job.jobType === filters.jobType);
    }

    if (filters.location !== 'all') {
      result = result.filter((job: any) => job.locationType === filters.location);
    }

    if (filters.status !== 'all') {
      result = result.filter((job: any) => job.status === filters.status);
    }

    if (activeTab === 'recent') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      result = result.filter((job: any) => new Date(job.createdAt) >= sevenDaysAgo);
    }

    setFilteredJobs(result);
  }, [searchQuery, filters, jobs, activeTab]);

  const handleJobCreated = () => {
    fetchJobs();
    setIsModalOpen(false);
    setEditingJob(null);
  };

  const handleEditJob = (job: any) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  const handleNewJob = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingJob(null);
  };

  // Stats
  const activeJobs = jobs.filter((job: any) => job.status === 'active').length;
  const totalApplications = jobs.reduce((sum: number, job: any) => sum + (job.applicationsCount || 0), 0);
  const recentJobs = jobs.filter((job: any) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return new Date(job.createdAt) >= sevenDaysAgo;
  }).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 text-[#1d1d1f] dark:text-[#f5f5f7]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">Job Postings</h1>
          <p className="text-xs sm:text-sm text-[#86868b] mt-0.5">Manage, track, and publish active career opportunities.</p>
        </div>
        {(isAdmin || isHR) && (
          <button
            onClick={handleNewJob}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-semibold text-xs transition-all shadow-[0_4px_14px_rgba(0,113,227,0.3)] cursor-pointer"
          >
            <Plus size={16} />
            Post New Job
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">Active Jobs</p>
            <div className="w-8 h-8 rounded-full bg-[#34c759]/10 flex items-center justify-center">
              <Briefcase size={16} className="text-[#248a3d] dark:text-[#30d158]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7] mt-2">{activeJobs}</p>
          <p className="text-xs text-[#86868b] mt-1">Out of {jobs.length} total postings</p>
        </div>
        
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">Total Applications</p>
            <div className="w-8 h-8 rounded-full bg-[#0071e3]/10 flex items-center justify-center">
              <Users size={16} className="text-[#0071e3]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7] mt-2">{totalApplications}</p>
          <p className="text-xs text-[#86868b] mt-1">Received across all positions</p>
        </div>

        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">New This Week</p>
            <div className="w-8 h-8 rounded-full bg-[#af52de]/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-[#af52de]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1d1d1f] dark:text-[#f5f5f7] mt-2">{recentJobs}</p>
          <p className="text-xs text-[#86868b] mt-1">Posted within last 7 days</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" size={16} />
            <input
              type="text"
              placeholder="Search by title, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] focus:outline-none focus:border-[#0071e3] transition-all font-medium"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.jobType}
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
              className="px-3.5 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] font-medium cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
              <option value="Spot">Spot</option>
            </select>

            <select
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="px-3.5 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] font-medium cursor-pointer"
            >
              <option value="all">All Locations</option>
              <option value="On-site">On-site</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3.5 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-xs text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] font-medium cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl max-w-xs">
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
            activeTab === 'recent'
              ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm'
              : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
          }`}
        >
          Recent Posts
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer text-center ${
            activeTab === 'all'
              ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm'
              : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
          }`}
        >
          All Jobs ({jobs.length})
        </button>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08]">
          <div className="w-8 h-8 border-3 border-[#0071e3]/20 border-t-[#0071e3] rounded-full animate-spin mb-3"></div>
          <p className="text-xs text-[#86868b]">Loading jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#1c1c1e] rounded-3xl border border-black/[0.06] dark:border-white/[0.08] p-8 shadow-sm">
          <Briefcase className="h-12 w-12 text-[#86868b] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">No jobs found</h3>
          <p className="text-xs text-[#86868b] mb-5 max-w-sm mx-auto">
            {searchQuery || filters.jobType !== 'all' || filters.location !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first job opportunity.'}
          </p>
          {!searchQuery && filters.jobType === 'all' && filters.location === 'all' && (isAdmin || isHR) && (
            <button
              onClick={handleNewJob}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-semibold text-xs shadow-[0_4px_14px_rgba(0,113,227,0.3)] transition-all cursor-pointer"
            >
              <Plus size={16} />
              Post Your First Job
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredJobs.map((job: any) => (
            <JobCard 
              key={job.id} 
              job={job} 
              onUpdate={fetchJobs}
              onEdit={handleEditJob}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <JobPostingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleJobCreated}
        editJob={editingJob}
      />
    </div>
  );
}