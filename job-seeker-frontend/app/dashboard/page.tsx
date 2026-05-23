'use client';
import { useState, useEffect } from 'react';
import { 
  FileText, 
  Briefcase, 
  Calendar, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [profileCompletion, setProfileCompletion] = useState(65);

  // Mock data - replace with API calls
  const stats = [
    { label: 'Total Resumes', value: '4', icon: FileText, color: 'bg-blue-500' },
    { label: 'Applications', value: '12', icon: Briefcase, color: 'bg-green-500' },
    { label: 'Interviews', value: '3', icon: Calendar, color: 'bg-purple-500' },
    { label: 'Recommended', value: '8', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  const upcomingInterviews = [
    {
      id: 1,
      company: 'Tech Corp',
      role: 'Senior Developer',
      date: '2024-01-20',
      time: '10:00 AM',
      countdown: '2 days',
    },
    {
      id: 2,
      company: 'StartupXYZ',
      role: 'Frontend Engineer',
      date: '2024-01-22',
      time: '2:00 PM',
      countdown: '4 days',
    },
  ];

  const recentApplications = [
    {
      id: 1,
      company: 'Microsoft',
      role: 'Software Engineer',
      status: 'Under Review',
      appliedDate: '2024-01-15',
      statusColor: 'text-yellow-500',
    },
    {
      id: 2,
      company: 'Google',
      role: 'Full Stack Developer',
      status: 'Shortlisted',
      appliedDate: '2024-01-14',
      statusColor: 'text-green-500',
    },
    {
      id: 3,
      company: 'Amazon',
      role: 'Backend Developer',
      status: 'Applied',
      appliedDate: '2024-01-13',
      statusColor: 'text-blue-500',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-white mb-2">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's your overview</p>
      </div>

      {/* Profile Completion */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-medium mb-1">Profile Completion</h3>
            <p className="text-gray-500 text-sm">Complete your profile to get better matches</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold text-white">{profileCompletion}%</div>
          </div>
        </div>
        <div className="w-full bg-[#2c2c2e] rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all duration-500"
            style={{ width: `${profileCompletion}%` }}
          ></div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">Add skills and experience to improve</span>
          <Link href="/dashboard/profile" className="text-white hover:underline">
            Complete Profile →
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}>
                  <Icon size={24} className="text-white" />
                </div>
              </div>
              <div className="text-3xl font-semibold text-white mb-1">{stat.value}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Interviews */}
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Upcoming Interviews</h3>
            <Link href="/dashboard/interviews" className="text-sm text-gray-500 hover:text-white">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {upcomingInterviews.map((interview) => (
              <div
                key={interview.id}
                className="bg-[#000000] border border-[#2c2c2e] rounded-xl p-4 hover:border-white transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-white font-medium mb-1">{interview.role}</h4>
                    <p className="text-gray-500 text-sm">{interview.company}</p>
                  </div>
                  <div className="bg-purple-500/10 text-purple-500 text-xs px-3 py-1 rounded-full">
                    {interview.countdown}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{interview.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{interview.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Applications</h3>
            <Link href="/dashboard/applications" className="text-sm text-gray-500 hover:text-white">
              View All →
            </Link>
          </div>
          <div className="space-y-4">
            {recentApplications.map((app) => (
              <div
                key={app.id}
                className="bg-[#000000] border border-[#2c2c2e] rounded-xl p-4 hover:border-white transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-white font-medium mb-1">{app.role}</h4>
                    <p className="text-gray-500 text-sm">{app.company}</p>
                  </div>
                  <span className={`text-xs font-medium ${app.statusColor}`}>{app.status}</span>
                </div>
                <div className="text-xs text-gray-600">Applied {app.appliedDate}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Jobs */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">Recommended Jobs</h3>
            <p className="text-sm text-gray-500">Based on your profile and preferences</p>
          </div>
          <Link
            href="/dashboard/recommended"
            className="text-sm bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            View All
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[#000000] border border-[#2c2c2e] rounded-xl p-4 hover:border-white transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="text-white font-medium mb-1">Senior Frontend Developer</h4>
                  <p className="text-gray-500 text-sm">Tech Company Inc.</p>
                </div>
                <div className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded">95% Match</div>
              </div>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
                <span>Remote</span>
                <span>•</span>
                <span>$120k - $150k</span>
                <span>•</span>
                <span>Full-time</span>
              </div>
              <button className="w-full bg-white text-black text-sm py-2 rounded-lg hover:bg-gray-100 transition-colors">
                Apply Now
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}