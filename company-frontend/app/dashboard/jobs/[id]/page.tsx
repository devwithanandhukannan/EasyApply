// app/dashboard/jobs/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, MapPin, Clock, DollarSign, Users, Calendar, 
  Edit, Trash2, Briefcase, Building2, Target 
} from 'lucide-react';
import api from '@/app/lib/axios';
import JobPostingModal from '@/app/components/JobPostingModal';

export default function JobDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchJobDetails();
    }
  }, [params.id]);

  const fetchJobDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/company/jobs/${params.id}`);
      setJob(response.data.job);
    } catch (error) {
      console.error('Error fetching job details:', error);
      alert('Failed to load job details');
      router.push('/dashboard/jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await api.delete(`/company/jobs/${params.id}`);
      router.push('/dashboard/jobs');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    setIsEditModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    fetchJobDetails();
    setIsEditModalOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'closed':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'draft':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white"></div>
          <p className="text-sm text-zinc-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-500">Job not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push('/dashboard/jobs')}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Jobs
      </button>

      {/* Header */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-2">{job.title}</h1>
            <div className="flex items-center gap-4 text-zinc-400">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{job.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getStatusColor(job.status)}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
            <button
              onClick={handleEdit}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-white transition-colors"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-500 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Quick Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-900">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg">
              <Clock className="h-4 w-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Job Type</p>
              <p className="text-sm font-medium text-white">{job.jobType}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg">
              <MapPin className="h-4 w-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Location</p>
              <p className="text-sm font-medium text-white">{job.locationType}</p>
            </div>
          </div>

          {job.salaryRange && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-900 rounded-lg">
                <DollarSign className="h-4 w-4 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs text-zinc-500">Salary</p>
                <p className="text-sm font-medium text-white">{job.salaryRange}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2 bg-zinc-900 rounded-lg">
              <Users className="h-4 w-4 text-zinc-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500">Openings</p>
              <p className="text-sm font-medium text-white">{job.openings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Location Details */}
        {job.location && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-zinc-400" />
              <h3 className="font-semibold text-white">Location</h3>
            </div>
            <p className="text-zinc-400">{job.location}</p>
          </div>
        )}

        {/* Experience */}
        {job.experienceRequired && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-5 w-5 text-zinc-400" />
              <h3 className="font-semibold text-white">Experience</h3>
            </div>
            <p className="text-zinc-400">{job.experienceRequired}</p>
          </div>
        )}

        {/* Deadline */}
        {job.deadline && (
          <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-zinc-400" />
              <h3 className="font-semibold text-white">Deadline</h3>
            </div>
            <p className="text-zinc-400">
              {new Date(job.deadline).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
      </div>

      {/* Skills */}
      {job.requiredSkills && job.requiredSkills.length > 0 && (
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-zinc-400" />
            <h3 className="font-semibold text-white">Required Skills</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {job.requiredSkills.map((skill: string, idx: number) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-white text-black rounded-lg text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">Job Description</h3>
        <div className="prose prose-invert prose-sm max-w-none">
          <div 
            className="text-zinc-300 whitespace-pre-wrap leading-relaxed"
            dangerouslySetInnerHTML={{ __html: job.description.replace(/\n/g, '<br/>') }}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <JobPostingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleUpdateSuccess}
        editJob={job}
      />
    </div>
  );
}