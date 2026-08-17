// app/components/JobCard.tsx
'use client';

import { MapPin, Clock, DollarSign, Users, Calendar, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/axios';
import { useGlassToast } from './GlassToastContainer';
import { useAuth } from '@/app/contexts/AuthContext';

interface JobCardProps {
  job: any;
  onUpdate: () => void;
  onEdit: (job: any) => void;
}

export default function JobCard({ job, onUpdate, onEdit }: JobCardProps) {
  const { isAdmin, isHR } = useAuth();
  const { showToast } = useGlassToast();
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158] border-[#34c759]/20';
      case 'closed':
        return 'bg-[#ff3b30]/10 text-[#ff3b30] border-[#ff3b30]/20';
      case 'draft':
        return 'bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20';
      default:
        return 'bg-[#8e8e93]/10 text-[#6e6e73] dark:text-[#aeaeb2] border-[#8e8e93]/20';
    }
  };

  const handleDelete = async () => {
    const confirmed = confirm(`Are you sure you want to delete "${job.title}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await api.delete(`/company/jobs/${job.id}`);
      onUpdate();
    } catch (error) {
      console.error('Error deleting job:', error);
      showToast('failed', 'Failed to delete job. Please try again.', 'danger');
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
    if ((e.target as HTMLElement).closest('.menu-container')) {
      return;
    }
    router.push(`/dashboard/jobs/${job.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] hover:border-black/[0.12] dark:hover:border-white/[0.15] rounded-3xl p-6 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all group relative cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Menu */}
        {(isAdmin || isHR) && (
          <div className="absolute top-5 right-5 menu-container">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="p-2 rounded-xl hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] transition-colors text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white cursor-pointer"
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
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1c1c1e] border border-black/[0.08] dark:border-white/[0.1] rounded-2xl shadow-2xl z-20 py-1.5 p-1 space-y-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit();
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold text-[#1d1d1f] dark:text-[#f5f5f7] hover:bg-[#f2f2f7] dark:hover:bg-[#2c2c2e] rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit className="h-4 w-4 text-[#0071e3]" />
                    Edit Job
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                    disabled={isDeleting}
                    className="flex items-center gap-3 w-full px-3 py-2 text-xs font-semibold text-[#ff3b30] hover:bg-[#ff3b30]/10 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? 'Deleting...' : 'Delete Job'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Header */}
        <div className="mb-3 pr-8">
          <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7] leading-snug">
            {job.title}
          </h3>
          <p className="text-xs text-[#86868b] mt-0.5">{job.department || 'General'}</p>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getStatusColor(job.status)}`}>
            {job.status}
          </span>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4 text-xs text-[#6e6e73] dark:text-[#aeaeb2]">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="h-3.5 w-3.5 text-[#0071e3]" />
            <span>{job.jobType}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="h-3.5 w-3.5 text-[#0071e3]" />
            <span>{job.locationType}</span>
          </div>
          {job.salaryRange && (
            <div className="flex items-center gap-1.5 font-medium">
              <DollarSign className="h-3.5 w-3.5 text-[#0071e3]" />
              <span>{job.salaryRange}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 font-medium">
            <Users className="h-3.5 w-3.5 text-[#0071e3]" />
            <span>{job.openings} opening{job.openings > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Skills */}
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.requiredSkills.slice(0, 3).map((skill: string, idx: number) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] text-[#1d1d1f] dark:text-[#f5f5f7] text-[11px] font-medium rounded-lg"
              >
                {skill}
              </span>
            ))}
            {job.requiredSkills.length > 3 && (
              <span className="px-2 py-0.5 text-[10px] text-[#86868b] font-medium">
                +{job.requiredSkills.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[11px] text-[#86868b]">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>{new Date(job.createdAt).toLocaleDateString()}</span>
        </div>
        {job.deadline && (
          <span>Due {new Date(job.deadline).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}