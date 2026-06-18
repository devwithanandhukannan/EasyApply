'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Briefcase, MapPin, Clock, CheckCircle, 
  XCircle, Users, TrendingUp, Filter 
} from 'lucide-react';
import JobPostingModal from '@/app/components/JobPostingModal';
import JobCard from '@/app/components/JobCard';
import api from '@/app/lib/axios';

export default function JobsPage() {
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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 bg-black min-h-screen text-zinc-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Job Postings</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage and create job opportunities for candidates</p>
        </div>
        <button
          onClick={handleNewJob}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Post New Job
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Active Jobs</p>
            <Briefcase size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{activeJobs}</p>
          <p className="text-xs text-zinc-500 mt-1">Out of {jobs.length} total</p>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">Total Applications</p>
            <Users size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{totalApplications}</p>
          <p className="text-xs text-zinc-500 mt-1">Across all jobs</p>
        </div>
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">New This Week</p>
            <TrendingUp size={18} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-white mt-2">{recentJobs}</p>
          <p className="text-xs text-zinc-500 mt-1">Posted in last 7 days</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input
              type="text"
              placeholder="Search by title, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.jobType}
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
              className="px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600"
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
              className="px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600"
            >
              <option value="all">All Locations</option>
              <option value="On-site">On-site</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 bg-black border border-zinc-800 rounded-lg text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-600"
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
      <div className="border-b border-zinc-800">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('recent')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'recent'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-400'
            }`}
          >
            Recent Posts
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-400'
            }`}
          >
            All Jobs ({jobs.length})
          </button>
        </div>
      </div>

      {/* Jobs Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="w-8 h-8 border-3 border-zinc-700 border-t-white rounded-full animate-spin mb-3"></div>
          <p className="text-sm text-zinc-500">Loading jobs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900 rounded-xl border border-zinc-800">
          <Briefcase className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No jobs found</h3>
          <p className="text-sm text-zinc-500 mb-6">
            {searchQuery || filters.jobType !== 'all' || filters.location !== 'all'
              ? 'Try adjusting your search or filters'
              : 'Get started by posting your first job'}
          </p>
          {!searchQuery && filters.jobType === 'all' && filters.location === 'all' && (
            <button
              onClick={handleNewJob}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-zinc-200 transition-colors"
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