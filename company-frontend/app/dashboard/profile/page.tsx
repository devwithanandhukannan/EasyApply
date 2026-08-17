'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/app/lib/axios';
import { 
  Building2, Save, Plus, Trash2, X, Users, Shield, 
  Mail, Phone, Lock, Upload, Check, AlertCircle, Sun, Moon
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { useTheme } from '@/app/lib/theme';

type TabState = 'identity' | 'security' | 'team';

interface Employee {
  id: string;
  roles: number;
  status: 'active' | 'invited' | 'disabled';
  user: {
    id: string;
    mobileNumber: string;
  };
}

export default function CompleteCompanyProfile() {
  const { showToast } = useGlassToast();
  const { mode, setMode } = useTheme();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<TabState>('identity');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // ─── BASIC FIELDS ───
  const [companyId, setCompanyId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  // ─── EXTENDED FIELDS ───
  const [tagline, setTagline] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [corporateLink, setCorporateLink] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [seoKeywords, setSeoKeywords] = useState<string[]>([]);
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [gallery, setGallery] = useState<string[]>([]);
  const [products, setProducts] = useState<{ name: string; link: string }[]>([]);
  const [officeLocations, setOfficeLocations] = useState<{ city: string; address: string; isHub: boolean }[]>([]);
  const [socialMedia, setSocialMedia] = useState<any>({});

  // ─── SECURITY TAB STATES ───
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Mobile change
  const [newMobile, setNewMobile] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [mobileOtpSent, setMobileOtpSent] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  // ─── TEAM ───
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Temporary builders
  const [newService, setNewService] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newProduct, setNewProduct] = useState({ name: '', link: '' });
  const [newLocation, setNewLocation] = useState({ city: '', address: '', isHub: false });

  // ─── FETCH PROFILE ───
const loadProfile = async (silent = false) => {
  if (!silent) setFetching(true);
  try {
    const res = await axios.get('/company/me');
    if (res.data?.success && res.data?.data) {
      const comp = res.data.data;
      setCompanyId(comp.id || '');
      setCompanyName(comp.name || '');
      setCompanyEmail(comp.email || '');
      setMobileNumber(comp.mobileNumber || '');
      setIndustry(comp.industry || '');
      setSize(comp.size || '');
      setRegistrationNumber(comp.registrationNumber || '');
      setLogoUrl(comp.logoUrl || null);
      setTagline(comp.tagline || '');
      setYoutubeLink(comp.youtubeLink || '');
      setCorporateLink(comp.corporateLink || '');
      setServices(Array.isArray(comp.services) ? comp.services : []);
      setSeoKeywords(Array.isArray(comp.seoKeywords) ? comp.seoKeywords : []);
      setCoreValues(Array.isArray(comp.coreValues) ? comp.coreValues : []);
      setGallery(Array.isArray(comp.gallery) ? comp.gallery : []);
      setProducts(Array.isArray(comp.products) ? comp.products : []); // ✅ FIX
      setOfficeLocations(Array.isArray(comp.officeLocations) ? comp.officeLocations : []);
      setSocialMedia(comp.socialMedia || {});
      setEmployees(Array.isArray(comp.teamMembers) ? comp.teamMembers : []);
    }
  } catch (err) {
    console.error('Failed to fetch profile:', err);
    showToast('Error', 'Could not load profile', 'danger');
  } finally {
    if (!silent) setFetching(false);
  }
};

  useEffect(() => {
    loadProfile();
  }, []);

  // ─── UPDATE BASIC PROFILE ───
  const handleBasicProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: companyName.trim(),
      industry,
      size,
      registrationNumber,
      tagline: tagline.trim(),
      services,
      products,
      seoKeywords,
      coreValues,
      gallery,
      youtubeLink: youtubeLink.trim(),
      officeLocations,
      socialMedia,
      corporateLink: corporateLink.trim()
    };

    try {
      const response = await axios.patch('/company/profile', payload);
      if (response.data.success) {
        showToast('Success', 'Profile updated successfully', 'success');
        await loadProfile(true);
      }
    } catch (error: any) {
      showToast('Error', error.response?.data?.message || 'Update failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ─── UPDATE PASSWORD ───
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword || !newPassword) {
      showToast('Error', 'All password fields required', 'danger');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Error', 'New passwords do not match', 'danger');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Error', 'Password must be at least 6 characters', 'danger');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.patch('/company/profile/password', {
        currentPassword,
        newPassword
      });

      if (res.data.success) {
        showToast('Success', 'Password updated', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      showToast('Error', error.response?.data?.message || 'Password update failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ─── UPDATE LOGO ───
  const handleLogoUpdate = async () => {
    if (!logoFile) {
      showToast('Error', 'Please select a logo file', 'danger');
      return;
    }

    const formData = new FormData();
    formData.append('logo', logoFile);

    setLoading(true);
    try {
      const res = await axios.patch('/company/profile/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        showToast('Success', 'Logo updated', 'success');
        setLogoUrl(res.data.logoUrl);
        setLogoFile(null);
        setLogoPreview(null);
      }
    } catch (error: any) {
      showToast('Error', error.response?.data?.message || 'Logo update failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // ─── MOBILE CHANGE ───
  const handleRequestMobileOtp = async () => {
    if (!newMobile || !/^\d{10}$/.test(newMobile)) {
      showToast('Error', 'Enter valid 10-digit mobile', 'danger');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/company/profile/mobile/request-otp', { newMobileNumber: newMobile });
      if (res.data.success) {
        showToast('Success', 'OTP sent to new mobile', 'success');
        setMobileOtpSent(true);
      }
    } catch (error: any) {
      showToast('Error', error.response?.data?.message || 'OTP request failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMobileOtp = async () => {
    if (!mobileOtp) {
      showToast('Error', 'Enter OTP', 'danger');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/company/profile/mobile/verify-otp', { otp: mobileOtp });
      if (res.data.success) {
        showToast('Success', 'Mobile number updated', 'success');
        setMobileNumber(res.data.newMobileNumber);
        setNewMobile('');
        setMobileOtp('');
        setMobileOtpSent(false);
      }
    } catch (error: any) {
      showToast('Error', error.response?.data?.message || 'Verification failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ─── EMAIL CHANGE ───
  const handleRequestEmailOtp = async () => {
    if (!newEmail || !/\S+@\S+\.\S+/.test(newEmail)) {
      showToast('Error', 'Enter valid email', 'danger');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/company/profile/email/request-otp', { newEmail });
      if (res.data.success) {
        showToast('Success', 'OTP sent to new email', 'success');
        setEmailOtpSent(true);
      }
    } catch (error: any) {
      showToast('Error', error.response?.data?.message || 'OTP request failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtp) {
      showToast('Error', 'Enter OTP', 'danger');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('/company/profile/email/verify-otp', { newEmail, otp: emailOtp });
      if (res.data.success) {
        showToast('Success', 'Email updated', 'success');
        setCompanyEmail(res.data.newEmail);
        setNewEmail('');
        setEmailOtp('');
        setEmailOtpSent(false);
      }
    } catch (error: any) {
      showToast('Error', error.response?.data?.message || 'Verification failed', 'danger');
    } finally {
      setLoading(false);
    }
  };

  // ─── ARRAY HELPERS ───
  const appendItem = (setter: any, current: any, input: string, inputSetter: any) => {
    if (!input.trim()) return;
    setter([...current, input.trim()]);
    inputSetter('');
  };

  const removeItem = (setter: any, current: any, idx: number) => {
    setter(current.filter((_: any, i: number) => i !== idx));
  };

  if (fetching) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-zinc-400 text-xs">
        Loading profile...
      </div>
    );
  }

  return (
    <main className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      
      {/* ─── APPLE HEADER & SEGMENTED TABS ─── */}
      <header className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#0071e3] text-xs font-semibold uppercase tracking-wider mb-1">
              <Building2 className="w-3.5 h-3.5" /> Company Settings
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7]">Profile Management</h1>
            <p className="text-xs text-[#86868b] mt-0.5">Manage your corporate identity, branding, and workspace credentials</p>
          </div>

          {/* Theme Mode Toggle Pill */}
          <div className="inline-flex p-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setMode('dark');
                showToast('Theme Updated', 'Dark mode activated', 'info');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === 'dark'
                  ? 'bg-black text-white shadow-sm'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('light');
                showToast('Theme Updated', 'Light mode activated', 'info');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                mode === 'light'
                  ? 'bg-white text-[#1d1d1f] shadow-sm'
                  : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
          </div>
        </div>

        {/* APPLE SEGMENTED TAB SWITCHER */}
        <div className="flex gap-1.5 mt-6 p-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl max-w-md">
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-xs transition-all ${
              activeTab === 'identity' 
                ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm' 
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Identity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-xs transition-all ${
              activeTab === 'security' 
                ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm' 
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Security
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-xs transition-all ${
              activeTab === 'team' 
                ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-sm' 
                : 'text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Team
          </button>
        </div>
      </header>

      {/* ─── TAB 1: IDENTITY ─── */}
      {activeTab === 'identity' && (
        <form onSubmit={handleBasicProfileUpdate} className="space-y-6">
          
          {/* CARD 1: PRIMARY DETAILS */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 md:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Primary Details</h3>
              <p className="text-xs text-[#86868b]">Core business registration and identifier info</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Company Name</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Industry</label>
                <input 
                  type="text" 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Technology, Healthcare"
                  className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Company Size</label>
                <input 
                  type="text" 
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 10-50, 50-200"
                  className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Registration Number</label>
                <input 
                  type="text" 
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="CIN / Business Registration ID"
                  className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Tagline</label>
              <input 
                type="text" 
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="One-line company mission or slogan"
                className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">Corporate Website</label>
                <input 
                  type="url" 
                  value={corporateLink}
                  onChange={(e) => setCorporateLink(e.target.value)}
                  placeholder="https://company.io"
                  className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">YouTube / Overview Video</label>
                <input 
                  type="url" 
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all font-medium"
                />
              </div>
            </div>
          </div>

          {/* CARD 2: SERVICES & SEO */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 md:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Services &amp; Discovery Tags</h3>
              <p className="text-xs text-[#86868b]">Help candidates find you based on domain tags and competencies</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">Services Offered</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newService} 
                    onChange={(e) => setNewService(e.target.value)} 
                    placeholder="e.g. Cloud Infrastructure"
                    className="flex-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 font-medium"
                  />
                  <button 
                    type="button" 
                    onClick={() => appendItem(setServices, services, newService, setNewService)} 
                    className="px-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-semibold flex items-center justify-center cursor-pointer shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4"/>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {services.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-[#0071e3]/10 dark:bg-[#0071e3]/20 border border-[#0071e3]/25 text-[#0071e3] dark:text-[#47a0ff] pl-3 pr-2 py-1 rounded-full text-xs font-semibold">
                      {s} 
                      <X className="w-3.5 h-3.5 cursor-pointer hover:opacity-75" onClick={() => removeItem(setServices, services, i)}/>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">SEO Keywords</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newKeyword} 
                    onChange={(e) => setNewKeyword(e.target.value)} 
                    placeholder="e.g. FinTech, AI, SaaS"
                    className="flex-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 font-medium"
                  />
                  <button 
                    type="button" 
                    onClick={() => appendItem(setSeoKeywords, seoKeywords, newKeyword, setNewKeyword)} 
                    className="px-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-semibold flex items-center justify-center cursor-pointer shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4"/>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {seoKeywords.map((k, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 bg-[#5856d6]/10 dark:bg-[#5856d6]/20 border border-[#5856d6]/25 text-[#5856d6] dark:text-[#a29bfe] pl-3 pr-2 py-1 rounded-full text-xs font-semibold">
                      {k} 
                      <X className="w-3.5 h-3.5 cursor-pointer hover:opacity-75" onClick={() => removeItem(setSeoKeywords, seoKeywords, i)}/>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: CORE VALUES & GALLERY */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 md:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Culture &amp; Workplace Gallery</h3>
              <p className="text-xs text-[#86868b]">Highlight your corporate culture and workplace environment</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">Core Values</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={newValue} 
                    onChange={(e) => setNewValue(e.target.value)} 
                    placeholder="e.g. Radical Transparency"
                    className="flex-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 font-medium"
                  />
                  <button 
                    type="button" 
                    onClick={() => appendItem(setCoreValues, coreValues, newValue, setNewValue)} 
                    className="px-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-semibold flex items-center justify-center cursor-pointer shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4"/>
                  </button>
                </div>
                <ul className="space-y-2 pt-1">
                  {coreValues.map((v, i) => (
                    <li key={i} className="flex items-center justify-between bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] px-4 py-2.5 rounded-xl text-xs font-medium text-[#1d1d1f] dark:text-[#f5f5f7]">
                      <span>{v}</span>
                      <Trash2 className="w-4 h-4 text-[#86868b] hover:text-[#ff3b30] cursor-pointer transition-colors" onClick={() => removeItem(setCoreValues, coreValues, i)}/>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">Gallery Image URLs</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    value={newImageUrl} 
                    onChange={(e) => setNewImageUrl(e.target.value)} 
                    placeholder="https://..."
                    className="flex-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 font-medium"
                  />
                  <button 
                    type="button" 
                    onClick={() => appendItem(setGallery, gallery, newImageUrl, setNewImageUrl)} 
                    className="px-4 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl font-semibold flex items-center justify-center cursor-pointer shadow-sm transition-all"
                  >
                    <Plus className="w-4 h-4"/>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-1">
                  {gallery.map((img, i) => (
                    <div key={i} className="relative group rounded-2xl overflow-hidden border border-black/[0.06] dark:border-white/[0.08] h-20 bg-[#f2f2f7] dark:bg-[#2c2c2e]">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => removeItem(setGallery, gallery, i)} className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4 text-white"/>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 4: PRODUCTS */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 md:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Featured Products &amp; Solutions</h3>
              <p className="text-xs text-[#86868b]">Products or services your engineering teams build</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input 
                type="text" 
                placeholder="Product Name" 
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] font-medium"
              />
              <input 
                type="url" 
                placeholder="Product URL / Docs Link" 
                value={newProduct.link}
                onChange={(e) => setNewProduct({ ...newProduct, link: e.target.value })}
                className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] font-medium"
              />
              <button 
                type="button" 
                onClick={() => {
                  if (!newProduct.name || !newProduct.link) return;
                  setProducts([...products, newProduct]);
                  setNewProduct({ name: '', link: '' });
                }}
                className="bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Plus className="w-4 h-4"/> Add Product
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {products.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-[#f2f2f7] dark:bg-[#2c2c2e] p-4 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
                  <div>
                    <p className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">{p.name}</p>
                    <p className="text-xs text-[#86868b] truncate max-w-[220px]">{p.link}</p>
                  </div>
                  <Trash2 className="w-4 h-4 text-[#86868b] hover:text-[#ff3b30] cursor-pointer transition-colors" onClick={() => removeItem(setProducts, products, i)}/>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 5: OFFICE LOCATIONS */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 md:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
            <div>
              <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Office Locations &amp; Hubs</h3>
              <p className="text-xs text-[#86868b]">Physical workspaces, branch offices, and regional tech hubs</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input 
                type="text" 
                placeholder="City (e.g. San Francisco)" 
                value={newLocation.city}
                onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] font-medium"
              />
              <input 
                type="text" 
                placeholder="Complete Address" 
                value={newLocation.address}
                onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 sm:col-span-2 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] font-medium"
              />
              <div className="flex items-center justify-between bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3">
                <span className="text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase">Headquarters</span>
                <input 
                  type="checkbox" 
                  checked={newLocation.isHub} 
                  onChange={(e) => setNewLocation({ ...newLocation, isHub: e.target.checked })}
                  className="w-4 h-4 accent-[#0071e3] rounded"
                />
              </div>
            </div>
            
            <button 
              type="button" 
              onClick={() => {
                if (!newLocation.city || !newLocation.address) return;
                setOfficeLocations([...officeLocations, newLocation]);
                setNewLocation({ city: '', address: '', isHub: false });
              }}
              className="w-full bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl py-3 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4"/> Add Location
            </button>
            
            <div className="space-y-3 pt-2">
              {officeLocations.map((loc, i) => (
                <div key={i} className="flex items-center justify-between bg-[#f2f2f7] dark:bg-[#2c2c2e] p-4 rounded-2xl border border-black/[0.04] dark:border-white/[0.06]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">{loc.city}</span>
                      {loc.isHub && <span className="bg-[#0071e3] text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">HQ</span>}
                    </div>
                    <p className="text-xs text-[#86868b] mt-0.5">{loc.address}</p>
                  </div>
                  <Trash2 className="w-4 h-4 text-[#86868b] hover:text-[#ff3b30] cursor-pointer transition-colors" onClick={() => removeItem(setOfficeLocations, officeLocations, i)}/>
                </div>
              ))}
            </div>
          </div>

          {/* SAVE BUTTON BAR */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <button 
              type="button" 
              onClick={() => router.push('/dashboard')} 
              className="px-6 py-3 bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] rounded-2xl font-semibold transition-all cursor-pointer text-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.3)] disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all text-sm"
            >
              <Save className="w-4 h-4" /> {loading ? 'Saving Changes...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 2: SECURITY ─── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          
          {/* CURRENT CREDENTIALS */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 md:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Current Linked Credentials</h3>
              <p className="text-xs text-[#86868b]">Authenticated corporate identifier accounts</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-2 text-[#0071e3] mb-1.5">
                  <Mail className="w-4 h-4" />
                  <span className="uppercase text-[11px] font-bold tracking-wider">Official Email</span>
                </div>
                <p className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{companyEmail}</p>
              </div>
              <div className="bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl p-5">
                <div className="flex items-center gap-2 text-[#34c759] mb-1.5">
                  <Phone className="w-4 h-4" />
                  <span className="uppercase text-[11px] font-bold tracking-wider">Mobile Number</span>
                </div>
                <p className="text-sm font-semibold text-[#1d1d1f] dark:text-[#f5f5f7]">{mobileNumber || 'Not configured'}</p>
              </div>
            </div>
          </div>

          {/* CHANGE PASSWORD */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 md:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Change Account Password</h3>
              <p className="text-xs text-[#86868b]">Update master credentials for company administration</p>
            </div>
            <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
              <input 
                type="password" 
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] font-medium"
              />
              <input 
                type="password" 
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] font-medium"
              />
              <input 
                type="password" 
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#1d1d1f] dark:text-[#f5f5f7] font-medium"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="px-6 py-3 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.3)] disabled:opacity-50 flex items-center gap-2 cursor-pointer transition-all text-sm"
              >
                <Lock className="w-4 h-4" /> {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          {/* UPDATE LOGO */}
          <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 md:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Company Avatar &amp; Logo</h3>
              <p className="text-xs text-[#86868b]">Appears across candidate job portals and walk-in interviews</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.08] dark:border-white/[0.1] rounded-3xl overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                {logoPreview || logoUrl ? (
                  <img src={logoPreview || logoUrl!} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-10 h-10 text-[#86868b]" />
                )}
              </div>
              <div className="space-y-3">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="block text-xs text-[#86868b] file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-[#0071e3] file:text-white file:font-semibold hover:file:bg-[#0077ed] cursor-pointer"
                />
                <button 
                  type="button" 
                  onClick={handleLogoUpdate}
                  disabled={!logoFile || loading}
                  className="px-5 py-2.5 bg-[#f2f2f7] hover:bg-[#e5e5ea] dark:bg-[#2c2c2e] dark:hover:bg-[#3a3a3c] border border-black/[0.06] dark:border-white/[0.08] rounded-xl text-xs font-semibold disabled:opacity-40 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> {loading ? 'Uploading...' : 'Save New Logo'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ─── TAB 3: TEAM ─── */}
      {activeTab === 'team' && (
        <section className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 md:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_2px_12px_rgba(0,0,0,0.03)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] space-y-5">
          <div>
            <h3 className="text-base font-bold text-[#1d1d1f] dark:text-[#f5f5f7]">Authorized Team Members</h3>
            <p className="text-xs text-[#86868b]">Users with permission to evaluate candidates and conduct interviews</p>
          </div>

          <div className="divide-y divide-black/[0.06] dark:divide-white/[0.08]">
            {employees.length === 0 ? (
              <div className="p-12 text-center text-[#86868b] text-sm">No registered team members linked</div>
            ) : (
              employees.map((member) => (
                <div key={member.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl">
                      <Shield className="w-4 h-4 text-[#0071e3]" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm text-[#1d1d1f] dark:text-[#f5f5f7]">{member.user?.mobileNumber || 'Registered Member'}</h5>
                      <div className="flex items-center gap-2 text-xs text-[#86868b] mt-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                          member.status === 'active' ? 'bg-[#34c759]/10 text-[#248a3d] dark:text-[#30d158]' : 'bg-[#ff9500]/10 text-[#ff9500]'
                        }`}>{member.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </main>
  );
}