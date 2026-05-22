'use client';
import { useState } from 'react';
import { FileText, Upload, Eye, Download, Edit, Trash2, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function ResumesPage() {
  const [resumes, setResumes] = useState([
    {
      id: 1,
      name: 'Senior Developer Resume',
      atsScore: 92,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-16',
      type: 'built',
    },
    {
      id: 2,
      name: 'Full Stack Resume',
      atsScore: 78,
      createdAt: '2024-01-10',
      updatedAt: '2024-01-12',
      type: 'uploaded',
    },
    {
      id: 3,
      name: 'Frontend Specialist',
      atsScore: 85,
      createdAt: '2024-01-05',
      updatedAt: '2024-01-08',
      type: 'built',
    },
  ]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-500/10';
    if (score >= 60) return 'bg-yellow-500/10';
    return 'bg-red-500/10';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">My Resumes</h1>
          <p className="text-gray-500">Manage and optimize your resumes</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/resumes/upload"
            className="flex items-center space-x-2 bg-[#1c1c1e] text-white px-4 py-3 rounded-xl border border-[#2c2c2e] hover:border-white transition-colors"
          >
            <Upload size={18} />
            <span>Upload Resume</span>
          </Link>
          <Link
            href="/dashboard/resumes/builder"
            className="flex items-center space-x-2 bg-white text-black px-4 py-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Plus size={18} />
            <span>Build New Resume</span>
          </Link>
        </div>
      </div>

      {/* Resumes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resumes.map((resume) => (
          <div key={resume.id} className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6 hover:border-white transition-colors">
            {/* Resume Icon & Score */}
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[#2c2c2e] rounded-xl flex items-center justify-center">
                <FileText size={24} className="text-white" />
              </div>
              <div className={`${getScoreBgColor(resume.atsScore)} ${getScoreColor(resume.atsScore)} px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1`}>
                <TrendingUp size={12} />
                <span>ATS {resume.atsScore}%</span>
              </div>
            </div>

            {/* Resume Name */}
            <h3 className="text-white font-medium mb-2 text-lg">{resume.name}</h3>
            
            {/* Meta Info */}
            <div className="space-y-1 mb-4">
              <p className="text-gray-500 text-xs">
                Created: {new Date(resume.createdAt).toLocaleDateString()}
              </p>
              <p className="text-gray-500 text-xs">
                Updated: {new Date(resume.updatedAt).toLocaleDateString()}
              </p>
              <p className="text-gray-400 text-xs capitalize">
                Type: {resume.type}
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button className="flex items-center justify-center space-x-2 bg-[#000000] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#2c2c2e] transition-colors">
                <Eye size={16} />
                <span>View</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-[#000000] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#2c2c2e] transition-colors">
                <Download size={16} />
                <span>Download</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-[#000000] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#2c2c2e] transition-colors">
                <Edit size={16} />
                <span>Edit</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-[#000000] text-red-500 px-3 py-2 rounded-lg text-sm hover:bg-[#2c2c2e] transition-colors">
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {resumes.length === 0 && (
        <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-[#2c2c2e] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-gray-600" />
          </div>
          <h3 className="text-white font-medium text-lg mb-2">No resumes yet</h3>
          <p className="text-gray-500 mb-6">Create or upload your first resume to get started</p>
          <div className="flex items-center justify-center space-x-3">
            <Link
              href="/dashboard/resumes/upload"
              className="flex items-center space-x-2 bg-[#2c2c2e] text-white px-4 py-2 rounded-lg hover:bg-[#3c3c3e] transition-colors"
            >
              <Upload size={18} />
              <span>Upload Resume</span>
            </Link>
            <Link
              href="/dashboard/resumes/builder"
              className="flex items-center space-x-2 bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Plus size={18} />
              <span>Build Resume</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}