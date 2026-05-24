// app/dashboard/jobs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Briefcase } from 'lucide-react';
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

  // Fetch jobs
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

  // Filter jobs
  useEffect(() => {
    let result = jobs;

    // Search filter
    if (searchQuery) {
      result = result.filter((job: any) =>
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Job type filter
    if (filters.jobType !== 'all') {
      result = result.filter((job: any) => job.jobType === filters.jobType);
    }

    // Location filter
    if (filters.location !== 'all') {
      result = result.filter((job: any) => job.locationType === filters.location);
    }

    // Status filter
    if (filters.status !== 'all') {
      result = result.filter((job: any) => job.status === filters.status);
    }

    // Tab filter
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Job Postings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage and create job opportunities
          </p>
        </div>
        <button
          onClick={handleNewJob}
          className="flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-lg font-medium text-sm hover:bg-zinc-100 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Post New Job
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search jobs by title, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filters.jobType}
              onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
              className="px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
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
              className="px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
            >
              <option value="all">All Locations</option>
              <option value="On-site">On-site</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-4 py-2.5 bg-black border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
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
      <div className="border-b border-zinc-900">
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

      {/* Jobs Grid - 4 CARDS PER ROW */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white"></div>
            <p className="text-sm text-zinc-500">Loading jobs...</p>
          </div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-12 bg-zinc-950 border border-zinc-900 rounded-xl">
          <Briefcase className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No jobs found</h3>
          <p className="text-sm text-zinc-500 mb-6">
            {searchQuery || filters.jobType !== 'all' || filters.location !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by posting your first job'}
          </p>
          {!searchQuery && filters.jobType === 'all' && filters.location === 'all' && (
            <button
              onClick={handleNewJob}
              className="px-4 py-2 bg-white text-black rounded-lg font-medium text-sm hover:bg-zinc-100 transition-colors"
            >
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

      {/* Job Posting Modal */}
      <JobPostingModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleJobCreated}
        editJob={editingJob}
      />
    </div>
  );
}