'use client';
import { useState } from 'react';
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Filter,
  Search,
  FileText,
  MessageSquare
} from 'lucide-react';

export default function ApplicationsPage() {
  const [filterStatus, setFilterStatus] = useState('all');

  const applications = [
    {
      id: 1,
      company: 'Microsoft',
      logo: 'MS',
      role: 'Senior Software Engineer',
      location: 'Remote',
      salary: '$120k - $150k',
      appliedDate: '2024-01-15',
      status: 'Interview Scheduled',
      timeline: [
        { stage: 'Applied', date: '2024-01-15', completed: true },
        { stage: 'Under Review', date: '2024-01-16', completed: true },
        { stage: 'Shortlisted', date: '2024-01-17', completed: true },
        { stage: 'Interview Scheduled', date: '2024-01-18', completed: true },
        { stage: 'Offer', date: null, completed: false },
      ],
      resumeUsed: 'Senior Developer Resume',
      interviewDate: '2024-01-20',
    },
    {
      id: 2,
      company: 'Google',
      logo: 'G',
      role: 'Full Stack Developer',
      location: 'Mountain View, CA',
      salary: '$140k - $180k',
      appliedDate: '2024-01-14',
      status: 'Shortlisted',
      timeline: [
        { stage: 'Applied', date: '2024-01-14', completed: true },
        { stage: 'Under Review', date: '2024-01-15', completed: true },
        { stage: 'Shortlisted', date: '2024-01-16', completed: true },
        { stage: 'Interview Scheduled', date: null, completed: false },
        { stage: 'Offer', date: null, completed: false },
      ],
      resumeUsed: 'Full Stack Resume',
    },
    {
      id: 3,
      company: 'Amazon',
      logo: 'A',
      role: 'Backend Developer',
      location: 'Seattle, WA',
      salary: '$130k - $160k',
      appliedDate: '2024-01-13',
      status: 'Under Review',
      timeline: [
        { stage: 'Applied', date: '2024-01-13', completed: true },
        { stage: 'Under Review', date: '2024-01-14', completed: true },
        { stage: 'Shortlisted', date: null, completed: false },
        { stage: 'Interview Scheduled', date: null, completed: false },
        { stage: 'Offer', date: null, completed: false },
      ],
      resumeUsed: 'Senior Developer Resume',
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Applied': 'bg-blue-500/10 text-blue-500',
      'Under Review': 'bg-yellow-500/10 text-yellow-500',
      'Shortlisted': 'bg-green-500/10 text-green-500',
      'Interview Scheduled': 'bg-purple-500/10 text-purple-500',
      'Offer': 'bg-emerald-500/10 text-emerald-500',
      'Rejected': 'bg-red-500/10 text-red-500',
    };
    return colors[status] || 'bg-gray-500/10 text-gray-500';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Applied Jobs</h1>
          <p className="text-gray-500">Track all your job applications</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <input
            type="text"
            placeholder="Search applications..."
            className="w-full pl-12 pr-4 py-3 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white"
        >
          <option value="all">All Status</option>
          <option value="applied">Applied</option>
          <option value="review">Under Review</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview">Interview Scheduled</option>
          <option value="offer">Offer</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Applications List */}
      <div className="space-y-6">
        {applications.map((app) => (
          <div key={app.id} className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6 hover:border-white transition-colors">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-start space-x-4">
                <div className="w-14 h-14 bg-[#2c2c2e] rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  {app.logo}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">{app.role}</h3>
                  <p className="text-gray-400 mb-2">{app.company}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MapPin size={14} />
                      <span>{app.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <DollarSign size={14} />
                      <span>{app.salary}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>Applied {app.appliedDate}</span>
                    </div>
                  </div>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                {app.status}
              </span>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h4 className="text-white text-sm font-medium mb-4">Application Timeline</h4>
              <div className="relative">
                <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-[#2c2c2e]"></div>
                <div className="space-y-4">
                  {app.timeline.map((stage, index) => (
                    <div key={index} className="flex items-start space-x-4 relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                        stage.completed ? 'bg-white' : 'bg-[#2c2c2e]'
                      }`}>
                        {stage.completed && <div className="w-3 h-3 bg-black rounded-full"></div>}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${stage.completed ? 'text-white' : 'text-gray-500'}`}>
                            {stage.stage}
                          </span>
                          {stage.date && (
                            <span className="text-xs text-gray-600">{stage.date}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between pt-4 border-t border-[#2c2c2e]">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <FileText size={14} />
                  <span>Resume: {app.resumeUsed}</span>
                </div>
                {app.interviewDate && (
                  <div className="flex items-center space-x-2 text-purple-500">
                    <Clock size={14} />
                    <span>Interview: {app.interviewDate}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <button className="px-4 py-2 bg-[#000000] text-white rounded-lg text-sm hover:bg-[#2c2c2e] transition-colors flex items-center space-x-2">
                  <MessageSquare size={14} />
                  <span>Add Note</span>
                </button>
                <button className="px-4 py-2 bg-white text-black rounded-lg text-sm hover:bg-gray-100 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}