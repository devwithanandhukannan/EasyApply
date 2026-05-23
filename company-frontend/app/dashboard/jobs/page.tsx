'use client';
import { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  PauseCircle,
  PlayCircle,
  Users,
  Clock,
  X,
  Sparkles,
  Loader2,
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
} from 'lucide-react';

interface JobPosting {
  id: string;
  title: string;
  department: string;
  jobType: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance';
  location: string;
  locationType: 'On-site' | 'Remote' | 'Hybrid';
  description: string;
  experienceRequired: string;
  skillsRequired: string[];
  salaryRange: string;
  deadline: string;
  openings: number;
  applicants: number;
  status: 'active' | 'paused' | 'closed';
  postedDate: string;
}

export default function JobPostingsPage() {
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'closed'>('all');
  const [generatingJD, setGeneratingJD] = useState(false);

  const [jobs, setJobs] = useState<JobPosting[]>([
    {
      id: '1',
      title: 'Senior Flutter Developer',
      department: 'Engineering',
      jobType: 'Full-time',
      location: 'San Francisco, CA',
      locationType: 'Hybrid',
      description: 'We are looking for an experienced Flutter developer...',
      experienceRequired: '3-5 years',
      skillsRequired: ['Flutter', 'Dart', 'Firebase', 'REST APIs', 'Git'],
      salaryRange: '$120k - $150k',
      deadline: '2024-02-28',
      openings: 2,
      applicants: 45,
      status: 'active',
      postedDate: '2024-01-15',
    },
  ]);

  const [formData, setFormData] = useState({
    title: '',
    department: '',
    jobType: 'Full-time' as const,
    location: '',
    locationType: 'Remote' as const,
    description: '',
    experienceRequired: '',
    skillsRequired: '',
    salaryRange: '',
    deadline: '',
    openings: 1,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newJob: JobPosting = {
      id: Date.now().toString(),
      ...formData,
      skillsRequired: formData.skillsRequired.split(',').map((s) => s.trim()),
      applicants: 0,
      status: 'active',
      postedDate: new Date().toISOString(),
    };
    setJobs([newJob, ...jobs]);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      department: '',
      jobType: 'Full-time',
      location: '',
      locationType: 'Remote',
      description: '',
      experienceRequired: '',
      skillsRequired: '',
      salaryRange: '',
      deadline: '',
      openings: 1,
    });
  };

  const handleGenerateJD = async () => {
    setGeneratingJD(true);
    // Simulate AI generation
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setFormData({
      ...formData,
      description: `We are seeking a highly skilled ${formData.title} to join our ${formData.department} team. 

Key Responsibilities:
• Design, develop, and maintain high-quality applications
• Collaborate with cross-functional teams to define and ship new features
• Write clean, maintainable, and well-documented code
• Participate in code reviews and contribute to technical discussions
• Stay up-to-date with emerging technologies and industry trends

Requirements:
• ${formData.experienceRequired} of professional experience
• Strong problem-solving and analytical skills
• Excellent communication and teamwork abilities
• Bachelor's degree in Computer Science or related field (or equivalent experience)

What We Offer:
• Competitive salary and benefits package
• Flexible work arrangements
• Professional development opportunities
• Collaborative and innovative work environment`,
    });
    setGeneratingJD(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this job posting?')) {
      setJobs(jobs.filter((job) => job.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setJobs(
      jobs.map((job) =>
        job.id === id
          ? { ...job, status: job.status === 'active' ? 'paused' : 'active' as any }
          : job
      )
    );
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || job.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Job Postings</h1>
          <p className="text-gray-500">Manage your job postings and track applications</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-xl font-medium hover:bg-gray-100 transition-colors"
        >
          <Plus size={18} />
          Post New Job
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-white transition-colors"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-white transition-colors"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Job Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6 hover:border-[#3c3c3e] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-white font-semibold text-lg">{job.title}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.status === 'active'
                        ? 'bg-green-500/10 text-green-400'
                        : job.status === 'paused'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-gray-500/10 text-gray-400'
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Briefcase size={14} />
                    <span>{job.department}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>
                      {job.locationType} • {job.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{job.jobType}</span>
                  </div>
                  {job.salaryRange && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      <span>{job.salaryRange}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStatus(job.id)}
                  className="p-2 hover:bg-[#2c2c2e] rounded-lg transition-colors text-gray-400 hover:text-white"
                  title={job.status === 'active' ? 'Pause' : 'Activate'}
                >
                  {job.status === 'active' ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
                </button>
                <button className="p-2 hover:bg-[#2c2c2e] rounded-lg transition-colors text-gray-400 hover:text-white">
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDelete(job.id)}
                  className="p-2 hover:bg-[#2c2c2e] rounded-lg transition-colors text-gray-400 hover:text-red-400"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {job.skillsRequired.map((skill, idx) => (
                <span
                  key={idx}
                  className="bg-blue-500/10 text-blue-400 text-xs px-3 py-1 rounded-full"
                >
                  {skill}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[#2c2c2e]">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-gray-500" />
                  <span className="text-white font-medium">{job.applicants}</span>
                  <span className="text-gray-500 text-sm">applicants</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-500" />
                  <span className="text-gray-500 text-sm">
                    Posted {new Date(job.postedDate).toLocaleDateString()}
                  </span>
                </div>
                {job.deadline && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-500" />
                    <span className="text-gray-500 text-sm">
                      Deadline: {new Date(job.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">
                View Applicants →
              </button>
            </div>
          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase size={48} className="mx-auto text-gray-700 mb-4" />
            <p className="text-gray-500">No job postings found</p>
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#1c1c1e] border-b border-[#2c2c2e] p-6 flex items-center justify-between z-10">
              <h2 className="text-white font-semibold text-xl">Post New Job</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-[#2c2c2e] rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Senior Flutter Developer"
                    className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Department *</label>
                  <input
                    type="text"
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Engineering"
                    className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Job Type *</label>
                  <select
                    required
                    value={formData.jobType}
                    onChange={(e) => setFormData({ ...formData, jobType: e.target.value as any })}
                    className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Location Type *</label>
                  <select
                    required
                    value={formData.locationType}
                    onChange={(e) =>
                      setFormData({ ...formData, locationType: e.target.value as any })
                    }
                    className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                  >
                    <option value="Remote">Remote</option>
                    <option value="On-site">On-site</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Location *</label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., San Francisco, CA"
                    className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Experience Required *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.experienceRequired}
                    onChange={(e) =>
                      setFormData({ ...formData, experienceRequired: e.target.value })
                    }
                    placeholder="e.g., 2-5 years"
                    className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Salary Range</label>
                  <input
                    type="text"
                    value={formData.salaryRange}
                    onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                    placeholder="e.g., $100k - $150k"
                    className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Application Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 text-sm mb-2">Number of Openings *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.openings}
                    onChange={(e) =>
                      setFormData({ ...formData, openings: parseInt(e.target.value) })
                    }
                    className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-white transition-colors"
                  />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Skills Required *</label>
                <input
                  type="text"
                  required
                  value={formData.skillsRequired}
                  onChange={(e) => setFormData({ ...formData, skillsRequired: e.target.value })}
                  placeholder="Comma-separated, e.g., Flutter, Dart, Firebase, REST APIs"
                  className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors"
                />
                <p className="text-gray-600 text-xs mt-1">
                  Separate skills with commas. Used for AI matching.
                </p>
              </div>

              {/* Job Description */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-400 text-sm">Job Description *</label>
                  <button
                    type="button"
                    onClick={handleGenerateJD}
                    disabled={!formData.title || !formData.department || generatingJD}
                    className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {generatingJD ? (
                      <>
                        <Loader2 size={12} className="animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={12} />
                        AI Generate
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  required
                  rows={10}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter detailed job description, responsibilities, and requirements..."
                  className="w-full bg-[#111] border border-[#2c2c2e] rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-[#2c2c2e]">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-[#2c2c2e] text-white px-4 py-3 rounded-xl font-medium hover:bg-[#3c3c3e] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-white text-black px-4 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                >
                  Post Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}