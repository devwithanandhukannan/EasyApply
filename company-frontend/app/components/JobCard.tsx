// app/components/JobCard.tsx
'use client';

import { MapPin, Clock, DollarSign, Users, Calendar, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';

interface JobCardProps {
  job: any;
  onUpdate: () => void;
  onEdit: (job: any) => void;
}

export default function JobCard({ job, onUpdate, onEdit }: JobCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

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

  const handleDelete = async () => {
    const confirmed = confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await api.delete(`/company/jobs/${job.id}`);
      onUpdate(); // Refresh the jobs list
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  const handleEdit = () => {
    onEdit(job);
    setShowMenu(false);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation when clicking menu button or menu items
    if ((e.target as HTMLElement).closest('.menu-container')) {
      return;
    }
    router.push(`/dashboard/jobs/${job.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 hover:border-zinc-800 transition-all group relative cursor-pointer"
    >
      {/* Menu */}
      <div className="absolute top-4 right-4 menu-container">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-2 rounded-lg hover:bg-zinc-900 transition-colors text-zinc-500 hover:text-white"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />
            <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-20 py-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                <Edit className="h-4 w-4" />
                Edit Job
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                disabled={isDeleting}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? 'Deleting...' : 'Delete Job'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start gap-3 mb-2">
          <h3 className="text-lg font-semibold text-white flex-1 pr-8">
            {job.title}
          </h3>
        </div>
        <p className="text-sm text-zinc-500">{job.department}</p>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
        </span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Clock className="h-4 w-4" />
          <span>{job.jobType}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <MapPin className="h-4 w-4" />
          <span>{job.locationType}</span>
        </div>
        {job.salaryRange && (
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <DollarSign className="h-4 w-4" />
            <span>{job.salaryRange}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Users className="h-4 w-4" />
          <span>{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Skills */}
      {job.requiredSkills && job.requiredSkills.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {job.requiredSkills.slice(0, 3).map((skill: string, idx: number) => (
            <span
              key={idx}
              className="px-2.5 py-1 bg-zinc-900 text-zinc-400 text-xs rounded-md"
            >
              {skill}
            </span>
          ))}
          {job.requiredSkills.length > 3 && (
            <span className="px-2.5 py-1 bg-zinc-900 text-zinc-400 text-xs rounded-md">
              +{job.requiredSkills.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5" />
          <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
        {job.deadline && (
          <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}