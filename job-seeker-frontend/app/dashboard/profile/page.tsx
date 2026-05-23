'use client';

import { useEffect, useState } from 'react';
import {
  User,
  MapPin,
  Briefcase,
  Code,
  Award,
  Plus,
  Save,
  Upload,
  X,
  Trash2,
  Link as LinkIcon,
  GraduationCap,
  CheckCircle2,
} from 'lucide-react';
import api from '@/app/lib/axios';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('basic');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Form States
  const [basicInfo, setBasicInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    bio: '',
  });

  const [preferences, setPreferences] = useState({
    roles: [] as string[],
    industries: [] as string[],
    jobType: '',
    experience: '',
    expectedSalary: '',
    workLocationPreference: '',
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const [education, setEducation] = useState([
    {
      id: 1,
      institution: '',
      degree: '',
      field: '',
      location: '',
      startMonth: '',
      startYear: '',
      endMonth: '',
      endYear: '',
      cgpa: '',
      description: '',
    },
  ]);

  const [experience, setExperience] = useState([
    {
      id: 1,
      company: '',
      role: '',
      location: '',
      startMonth: '',
      startYear: '',
      endMonth: '',
      endYear: '',
      current: false,
      description: '',
      skills: [] as string[],
    },
  ]);

  const [projects, setProjects] = useState([
    {
      id: 1,
      name: '',
      description: '',
      technologies: [] as string[],
      githubLink: '',
      liveLink: '',
      startDate: '',
      endDate: '',
    },
  ]);

  const [certifications, setCertifications] = useState([
    {
      id: 1,
      name: '',
      organization: '',
      issueDate: '',
      credentialUrl: '',
    },
  ]);

  const [languages, setLanguages] = useState([
    { id: 1, language: '', proficiency: 'Beginner' },
  ]);

  const [achievements, setAchievements] = useState([
    { id: 1, title: '', description: '', year: '' },
  ]);

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'preferences', label: 'Job Preferences', icon: Briefcase },
    { id: 'skills', label: 'Skills', icon: Code },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'projects', label: 'Projects', icon: Code },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'certifications', label: 'Certifications', icon: Award },
    { id: 'languages', label: 'Languages', icon: CheckCircle2 },
    { id: 'achievements', label: 'Achievements', icon: Award },
  ];

  // Update helpers
  const updateEducation = (id: number, field: string, value: any) => {
    setEducation(prev => prev.map(edu => edu.id === id ? { ...edu, [field]: value } : edu));
  };

  const updateExperience = (id: number, field: string, value: any) => {
    setExperience(prev => prev.map(exp => exp.id === id ? { ...exp, [field]: value } : exp));
  };

  const updateProject = (id: number, field: string, value: any) => {
    setProjects(prev => prev.map(proj => proj.id === id ? { ...proj, [field]: value } : proj));
  };

  const updateCertification = (id: number, field: string, value: any) => {
    setCertifications(prev => prev.map(cert => cert.id === id ? { ...cert, [field]: value } : cert));
  };

  const updateLanguage = (id: number, field: string, value: any) => {
    setLanguages(prev => prev.map(lang => lang.id === id ? { ...lang, [field]: value } : lang));
  };

  const updateAchievement = (id: number, field: string, value: any) => {
    setAchievements(prev => prev.map(ach => ach.id === id ? { ...ach, [field]: value } : ach));
  };

  // Fetch profile on mount
  useEffect(() => {
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/jobseeker/profile');
      const data = response.data;
      
      setBasicInfo({
        fullName: data.fullName || '',
        email: data.email || '',
        phone: data.phone || '',
        location: data.location || '',
        linkedin: data.linkedin || '',
        github: data.github || '',
        portfolio: data.portfolio || '',
        bio: data.bio || '',
      });
      
      setProfileImage(data.profilePic || null);
      
      setPreferences({
        roles: data.preferences?.roles || [],
        industries: data.preferences?.industries || [],
        jobType: data.preferences?.jobType || '',
        experience: data.preferences?.experience || '',
        expectedSalary: data.preferences?.expectedSalary || '',
        workLocationPreference: data.preferences?.workLocationPreference || '',
      });
      
      setSkills(data.skills || []);
      
      // Only set if data exists, otherwise keep initial state
      if (data.education?.length) setEducation(data.education);
      if (data.experience?.length) setExperience(data.experience);
      if (data.projects?.length) setProjects(data.projects);
      if (data.certifications?.length) setCertifications(data.certifications);
      if (data.languages?.length) setLanguages(data.languages);
      if (data.achievements?.length) setAchievements(data.achievements);
      
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };
  
  fetchProfile();
}, []); // Empty array is correct now - no state dependencies

  // Image handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
      setProfileImageFile(file);
    }
  };

  const removePhoto = () => {
    setProfileImage(null);
    setProfileImageFile(null);
  };

  // Skills
  const addSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };
  const removeSkill = (index: number) => setSkills(skills.filter((_, i) => i !== index));

  // Dynamic array helpers
  const addEducation = () => setEducation([...education, { id: Date.now(), institution: '', degree: '', field: '', location: '', startMonth: '', startYear: '', endMonth: '', endYear: '', cgpa: '', description: '' }]);
  const removeEducation = (id: number) => setEducation(education.filter(edu => edu.id !== id));

  const addExperience = () => setExperience([...experience, { id: Date.now(), company: '', role: '', location: '', startMonth: '', startYear: '', endMonth: '', endYear: '', current: false, description: '', skills: [] }]);
  const removeExperience = (id: number) => setExperience(experience.filter(exp => exp.id !== id));

  const addProject = () => setProjects([...projects, { id: Date.now(), name: '', description: '', technologies: [], githubLink: '', liveLink: '', startDate: '', endDate: '' }]);
  const removeProject = (id: number) => setProjects(projects.filter(proj => proj.id !== id));

  const addCertification = () => setCertifications([...certifications, { id: Date.now(), name: '', organization: '', issueDate: '', credentialUrl: '' }]);
  const removeCertification = (id: number) => setCertifications(certifications.filter(cert => cert.id !== id));

  const addLanguage = () => setLanguages([...languages, { id: Date.now(), language: '', proficiency: 'Beginner' }]);
  const removeLanguage = (id: number) => setLanguages(languages.filter(lang => lang.id !== id));

  const addAchievement = () => setAchievements([...achievements, { id: Date.now(), title: '', description: '', year: '' }]);
  const removeAchievement = (id: number) => setAchievements(achievements.filter(ach => ach.id !== id));

  // Save all
  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const profileData = {
        fullName: basicInfo.fullName,
        email: basicInfo.email,
        phone: basicInfo.phone,
        location: basicInfo.location,
        linkedin: basicInfo.linkedin,
        github: basicInfo.github,
        portfolio: basicInfo.portfolio,
        bio: basicInfo.bio,
        profilePic: profileImage,
        preferences: {
          roles: preferences.roles,
          industries: preferences.industries,
          jobType: preferences.jobType,
          experience: preferences.experience,
          expectedSalary: preferences.expectedSalary,
          workLocationPreference: preferences.workLocationPreference,
        },
        skills: skills,
        education: education,
        experience: experience,
        projects: projects,
        certifications: certifications,
        languages: languages,
        achievements: achievements,
      };

      const formData = new FormData();
      formData.append('profileData', JSON.stringify(profileData));
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }

      await api.put('/jobseeker/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  const years = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white mb-1">Profile</h1>
          <p className="text-gray-500 text-sm">Manage your professional information</p>
        </div>
        
      </div>

      {/* Tabs */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-2">
        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap text-xs font-medium ${
                  activeTab === tab.id
                    ? 'bg-white text-black'
                    : 'text-gray-400 hover:text-white hover:bg-[#2c2c2e]'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-6">
        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>

            {/* Profile Photo */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[#2c2c2e] flex items-center justify-center overflow-hidden">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-gray-600" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-white text-black p-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
                  <Upload size={14} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>
              <div>
                <h3 className="text-white text-sm font-medium mb-1">Profile Photo</h3>
                <p className="text-gray-500 text-xs mb-2">Upload a professional photo (optional)</p>
                {profileImage && (
                  <button onClick={removePhoto} className="text-red-500 text-xs hover:underline">
                    Remove Photo
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">Full Name *</label>
                <input type="text" value={basicInfo.fullName} onChange={(e) => setBasicInfo({ ...basicInfo, fullName: e.target.value })} placeholder="John Doe" className="w-full px-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">Email *</label>
                <input type="email" value={basicInfo.email} onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })} placeholder="john@example.com" className="w-full px-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">Phone Number</label>
                <input type="tel" value={basicInfo.phone} onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="w-full px-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">Current Location *</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type="text" value={basicInfo.location} onChange={(e) => setBasicInfo({ ...basicInfo, location: e.target.value })} placeholder="San Francisco, CA" className="w-full pl-10 pr-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">LinkedIn Profile</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type="url" value={basicInfo.linkedin} onChange={(e) => setBasicInfo({ ...basicInfo, linkedin: e.target.value })} placeholder="linkedin.com/in/username" className="w-full pl-10 pr-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
                </div>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">GitHub Profile</label>
                <div className="relative">
                  <Code size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type="url" value={basicInfo.github} onChange={(e) => setBasicInfo({ ...basicInfo, github: e.target.value })} placeholder="github.com/username" className="w-full pl-10 pr-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs font-medium mb-2">Portfolio Website</label>
                <div className="relative">
                  <LinkIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input type="url" value={basicInfo.portfolio} onChange={(e) => setBasicInfo({ ...basicInfo, portfolio: e.target.value })} placeholder="yourportfolio.com" className="w-full pl-10 pr-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-xs font-medium mb-2">Professional Summary</label>
                <textarea value={basicInfo.bio} onChange={(e) => setBasicInfo({ ...basicInfo, bio: e.target.value })} placeholder="Brief description about yourself, your expertise, and career goals..." rows={4} className="w-full px-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600 resize-none" />
              </div>
            </div>
          </div>
        )}

        {/* Job Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Job Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">Preferred Roles</label>
                <input type="text" placeholder="e.g., Software Engineer, Product Manager" value={preferences.roles.join(', ')} onChange={(e) => setPreferences({ ...preferences, roles: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} className="w-full px-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
                <p className="text-gray-600 text-xs mt-1">Comma separated</p>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">Preferred Industries</label>
                <input type="text" placeholder="e.g., Technology, Healthcare, Finance" value={preferences.industries.join(', ')} onChange={(e) => setPreferences({ ...preferences, industries: e.target.value.split(',').map(s => s.trim()).filter(s => s) })} className="w-full px-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">Job Type</label>
                <select value={preferences.jobType} onChange={(e) => setPreferences({ ...preferences, jobType: e.target.value })} className="w-full px-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm">
                  <option value="">Select job type</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">Experience Level</label>
                <select value={preferences.experience} onChange={(e) => setPreferences({ ...preferences, experience: e.target.value })} className="w-full px-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm">
                  <option value="">Select experience level</option>
                  <option value="entry">Entry Level (0-2 years)</option>
                  <option value="mid">Mid Level (2-5 years)</option>
                  <option value="senior">Senior Level (5-10 years)</option>
                  <option value="lead">Lead/Principal (10+ years)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">Expected Salary (Annual)</label>
                <input type="text" placeholder="e.g., $100,000 - $150,000" value={preferences.expectedSalary} onChange={(e) => setPreferences({ ...preferences, expectedSalary: e.target.value })} className="w-full px-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
              </div>
              <div>
                <label className="block text-gray-400 text-xs font-medium mb-2">Work Location Preference</label>
                <select value={preferences.workLocationPreference} onChange={(e) => setPreferences({ ...preferences, workLocationPreference: e.target.value })} className="w-full px-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm">
                  <option value="">Select preference</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-4">Skills</h2>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-2">Add Skills</label>
              <div className="flex space-x-2">
                <input type="text" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addSkill()} placeholder="Type a skill and press Enter" className="flex-1 px-4 py-2.5 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
                <button onClick={addSkill} className="px-4 py-2.5 bg-white text-black rounded-xl hover:bg-gray-100 transition-colors text-sm font-medium">Add</button>
              </div>
            </div>
            {skills.length > 0 && (
              <div>
                <h3 className="text-white text-sm font-medium mb-3">Your Skills ({skills.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <div key={index} className="bg-[#000000] border border-[#2c2c2e] px-3 py-1.5 rounded-lg flex items-center space-x-2 text-sm">
                      <span className="text-white">{skill}</span>
                      <button onClick={() => removeSkill(index)} className="text-gray-500 hover:text-red-500 transition-colors"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Work Experience</h2>
              <button onClick={addExperience} className="flex items-center space-x-2 bg-white text-black px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-xs font-medium"><Plus size={14} /><span>Add Experience</span></button>
            </div>
            {experience.map((exp, index) => (
              <div key={exp.id} className="bg-[#000000] border border-[#2c2c2e] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-sm font-medium">Experience {index + 1}</h3>
                  {experience.length > 1 && <button onClick={() => removeExperience(exp.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Company Name *</label><input type="text" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} placeholder="Company Name" className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Job Title *</label><input type="text" value={exp.role} onChange={(e) => updateExperience(exp.id, 'role', e.target.value)} placeholder="e.g., Senior Developer" className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Location</label><input type="text" value={exp.location} onChange={(e) => updateExperience(exp.id, 'location', e.target.value)} placeholder="City, Country" className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                  <div className="flex items-center space-x-2 pt-6"><input type="checkbox" id={`current-${exp.id}`} checked={exp.current} onChange={(e) => updateExperience(exp.id, 'current', e.target.checked)} className="w-4 h-4 rounded border border-[#2c2c2e]" /><label htmlFor={`current-${exp.id}`} className="text-white text-xs">I currently work here</label></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Start Date *</label><div className="grid grid-cols-2 gap-2"><select value={exp.startMonth} onChange={(e) => updateExperience(exp.id, 'startMonth', e.target.value)} className="px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm"><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={exp.startYear} onChange={(e) => updateExperience(exp.id, 'startYear', e.target.value)} className="px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm"><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">End Date</label><div className="grid grid-cols-2 gap-2"><select value={exp.endMonth} onChange={(e) => updateExperience(exp.id, 'endMonth', e.target.value)} disabled={exp.current} className="px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm disabled:opacity-50"><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={exp.endYear} onChange={(e) => updateExperience(exp.id, 'endYear', e.target.value)} disabled={exp.current} className="px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm disabled:opacity-50"><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                  <div className="md:col-span-2"><label className="block text-gray-400 text-xs font-medium mb-2">Description & Achievements</label><textarea value={exp.description} onChange={(e) => updateExperience(exp.id, 'description', e.target.value)} placeholder="Describe your responsibilities and key achievements..." rows={3} className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600 resize-none" /></div>
                  <div className="md:col-span-2"><label className="block text-gray-400 text-xs font-medium mb-2">Skills Used</label><input type="text" value={exp.skills.join(', ')} onChange={(e) => updateExperience(exp.id, 'skills', e.target.value.split(',').map(s => s.trim()).filter(s => s))} placeholder="React, Node.js, MongoDB (comma separated)" className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Projects</h2>
              <button onClick={addProject} className="flex items-center space-x-2 bg-white text-black px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-xs font-medium"><Plus size={14} /><span>Add Project</span></button>
            </div>
            {projects.map((proj, index) => (
              <div key={proj.id} className="bg-[#000000] border border-[#2c2c2e] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-sm font-medium">Project {index + 1}</h3>
                  {projects.length > 1 && <button onClick={() => removeProject(proj.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2"><label className="block text-gray-400 text-xs font-medium mb-2">Project Name *</label><input type="text" value={proj.name} onChange={(e) => updateProject(proj.id, 'name', e.target.value)} placeholder="e.g., E-commerce Platform" className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                  <div className="md:col-span-2"><label className="block text-gray-400 text-xs font-medium mb-2">Project Description *</label><textarea value={proj.description} onChange={(e) => updateProject(proj.id, 'description', e.target.value)} placeholder="Describe the project, your role, and impact..." rows={3} className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600 resize-none" /></div>
                  <div className="md:col-span-2"><label className="block text-gray-400 text-xs font-medium mb-2">Technologies Used</label><input type="text" value={proj.technologies.join(', ')} onChange={(e) => updateProject(proj.id, 'technologies', e.target.value.split(',').map(s => s.trim()).filter(s => s))} placeholder="React, Node.js, MongoDB, etc. (comma separated)" className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">GitHub Link</label><div className="relative"><Code size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input type="url" value={proj.githubLink} onChange={(e) => updateProject(proj.id, 'githubLink', e.target.value)} placeholder="https://github.com/username/project" className="w-full pl-10 pr-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Live/Hosted Link</label><div className="relative"><LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input type="url" value={proj.liveLink} onChange={(e) => updateProject(proj.id, 'liveLink', e.target.value)} placeholder="https://yourproject.com" className="w-full pl-10 pr-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-white">Education</h2><button onClick={addEducation} className="flex items-center space-x-2 bg-white text-black px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-xs font-medium"><Plus size={14} /><span>Add Education</span></button></div>
            {education.map((edu, index) => (
              <div key={edu.id} className="bg-[#000000] border border-[#2c2c2e] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between"><h3 className="text-white text-sm font-medium">Education {index + 1}</h3>{education.length > 1 && <button onClick={() => removeEducation(edu.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Institution Name *</label><input type="text" value={edu.institution} onChange={(e) => updateEducation(edu.id, 'institution', e.target.value)} placeholder="University/College Name" className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Degree *</label><input type="text" value={edu.degree} onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)} placeholder="Bachelor's, Master's, etc." className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Field of Study *</label><input type="text" value={edu.field} onChange={(e) => updateEducation(edu.id, 'field', e.target.value)} placeholder="Computer Science, Engineering, etc." className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Location</label><input type="text" value={edu.location} onChange={(e) => updateEducation(edu.id, 'location', e.target.value)} placeholder="City, Country" className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Start Date *</label><div className="grid grid-cols-2 gap-2"><select value={edu.startMonth} onChange={(e) => updateEducation(edu.id, 'startMonth', e.target.value)} className="px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm"><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={edu.startYear} onChange={(e) => updateEducation(edu.id, 'startYear', e.target.value)} className="px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm"><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">End Date *</label><div className="grid grid-cols-2 gap-2"><select value={edu.endMonth} onChange={(e) => updateEducation(edu.id, 'endMonth', e.target.value)} className="px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm"><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={edu.endYear} onChange={(e) => updateEducation(edu.id, 'endYear', e.target.value)} className="px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm"><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">CGPA/Percentage</label><input type="text" value={edu.cgpa} onChange={(e) => updateEducation(edu.id, 'cgpa', e.target.value)} placeholder="e.g., 3.8/4.0 or 85%" className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                  <div className="md:col-span-2"><label className="block text-gray-400 text-xs font-medium mb-2">Additional Details</label><textarea value={edu.description} onChange={(e) => updateEducation(edu.id, 'description', e.target.value)} placeholder="Awards, honors, relevant coursework, activities..." rows={2} className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600 resize-none" /></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certifications Tab */}
        {activeTab === 'certifications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Certifications</h2>
              <button onClick={addCertification} className="flex items-center space-x-2 bg-white text-black px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-xs font-medium"><Plus size={14} /><span>Add Certification</span></button>
            </div>
            {certifications.map((cert, index) => (
              <div key={cert.id} className="bg-[#000000] border border-[#2c2c2e] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-sm font-medium">Certification {index + 1}</h3>
                  {certifications.length > 1 && <button onClick={() => removeCertification(cert.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Certificate Name *</label><input type="text" value={cert.name} onChange={(e) => updateCertification(cert.id, 'name', e.target.value)} placeholder="AWS Certified Solutions Architect" className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Issuing Organization *</label><input type="text" value={cert.organization} onChange={(e) => updateCertification(cert.id, 'organization', e.target.value)} placeholder="Amazon Web Services, Google, Coursera, etc." className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Issue Date</label><input type="month" value={cert.issueDate} onChange={(e) => updateCertification(cert.id, 'issueDate', e.target.value)} className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm" /></div>
                  <div><label className="block text-gray-400 text-xs font-medium mb-2">Credential URL</label><div className="relative"><LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" /><input type="url" value={cert.credentialUrl} onChange={(e) => updateCertification(cert.id, 'credentialUrl', e.target.value)} placeholder="https://credentials.example.com" className="w-full pl-10 pr-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" /></div></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Languages Tab */}
        {activeTab === 'languages' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Languages</h2>
              <button onClick={addLanguage} className="flex items-center space-x-2 bg-white text-black px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-xs font-medium"><Plus size={14} /><span>Add Language</span></button>
            </div>
            {languages.map((lang, index) => (
              <div key={lang.id} className="bg-[#000000] border border-[#2c2c2e] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white text-sm font-medium">Language {index + 1}</h3>
                  {languages.length > 1 && <button onClick={() => removeLanguage(lang.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-2">Language *</label>
                    <input type="text" value={lang.language} onChange={(e) => updateLanguage(lang.id, 'language', e.target.value)} placeholder="English, Spanish, French, Mandarin, etc." className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-2">Proficiency Level *</label>
                    <select value={lang.proficiency} onChange={(e) => updateLanguage(lang.id, 'proficiency', e.target.value)} className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm">
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Fluent">Fluent</option>
                      <option value="Native">Native Speaker</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Achievements & Awards</h2>
              <button onClick={addAchievement} className="flex items-center space-x-2 bg-white text-black px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-xs font-medium"><Plus size={14} /><span>Add Achievement</span></button>
            </div>
            {achievements.map((ach, index) => (
              <div key={ach.id} className="bg-[#000000] border border-[#2c2c2e] rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-white text-sm font-medium">Achievement {index + 1}</h3>
                  {achievements.length > 1 && <button onClick={() => removeAchievement(ach.id)} className="text-red-500 hover:text-red-400"><Trash2 size={16} /></button>}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-gray-400 text-xs font-medium mb-2">Achievement Title *</label>
                    <input type="text" value={ach.title} onChange={(e) => updateAchievement(ach.id, 'title', e.target.value)} placeholder="e.g., Hackathon Winner, Employee of the Month, Published Research" className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-400 text-xs font-medium mb-2">Description</label>
                    <textarea value={ach.description} onChange={(e) => updateAchievement(ach.id, 'description', e.target.value)} placeholder="Describe the achievement, its significance, and impact..." rows={3} className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm placeholder-gray-600 resize-none" />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-xs font-medium mb-2">Year *</label>
                    <select value={ach.year} onChange={(e) => updateAchievement(ach.id, 'year', e.target.value)} className="w-full px-3 py-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-lg focus:outline-none focus:border-white transition-colors text-white text-sm">
                      <option value="">Select year</option>
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fixed Save Button */}
      <div className="fixed bottom-8 right-8">
        <button onClick={handleSaveAll} disabled={loading} className="flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-xl hover:bg-gray-100 transition-colors shadow-lg text-sm font-medium disabled:opacity-50">
          <Save size={18} />
          <span>Save All Changes</span>
        </button>
      </div>
    </div>
  );
}