'use client';

import { useEffect, useState } from 'react';
import {
  User, MapPin, Briefcase, Code, Award, Plus, Save, Upload, X, Trash2,
  Link as LinkIcon, GraduationCap, CheckCircle2, Loader2, FileText, Sparkles,
} from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';

export default function ProfilePage() {
  const { showToast } = useGlassToast();
  const [activeTab, setActiveTab] = useState('basic');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [discoverable, setDiscoverable] = useState(false);
  const [togglingDiscoverable, setTogglingDiscoverable] = useState(false);

  const [basicInfo, setBasicInfo] = useState({
    fullName: '', email: '', phone: '', location: '',
    linkedin: '', github: '', portfolio: '', bio: '',
  });

  const [preferences, setPreferences] = useState({
    roles: [] as string[], industries: [] as string[],
    jobType: '', experience: '', expectedSalary: '', workLocationPreference: '',
  });

  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const [education, setEducation] = useState([{
    id: 1, institution: '', degree: '', field: '', location: '',
    startMonth: '', startYear: '', endMonth: '', endYear: '', cgpa: '', description: '',
  }]);

  const [experience, setExperience] = useState([{
    id: 1, company: '', role: '', location: '',
    startMonth: '', startYear: '', endMonth: '', endYear: '',
    current: false, description: '', skills: [] as string[],
  }]);

  const [projects, setProjects] = useState([{
    id: 1, name: '', description: '', technologies: [] as string[],
    githubLink: '', liveLink: '', startDate: '', endDate: '',
  }]);

  const [certifications, setCertifications] = useState([{
    id: 1, name: '', organization: '', issueDate: '', credentialUrl: '',
  }]);

  const [languages, setLanguages] = useState([{
    id: 1, language: '', proficiency: 'Beginner',
  }]);

  const [achievements, setAchievements] = useState([{
    id: 1, title: '', description: '', year: '',
  }]);

  const tabs = [
    { id: 'basic',          label: 'Basic Info',      icon: User },
    { id: 'preferences',    label: 'Job Preferences', icon: Briefcase },
    { id: 'skills',         label: 'Skills',          icon: Code },
    { id: 'experience',     label: 'Experience',      icon: Briefcase },
    { id: 'projects',       label: 'Projects',        icon: Code },
    { id: 'education',      label: 'Education',       icon: GraduationCap },
    { id: 'certifications', label: 'Certifications',  icon: Award },
    { id: 'languages',      label: 'Languages',       icon: CheckCircle2 },
    { id: 'achievements',   label: 'Achievements',    icon: Award },
  ];

  const updateEducation     = (id: number, field: string, value: any) => setEducation(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  const updateExperience    = (id: number, field: string, value: any) => setExperience(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  const updateProject       = (id: number, field: string, value: any) => setProjects(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  const updateCertification = (id: number, field: string, value: any) => setCertifications(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  const updateLanguage      = (id: number, field: string, value: any) => setLanguages(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  const updateAchievement   = (id: number, field: string, value: any) => setAchievements(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const response = await api.get('/jobseeker/profile');
        const profileData = response.data.success ? response.data.data : response.data;
        setBasicInfo({
          fullName:  profileData.fullName  || '',
          email:     profileData.email     || '',
          phone:     profileData.phone     || '',
          location:  profileData.location  || '',
          linkedin:  profileData.linkedin  || '',
          github:    profileData.github    || '',
          portfolio: profileData.portfolio || '',
          bio:       profileData.bio       || '',
        });
        setProfileImage(profileData.profilePic || null);
        setPreferences({
          roles:                  profileData.preferences?.roles                  || [],
          industries:             profileData.preferences?.industries             || [],
          jobType:                profileData.preferences?.jobType                || '',
          experience:             profileData.preferences?.experience             || '',
          expectedSalary:         profileData.preferences?.expectedSalary         || '',
          workLocationPreference: profileData.preferences?.workLocationPreference || '',
        });
        setSkills(profileData.skills || []);
        if (profileData.education?.length > 0)      setEducation(profileData.education);
        if (profileData.experience?.length > 0)     setExperience(profileData.experience);
        if (profileData.projects?.length > 0)       setProjects(profileData.projects);
        if (profileData.certifications?.length > 0) setCertifications(profileData.certifications);
        if (profileData.languages?.length > 0)      setLanguages(profileData.languages);
        if (profileData.achievements?.length > 0)   setAchievements(profileData.achievements);
        setDiscoverable(!!profileData.discoverable);
      } catch (error: any) {
        showToast('Error', error.response?.data?.error || 'Failed to load profile', 'danger');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setProfileImage(null);
    setProfileImageFile(null);
  };

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills(prev => [...prev, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (index: number) => setSkills(prev => prev.filter((_, i) => i !== index));

  const addEducation = () => setEducation(prev => [...prev, {
    id: Date.now(), institution: '', degree: '', field: '', location: '',
    startMonth: '', startYear: '', endMonth: '', endYear: '', cgpa: '', description: '',
  }]);
  const removeEducation = (id: number) => setEducation(prev => prev.filter(e => e.id !== id));

  const addExperience = () => setExperience(prev => [...prev, {
    id: Date.now(), company: '', role: '', location: '',
    startMonth: '', startYear: '', endMonth: '', endYear: '',
    current: false, description: '', skills: [],
  }]);
  const removeExperience = (id: number) => setExperience(prev => prev.filter(e => e.id !== id));

  const addProject = () => setProjects(prev => [...prev, {
    id: Date.now(), name: '', description: '', technologies: [],
    githubLink: '', liveLink: '', startDate: '', endDate: '',
  }]);
  const removeProject = (id: number) => setProjects(prev => prev.filter(p => p.id !== id));

  const addCertification = () => setCertifications(prev => [...prev, {
    id: Date.now(), name: '', organization: '', issueDate: '', credentialUrl: '',
  }]);
  const removeCertification = (id: number) => setCertifications(prev => prev.filter(c => c.id !== id));

  const addLanguage = () => setLanguages(prev => [...prev, { id: Date.now(), language: '', proficiency: 'Beginner' }]);
  const removeLanguage = (id: number) => setLanguages(prev => prev.filter(l => l.id !== id));

  const addAchievement = () => setAchievements(prev => [...prev, { id: Date.now(), title: '', description: '', year: '' }]);
  const removeAchievement = (id: number) => setAchievements(prev => prev.filter(a => a.id !== id));

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setParsing(true);
    showToast('Info', 'Parsing your resume with AI...', 'info');

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await api.post('/jobseeker/parse-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        const parsed = response.data.data;
        const info = parsed.basicInfo || parsed;
        setBasicInfo(prev => ({
          ...prev,
          fullName: info.fullName || prev.fullName,
          email: info.email || prev.email,
          phone: info.phone || prev.phone,
          location: info.location || prev.location,
          linkedin: info.linkedin || prev.linkedin,
          github: info.github || prev.github,
          portfolio: info.portfolio || prev.portfolio,
          bio: info.bio || info.summary || prev.bio,
        }));

        if (parsed.skills?.length) {
          const newSkills = parsed.skills.map((s: any) => typeof s === 'string' ? s : (s.name || s.skill || '')).filter(Boolean);
          setSkills(prev => Array.from(new Set([...prev, ...newSkills])));
        }
        if (parsed.education?.length) {
          setEducation(parsed.education.map((edu: any, index: number) => ({
            id: Date.now() + index,
            institution: edu.institution || '',
            degree: edu.degree || '',
            field: edu.field || '',
            location: edu.location || '',
            startMonth: edu.startMonth || '',
            startYear: edu.startYear || '',
            endMonth: edu.endMonth || '',
            endYear: edu.endYear || '',
            cgpa: edu.cgpa || '',
            description: edu.description || '',
          })));
        }
        if (parsed.experience?.length) {
          setExperience(parsed.experience.map((exp: any, index: number) => ({
            id: Date.now() + index,
            company: exp.company || '',
            role: exp.role || '',
            location: exp.location || '',
            startMonth: exp.startMonth || '',
            startYear: exp.startYear || '',
            endMonth: exp.endMonth || '',
            endYear: exp.endYear || '',
            current: Boolean(exp.current),
            description: exp.description || '',
            skills: Array.isArray(exp.skills) ? exp.skills : [],
          })));
        }
        if (parsed.projects?.length) {
          setProjects(parsed.projects.map((proj: any, index: number) => ({
            id: Date.now() + index,
            name: proj.name || '',
            description: proj.description || '',
            technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
            githubLink: proj.githubLink || '',
            liveLink: proj.liveLink || '',
            startDate: proj.startDate || '',
            endDate: proj.endDate || '',
          })));
        }
        if (parsed.certifications?.length) {
          setCertifications(parsed.certifications.map((cert: any, index: number) => ({
            id: Date.now() + index,
            name: typeof cert === 'string' ? cert : (cert.name || ''),
            organization: typeof cert === 'string' ? 'Accredited Issuer' : (cert.organization || cert.issuer || ''),
            issueDate: typeof cert === 'string' ? '' : (cert.issueDate || cert.year || ''),
            credentialUrl: typeof cert === 'string' ? '' : (cert.credentialUrl || cert.url || ''),
          })));
        }
        if (parsed.languages?.length) {
          setLanguages(parsed.languages.map((lang: any, index: number) => ({
            id: Date.now() + index,
            language: typeof lang === 'string' ? lang : (lang.language || lang.name || ''),
            proficiency: typeof lang === 'string' ? 'Fluent' : (lang.proficiency || 'Fluent'),
          })));
        }
        if (parsed.achievements?.length) {
          setAchievements(parsed.achievements.map((ach: any, index: number) => ({
            id: Date.now() + index,
            title: typeof ach === 'string' ? ach : (ach.title || ach.name || ''),
            description: typeof ach === 'string' ? ach : (ach.description || ''),
            year: typeof ach === 'string' ? '' : (ach.year || ''),
          })));
        }
        if (parsed.preferences) {
          setPreferences(prev => ({
            ...prev,
            roles: parsed.preferences.roles?.length ? parsed.preferences.roles : prev.roles,
            industries: parsed.preferences.industries?.length ? parsed.preferences.industries : prev.industries,
            jobType: parsed.preferences.jobType || prev.jobType,
            experience: parsed.preferences.experience || prev.experience,
            expectedSalary: parsed.preferences.expectedSalary || prev.expectedSalary,
            workLocationPreference: parsed.preferences.workLocationPreference || prev.workLocationPreference,
          }));
        }

        showToast('Success', 'CV parsed and imported successfully!', 'success');
      }
    } catch (error: any) {
      showToast('Error', error.response?.data?.error || 'Failed to parse resume. Please fill manually.', 'danger');
    } finally {
      setParsing(false);
      e.target.value = '';
    }
  };

  const handleToggleDiscoverable = async () => {
    setTogglingDiscoverable(true);
    try {
      const next = !discoverable;
      const res = await api.put('/jobseeker/profile/discoverable', { discoverable: next });
      if (res.data?.success) {
        setDiscoverable(next);
        showToast(
          next ? 'Profile Discoverable' : 'Profile Hidden',
          next
            ? 'Companies in Seeker Discovery can now view your profile and reach out!'
            : 'Your profile has been hidden from direct discovery.',
          'success'
        );
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to update discovery status', 'danger');
    } finally {
      setTogglingDiscoverable(false);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const profileData = {
        fullName:  basicInfo.fullName,
        email:     basicInfo.email,
        phone:     basicInfo.phone,
        location:  basicInfo.location,
        linkedin:  basicInfo.linkedin,
        github:    basicInfo.github,
        portfolio: basicInfo.portfolio,
        bio:       basicInfo.bio,
        profilePic: profileImage,
        preferences: {
          roles:                  preferences.roles.map(r => r.trim()).filter(Boolean),
          industries:             preferences.industries.map(i => i.trim()).filter(Boolean),
          jobType:                preferences.jobType,
          experience:             preferences.experience,
          expectedSalary:         preferences.expectedSalary,
          workLocationPreference: preferences.workLocationPreference,
        },
        skills, 
        education, 
        experience: experience.map(exp => ({ ...exp, skills: exp.skills.map(s => s.trim()).filter(Boolean) })), 
        projects: projects.map(proj => ({ ...proj, technologies: proj.technologies.map(t => t.trim()).filter(Boolean) })), 
        certifications, 
        languages, 
        achievements,
      };
      const formData = new FormData();
      formData.append('profileData', JSON.stringify(profileData));
      if (profileImageFile) formData.append('profileImage', profileImageFile);
      const response = await api.put('/jobseeker/profile', formData);
      if (response.data?.success) showToast('Success', 'Profile saved successfully!', 'success');
    } catch (error: any) {
      showToast('Error', error.response?.data?.error || error.response?.data?.message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const years  = Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-6 h-6 text-[#0071e3] animate-spin" />
        <div className="text-[#86868b] text-xs font-medium tracking-wide">Loading your workspace...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full space-y-6 text-[#1d1d1f] dark:text-[#f5f5f7] font-sans">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">
            Professional Workspace
          </h1>
          <p className="text-[#86868b] text-xs sm:text-sm font-medium mt-0.5">
            Configure your dynamic profile summary and application rules.
          </p>
        </div>
        <div className="flex items-center gap-2.5">

          {/* Import from CV */}
          <label className={`flex items-center gap-1.5 bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] px-3.5 py-2 rounded-2xl transition-all text-xs font-semibold cursor-pointer select-none shadow-xs ${parsing ? 'opacity-50 pointer-events-none' : ''}`}>
            {parsing
              ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0071e3]" />
              : <FileText className="w-3.5 h-3.5 text-[#0071e3]" />
            }
            <span>{parsing ? 'Parsing CV...' : 'Import from CV'}</span>
            <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleResumeUpload} disabled={parsing} />
          </label>

          {/* Save */}
          <button onClick={handleSaveAll} disabled={saving}
            className="flex items-center gap-1.5 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 text-white px-4 py-2 rounded-2xl transition-all shadow-[0_4px_14px_rgba(0,113,227,0.25)] text-xs font-bold cursor-pointer">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saving ? 'Saving...' : 'Save Workspace'}</span>
          </button>
        </div>
      </div>

      {/* Recruiter Discovery Status Banner */}
      <div className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)] ${
        discoverable
          ? 'bg-[#34c759]/10 border-[#34c759]/30'
          : 'bg-white dark:bg-[#1c1c1e] border-black/[0.06] dark:border-white/[0.08]'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
            discoverable ? 'bg-[#34c759] text-white' : 'bg-[#0071e3]/10 text-[#0071e3]'
          }`}>
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-[#1d1d1f] dark:text-white">Direct Recruiter Discovery</span>
              <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                discoverable
                  ? 'bg-[#34c759]/20 text-[#248a3d] dark:text-[#30d158] border border-[#34c759]/30'
                  : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b] border border-black/[0.04] dark:border-white/[0.06]'
              }`}>
                {discoverable ? 'Visible in Seeker Discovery' : 'Hidden / Private'}
              </span>
            </div>
            <p className="text-xs text-[#86868b] font-medium mt-0.5">
              {discoverable
                ? 'Your profile is visible in Seeker Discovery. Companies can find your skills and invite you directly.'
                : 'Turn this on so companies using Seeker Direct Discovery can discover your skills and invite you.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleDiscoverable}
          disabled={togglingDiscoverable}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
            discoverable
              ? 'bg-[#34c759] hover:bg-[#2db84d] text-white shadow-xs'
              : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] border border-black/[0.04] dark:border-white/[0.06] text-[#1d1d1f] dark:text-white'
          }`}
        >
          {togglingDiscoverable ? 'Updating...' : discoverable ? 'Active (Turn Off)' : 'Turn On Discovery'}
        </button>
      </div>

      {/* Parsing overlay banner */}
      {parsing && (
        <div className="flex items-center gap-3 bg-[#0071e3]/10 border border-[#0071e3]/20 rounded-2xl px-4 py-3">
          <Loader2 className="w-4 h-4 text-[#0071e3] animate-spin flex-shrink-0" />
          <div>
            <p className="text-[#0071e3] text-xs font-bold">Parsing your CV with AI...</p>
            <p className="text-[#86868b] text-[11px] mt-0.5">Extracting details and updating fields automatically.</p>
          </div>
        </div>
      )}

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

        {/* Left Tab Nav (Apple minimalist container) */}
        <div className="md:col-span-1 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-2 md:sticky md:top-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl transition-all text-left whitespace-nowrap text-xs font-semibold w-full cursor-pointer ${
                    isSelected
                      ? 'bg-[#0071e3]/10 text-[#0071e3] font-bold dark:bg-[#0071e3]/20'
                      : 'text-[#86868b] hover:text-[#1d1d1f] hover:bg-[#f2f2f7] dark:hover:text-white dark:hover:bg-[#2c2c2e]'
                  }`}>
                  <Icon size={15} className={isSelected ? 'text-[#0071e3]' : 'text-[#86868b]'} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Panel (Apple elevated card) */}
        <div className="md:col-span-3 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.03)] min-h-[480px]">

          {/* ── BASIC INFO ── */}
          {activeTab === 'basic' && (
            <div className="space-y-6 animate-in fade-in-40 duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-5 border-b border-black/[0.06] dark:border-white/[0.08]">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-2xl bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] flex items-center justify-center overflow-hidden">
                    {profileImage
                      ? <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                      : <User size={24} className="text-[#86868b]" />
                    }
                  </div>
                  <label className="absolute -bottom-1.5 -right-1.5 bg-[#0071e3] text-white p-1.5 rounded-full cursor-pointer hover:bg-[#0077ed] transition-colors shadow-xs">
                    <Upload size={12} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
                <div>
                  <h3 className="text-[#1d1d1f] dark:text-white text-xs font-bold">Avatar Presentation</h3>
                  <p className="text-[#86868b] text-xs mt-0.5">Square or circular canvas formats up to 4MB.</p>
                  {profileImage && (
                    <button onClick={removePhoto} className="text-[#ff3b30] text-xs font-semibold hover:underline mt-1 block cursor-pointer">Remove Photo</button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Full Name *</label>
                  <input type="text" value={basicInfo.fullName} onChange={e => setBasicInfo({ ...basicInfo, fullName: e.target.value })} placeholder="John Doe" className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Email Address *</label>
                  <input type="email" value={basicInfo.email} onChange={e => setBasicInfo({ ...basicInfo, email: e.target.value })} placeholder="john@example.com" className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Phone Network</label>
                  <input type="tel" value={basicInfo.phone} onChange={e => setBasicInfo({ ...basicInfo, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Geographic Location *</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
                    <input type="text" value={basicInfo.location} onChange={e => setBasicInfo({ ...basicInfo, location: e.target.value })} placeholder="San Francisco, CA" className="w-full pl-9 pr-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">LinkedIn Profile</label>
                  <div className="relative">
                    <LinkIcon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
                    <input type="url" value={basicInfo.linkedin} onChange={e => setBasicInfo({ ...basicInfo, linkedin: e.target.value })} placeholder="https://linkedin.com/in/username" className="w-full pl-9 pr-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">GitHub Profile</label>
                  <div className="relative">
                    <Code size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
                    <input type="url" value={basicInfo.github} onChange={e => setBasicInfo({ ...basicInfo, github: e.target.value })} placeholder="https://github.com/username" className="w-full pl-9 pr-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Personal Portfolio</label>
                  <div className="relative">
                    <LinkIcon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
                    <input type="url" value={basicInfo.portfolio} onChange={e => setBasicInfo({ ...basicInfo, portfolio: e.target.value })} placeholder="https://yourportfolio.com" className="w-full pl-9 pr-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium" />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Executive Summary</label>
                  <textarea value={basicInfo.bio} onChange={e => setBasicInfo({ ...basicInfo, bio: e.target.value })} placeholder="Brief outline detailing your professional background and core strengths..." rows={3} className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium resize-none leading-relaxed" />
                </div>
              </div>
            </div>
          )}

          {/* ── JOB PREFERENCES ── */}
          {activeTab === 'preferences' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white mb-3">Job Preference Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Target Roles</label>
                  <input type="text" placeholder="Software Engineer, Product Manager" value={preferences.roles.join(',')} onChange={e => setPreferences({ ...preferences, roles: e.target.value.split(',') })} className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium" />
                  <p className="text-[#86868b] text-[10px] mt-1">Separate roles with commas.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Preferred Industries</label>
                  <input type="text" placeholder="Technology, Healthcare, Finance" value={preferences.industries.join(',')} onChange={e => setPreferences({ ...preferences, industries: e.target.value.split(',') })} className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Job Type</label>
                  <select value={preferences.jobType} onChange={e => setPreferences({ ...preferences, jobType: e.target.value })} className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium cursor-pointer">
                    <option value="">Select employment type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="freelance">Freelance</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Experience Level</label>
                  <select value={preferences.experience} onChange={e => setPreferences({ ...preferences, experience: e.target.value })} className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium cursor-pointer">
                    <option value="">Select experience level</option>
                    <option value="entry">Entry Level (0-2 Years)</option>
                    <option value="mid">Mid Level (2-5 Years)</option>
                    <option value="senior">Senior Level (5-10 Years)</option>
                    <option value="lead">Lead / Principal (10+ Years)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Expected Compensation</label>
                  <input type="text" placeholder="e.g., $100,000 - $150,000" value={preferences.expectedSalary} onChange={e => setPreferences({ ...preferences, expectedSalary: e.target.value })} className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Work Location Preference</label>
                  <select value={preferences.workLocationPreference} onChange={e => setPreferences({ ...preferences, workLocationPreference: e.target.value })} className="w-full px-4 py-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium cursor-pointer">
                    <option value="">Select workplace preference</option>
                    <option value="remote">Fully Remote</option>
                    <option value="onsite">On-Site Office</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ── SKILLS ── */}
          {activeTab === 'skills' && (
            <div className="space-y-5 animate-in fade-in-40 duration-200">
              <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Skills &amp; Competencies</h2>
              <div className="bg-[#f2f2f7]/60 dark:bg-[#2c2c2e]/60 p-4 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Add New Skill</label>
                <div className="flex gap-2">
                  <input type="text" value={newSkill} onChange={e => setNewSkill(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSkill()} placeholder="Type skill name (e.g. TypeScript)..." className="flex-1 px-4 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium" />
                  <button onClick={addSkill} className="px-4 py-2 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl transition-all text-xs font-bold shadow-xs cursor-pointer">Add</button>
                </div>
              </div>
              {skills.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-[#86868b] text-xs font-bold uppercase tracking-wider">Active Skills ({skills.length})</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill, index) => (
                      <div key={index} className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] pl-3 pr-2 py-1.5 rounded-xl flex items-center gap-2 text-xs text-[#1d1d1f] dark:text-[#f5f5f7] font-medium">
                        <span>{skill}</span>
                        <button onClick={() => removeSkill(index)} className="text-[#86868b] hover:text-[#ff3b30] transition-colors p-0.5 rounded cursor-pointer"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── EXPERIENCE ── */}
          {activeTab === 'experience' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Work Experience</h2>
                <button onClick={addExperience} className="flex items-center gap-1 bg-[#0071e3]/10 hover:bg-[#0071e3]/20 text-[#0071e3] px-3 py-1.5 rounded-xl transition-all text-xs font-bold cursor-pointer"><Plus size={13} /><span>Add Experience</span></button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {experience.map((exp, index) => (
                  <div key={exp.id} className="bg-[#f2f2f7]/60 dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-white dark:bg-[#1c1c1e] px-2.5 py-1 border border-black/[0.06] dark:border-white/[0.08] text-[#86868b] font-bold rounded-lg uppercase">POSITION #{index + 1}</span>
                      {experience.length > 1 && <button onClick={() => removeExperience(exp.id)} className="text-[#86868b] hover:text-[#ff3b30] transition-colors cursor-pointer"><Trash2 size={15} /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Company Name *</label><input type="text" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} placeholder="Company Name" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Job Title *</label><input type="text" value={exp.role} onChange={e => updateExperience(exp.id, 'role', e.target.value)} placeholder="e.g. Senior Developer" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Location</label><input type="text" value={exp.location} onChange={e => updateExperience(exp.id, 'location', e.target.value)} placeholder="City, Country" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div className="flex items-center gap-2 pt-6"><input type="checkbox" id={`current-${exp.id}`} checked={exp.current} onChange={e => updateExperience(exp.id, 'current', e.target.checked)} className="w-4 h-4 rounded accent-[#0071e3]" /><label htmlFor={`current-${exp.id}`} className="text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium select-none cursor-pointer">I currently work here</label></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Start Date *</label><div className="grid grid-cols-2 gap-2"><select value={exp.startMonth} onChange={e => updateExperience(exp.id, 'startMonth', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium"><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={exp.startYear} onChange={e => updateExperience(exp.id, 'startYear', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium"><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">End Date</label><div className="grid grid-cols-2 gap-2"><select value={exp.endMonth} onChange={e => updateExperience(exp.id, 'endMonth', e.target.value)} disabled={exp.current} className="w-full px-3 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium disabled:opacity-40"><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={exp.endYear} onChange={e => updateExperience(exp.id, 'endYear', e.target.value)} disabled={exp.current} className="w-full px-3 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium disabled:opacity-40"><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                      <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Responsibilities &amp; Achievements</label><textarea value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)} placeholder="Describe key achievements and responsibilities..." rows={3} className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] resize-none leading-relaxed" /></div>
                      <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Skills Used</label><input type="text" value={exp.skills.join(',')} onChange={e => updateExperience(exp.id, 'skills', e.target.value.split(','))} placeholder="React, Node.js (comma separated)" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PROJECTS ── */}
          {activeTab === 'projects' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Projects</h2>
                <button onClick={addProject} className="flex items-center gap-1 bg-[#0071e3]/10 hover:bg-[#0071e3]/20 text-[#0071e3] px-3 py-1.5 rounded-xl transition-all text-xs font-bold cursor-pointer"><Plus size={13} /><span>Add Project</span></button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {projects.map((proj, index) => (
                  <div key={proj.id} className="bg-[#f2f2f7]/60 dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-white dark:bg-[#1c1c1e] px-2.5 py-1 border border-black/[0.06] dark:border-white/[0.08] text-[#86868b] font-bold rounded-lg uppercase">PROJECT #{index + 1}</span>
                      {projects.length > 1 && <button onClick={() => removeProject(proj.id)} className="text-[#86868b] hover:text-[#ff3b30] transition-colors cursor-pointer"><Trash2 size={15} /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Project Name *</label><input type="text" value={proj.name} onChange={e => updateProject(proj.id, 'name', e.target.value)} placeholder="e.g. Distributed Cloud Platform" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Project Description *</label><textarea value={proj.description} onChange={e => updateProject(proj.id, 'description', e.target.value)} placeholder="Explain the project architecture and features..." rows={3} className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] resize-none leading-relaxed" /></div>
                      <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Technologies Used</label><input type="text" value={proj.technologies.join(',')} onChange={e => updateProject(proj.id, 'technologies', e.target.value.split(','))} placeholder="Next.js, TypeScript, PostgreSQL (comma separated)" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">GitHub URL</label><div className="relative"><Code size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" /><input type="url" value={proj.githubLink} onChange={e => updateProject(proj.id, 'githubLink', e.target.value)} placeholder="https://github.com/..." className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Live Demo URL</label><div className="relative"><LinkIcon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" /><input type="url" value={proj.liveLink} onChange={e => updateProject(proj.id, 'liveLink', e.target.value)} placeholder="https://..." className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── EDUCATION ── */}
          {activeTab === 'education' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Education</h2>
                <button onClick={addEducation} className="flex items-center gap-1 bg-[#0071e3]/10 hover:bg-[#0071e3]/20 text-[#0071e3] px-3 py-1.5 rounded-xl transition-all text-xs font-bold cursor-pointer"><Plus size={13} /><span>Add Education</span></button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {education.map((edu, index) => (
                  <div key={edu.id} className="bg-[#f2f2f7]/60 dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-white dark:bg-[#1c1c1e] px-2.5 py-1 border border-black/[0.06] dark:border-white/[0.08] text-[#86868b] font-bold rounded-lg uppercase">EDUCATION #{index + 1}</span>
                      {education.length > 1 && <button onClick={() => removeEducation(edu.id)} className="text-[#86868b] hover:text-[#ff3b30] transition-colors cursor-pointer"><Trash2 size={15} /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Institution *</label><input type="text" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} placeholder="University Name" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Degree *</label><input type="text" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} placeholder="B.Tech, B.S., M.S." className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Field of Study *</label><input type="text" value={edu.field} onChange={e => updateEducation(edu.id, 'field', e.target.value)} placeholder="Computer Science" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Location</label><input type="text" value={edu.location} onChange={e => updateEducation(edu.id, 'location', e.target.value)} placeholder="City, Country" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Start Year *</label><div className="grid grid-cols-2 gap-2"><select value={edu.startMonth} onChange={e => updateEducation(edu.id, 'startMonth', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium"><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={edu.startYear} onChange={e => updateEducation(edu.id, 'startYear', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium"><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">End Year (or Expected) *</label><div className="grid grid-cols-2 gap-2"><select value={edu.endMonth} onChange={e => updateEducation(edu.id, 'endMonth', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium"><option value="">Month</option>{months.map(m => <option key={m} value={m}>{m}</option>)}</select><select value={edu.endYear} onChange={e => updateEducation(edu.id, 'endYear', e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium"><option value="">Year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">CGPA / Percentage</label><input type="text" value={edu.cgpa} onChange={e => updateEducation(edu.id, 'cgpa', e.target.value)} placeholder="e.g. 3.8 / 4.0" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Description / Highlights</label><textarea value={edu.description} onChange={e => updateEducation(edu.id, 'description', e.target.value)} placeholder="Academic achievements, thesis, coursework..." rows={3} className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] resize-none leading-relaxed" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CERTIFICATIONS ── */}
          {activeTab === 'certifications' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Certifications</h2>
                <button onClick={addCertification} className="flex items-center gap-1 bg-[#0071e3]/10 hover:bg-[#0071e3]/20 text-[#0071e3] px-3 py-1.5 rounded-xl transition-all text-xs font-bold cursor-pointer"><Plus size={13} /><span>Add Certification</span></button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {certifications.map((cert, index) => (
                  <div key={cert.id} className="bg-[#f2f2f7]/60 dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-white dark:bg-[#1c1c1e] px-2.5 py-1 border border-black/[0.06] dark:border-white/[0.08] text-[#86868b] font-bold rounded-lg uppercase">CERTIFICATE #{index + 1}</span>
                      {certifications.length > 1 && <button onClick={() => removeCertification(cert.id)} className="text-[#86868b] hover:text-[#ff3b30] transition-colors cursor-pointer"><Trash2 size={15} /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Certificate Name *</label><input type="text" value={cert.name} onChange={e => updateCertification(cert.id, 'name', e.target.value)} placeholder="AWS Solutions Architect" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Issuing Organization *</label><input type="text" value={cert.organization} onChange={e => updateCertification(cert.id, 'organization', e.target.value)} placeholder="Amazon Web Services" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Issue Date</label><input type="month" value={cert.issueDate} onChange={e => updateCertification(cert.id, 'issueDate', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3]" /></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Credential URL</label><div className="relative"><LinkIcon size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" /><input type="url" value={cert.credentialUrl} onChange={e => updateCertification(cert.id, 'credentialUrl', e.target.value)} placeholder="https://..." className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── LANGUAGES ── */}
          {activeTab === 'languages' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Languages</h2>
                <button onClick={addLanguage} className="flex items-center gap-1 bg-[#0071e3]/10 hover:bg-[#0071e3]/20 text-[#0071e3] px-3 py-1.5 rounded-xl transition-all text-xs font-bold cursor-pointer"><Plus size={13} /><span>Add Language</span></button>
              </div>
              <div className="space-y-3">
                {languages.map((lang) => (
                  <div key={lang.id} className="bg-[#f2f2f7]/60 dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Language *</label>
                        <input type="text" value={lang.language} onChange={e => updateLanguage(lang.id, 'language', e.target.value)} placeholder="English, Spanish..." className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Proficiency *</label>
                        <select value={lang.proficiency} onChange={e => updateLanguage(lang.id, 'proficiency', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium cursor-pointer">
                          <option value="Beginner">Beginner / Elementary</option>
                          <option value="Intermediate">Intermediate / Working</option>
                          <option value="Advanced">Advanced / Professional</option>
                          <option value="Fluent">Fluent</option>
                          <option value="Native">Native / Bilingual</option>
                        </select>
                      </div>
                    </div>
                    {languages.length > 1 && (
                      <div className="flex items-center justify-end pt-2 sm:pt-6">
                        <button onClick={() => removeLanguage(lang.id)} className="text-[#86868b] hover:text-[#ff3b30] transition-colors p-2 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl cursor-pointer"><Trash2 size={15} /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ACHIEVEMENTS ── */}
          {activeTab === 'achievements' && (
            <div className="space-y-4 animate-in fade-in-40 duration-200">
              <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
                <h2 className="text-sm font-bold text-[#1d1d1f] dark:text-white">Honors &amp; Awards</h2>
                <button onClick={addAchievement} className="flex items-center gap-1 bg-[#0071e3]/10 hover:bg-[#0071e3]/20 text-[#0071e3] px-3 py-1.5 rounded-xl transition-all text-xs font-bold cursor-pointer"><Plus size={13} /><span>Add Award</span></button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {achievements.map((ach, index) => (
                  <div key={ach.id} className="bg-[#f2f2f7]/60 dark:bg-[#2c2c2e]/60 border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] bg-white dark:bg-[#1c1c1e] px-2.5 py-1 border border-black/[0.06] dark:border-white/[0.08] text-[#86868b] font-bold rounded-lg uppercase">AWARD #{index + 1}</span>
                      {achievements.length > 1 && <button onClick={() => removeAchievement(ach.id)} className="text-[#86868b] hover:text-[#ff3b30] transition-colors cursor-pointer"><Trash2 size={15} /></button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Award Title *</label><input type="text" value={ach.title} onChange={e => updateAchievement(ach.id, 'title', e.target.value)} placeholder="e.g. First Place in National Hackathon" className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] transition-colors" /></div>
                      <div className="sm:col-span-2"><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Description</label><textarea value={ach.description} onChange={e => updateAchievement(ach.id, 'description', e.target.value)} placeholder="Describe the achievement and impact..." rows={3} className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium focus:outline-none focus:border-[#0071e3] resize-none leading-relaxed" /></div>
                      <div><label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Year *</label><select value={ach.year} onChange={e => updateAchievement(ach.id, 'year', e.target.value)} className="w-full px-4 py-2.5 bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium cursor-pointer"><option value="">Select year</option>{years.map(y => <option key={y} value={y}>{y}</option>)}</select></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}