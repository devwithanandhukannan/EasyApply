'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/app/lib/axios';

export default function DashboardPage() {
  const [profileCompletion, setProfileCompletion] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileScore = async () => {
      try {
        const response = await api.get('/jobseeker/profile');
        // Fallback to 0 if completionScore isn't processed yet
        setProfileCompletion(response.data.completionScore ?? 0);
      } catch (error) {
        console.error('Failed to load profile parameters:', error);
        setProfileCompletion(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileScore();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">Dashboard</h1>
        <p className="text-zinc-500 text-xs font-mono uppercase tracking-wider">Overview metric matrix</p>
      </div>

      {/* Profile Completion Card */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-medium mb-1">Profile completion</h3>
            <p className="text-zinc-500 text-xs">Complete your profile setup to maximize job matches</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-white">{profileCompletion}%</div>
          </div>
        </div>
        
        {/* Progress Metric Bar Container */}
        <div className="w-full bg-[#2c2c2e] rounded-full h-1.5">
          <div
            className="bg-white h-1.5 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${profileCompletion}%` }}
          ></div>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-xs">
          <span className="text-zinc-500">Add missing skills, credentials or certificates</span>
          <Link href="/dashboard/profile" className="text-white hover:underline font-mono text-[11px] uppercase tracking-wider">
            Edit profile →
          </Link>
        </div>
      </div>
    </div>
  );
}