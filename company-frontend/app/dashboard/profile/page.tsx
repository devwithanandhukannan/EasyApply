'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/app/lib/axios';
import { 
  Building2, Save, Plus, Trash2, X, Users, Shield, 
  Mail, Phone, Lock, Upload, Check, AlertCircle
} from 'lucide-react';
import { useGlassToast } from '@/app/components/GlassToastContainer';

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
        setServices(comp.services || []);
        setSeoKeywords(comp.seoKeywords || []);
        setCoreValues(comp.coreValues || []);
        setGallery(comp.gallery || []);
        setProducts(comp.products || []);
        setOfficeLocations(comp.officeLocations || []);
        setSocialMedia(comp.socialMedia || {});
        setEmployees(comp.teamMembers || []);
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400 text-xs">
        Loading profile...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-6 md:p-12 max-w-5xl mx-auto">
      
      {/* HEADER */}
      <header className="mb-8 border-b border-zinc-900 pb-6">
        <div className="flex items-center gap-2 text-zinc-400 text-[10px] uppercase tracking-widest mb-1">
          <Building2 className="w-3 h-3" /> Company Configuration
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white uppercase">Profile Management</h1>
        <p className="text-xs text-zinc-500 mt-1">Update company details, security credentials, and team settings</p>

        {/* TAB NAVIGATION */}
        <div className="flex gap-2 mt-6 p-1 bg-zinc-900/50 border border-zinc-900 rounded-xl max-w-lg">
          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-xs tracking-wide transition uppercase ${
              activeTab === 'identity' ? 'bg-zinc-900 text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" /> Identity
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-xs tracking-wide transition uppercase ${
              activeTab === 'security' ? 'bg-zinc-900 text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Security
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium text-xs tracking-wide transition uppercase ${
              activeTab === 'team' ? 'bg-zinc-900 text-white border border-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Team
          </button>
        </div>
      </header>

      {/* ─── TAB 1: IDENTITY ─── */}
      {activeTab === 'identity' && (
        <form onSubmit={handleBasicProfileUpdate} className="space-y-8 text-xs">
          
          {/* Basic Info */}
          <section className="space-y-4">
            <h3 className="text-xs font-medium uppercase text-zinc-400 tracking-wider">Primary Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-500 mb-1.5 uppercase font-medium">Company Name</label>
                <input 
                  type="text" 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1.5 uppercase font-medium">Industry</label>
                <input 
                  type="text" 
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1.5 uppercase font-medium">Company Size</label>
                <input 
                  type="text" 
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 50-200"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1.5 uppercase font-medium">Registration Number</label>
                <input 
                  type="text" 
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-500 mb-1.5 uppercase font-medium">Tagline</label>
              <input 
                type="text" 
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="One-line company description"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-500 mb-1.5 uppercase font-medium">Website</label>
                <input 
                  type="url" 
                  value={corporateLink}
                  onChange={(e) => setCorporateLink(e.target.value)}
                  placeholder="https://company.io"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1.5 uppercase font-medium">YouTube Link</label>
                <input 
                  type="url" 
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200 focus:outline-none focus:border-zinc-700"
                />
              </div>
            </div>
          </section>

          {/* Services & Keywords */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-zinc-900 pt-6">
            <div className="space-y-2">
              <label className="block text-zinc-500 uppercase font-medium">Services</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newService} 
                  onChange={(e) => setNewService(e.target.value)} 
                  placeholder="Add service..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
                <button type="button" onClick={() => appendItem(setServices, services, newService, setNewService)} className="px-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {services.map((s, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 pl-2.5 pr-1.5 py-1 rounded-full text-[11px]">
                    {s} <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => removeItem(setServices, services, i)}/>
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-zinc-500 uppercase font-medium">SEO Keywords</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newKeyword} 
                  onChange={(e) => setNewKeyword(e.target.value)} 
                  placeholder="Add keyword..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
                <button type="button" onClick={() => appendItem(setSeoKeywords, seoKeywords, newKeyword, setNewKeyword)} className="px-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {seoKeywords.map((k, i) => (
                  <span key={i} className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 pl-2.5 pr-1.5 py-1 rounded-full text-[11px]">
                    {k} <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => removeItem(setSeoKeywords, seoKeywords, i)}/>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* Core Values & Gallery */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-zinc-900 pt-6">
            <div className="space-y-2">
              <label className="block text-zinc-500 uppercase font-medium">Core Values</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newValue} 
                  onChange={(e) => setNewValue(e.target.value)} 
                  placeholder="Add value..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
                <button type="button" onClick={() => appendItem(setCoreValues, coreValues, newValue, setNewValue)} className="px-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800"><Plus className="w-4 h-4"/></button>
              </div>
              <ul className="space-y-1 mt-2">
                {coreValues.map((v, i) => (
                  <li key={i} className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/60 p-2 rounded-lg text-zinc-300">
                    <span>{v}</span>
                    <Trash2 className="w-3.5 h-3.5 text-zinc-600 hover:text-rose-400 cursor-pointer" onClick={() => removeItem(setCoreValues, coreValues, i)}/>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <label className="block text-zinc-500 uppercase font-medium">Gallery (Image URLs)</label>
              <div className="flex gap-2">
                <input 
                  type="url" 
                  value={newImageUrl} 
                  onChange={(e) => setNewImageUrl(e.target.value)} 
                  placeholder="https://..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200"
                />
                <button type="button" onClick={() => appendItem(setGallery, gallery, newImageUrl, setNewImageUrl)} className="px-3 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800"><Plus className="w-4 h-4"/></button>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {gallery.map((img, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-zinc-800 h-16 bg-zinc-900">
                    <img src={img} alt="" className="w-full h-full object-cover opacity-60" />
                    <button type="button" onClick={() => removeItem(setGallery, gallery, i)} className="absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4 text-rose-400"/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Products */}
          <section className="space-y-4 border-t border-zinc-900 pt-6">
            <label className="block text-zinc-500 uppercase font-medium">Products</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input 
                type="text" 
                placeholder="Product Name" 
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200"
              />
              <input 
                type="url" 
                placeholder="Product Link" 
                value={newProduct.link}
                onChange={(e) => setNewProduct({ ...newProduct, link: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200"
              />
              <button 
                type="button" 
                onClick={() => {
                  if (!newProduct.name || !newProduct.link) return;
                  setProducts([...products, newProduct]);
                  setNewProduct({ name: '', link: '' });
                }}
                className="bg-zinc-900 border border-zinc-800 rounded-lg py-2 hover:bg-zinc-800 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5"/> Add
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {products.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                  <div>
                    <p className="font-medium text-zinc-200">{p.name}</p>
                    <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">{p.link}</p>
                  </div>
                  <Trash2 className="w-4 h-4 text-zinc-600 hover:text-rose-400 cursor-pointer" onClick={() => removeItem(setProducts, products, i)}/>
                </div>
              ))}
            </div>
          </section>

          {/* Office Locations */}
          <section className="space-y-4 border-t border-zinc-900 pt-6">
            <label className="block text-zinc-500 uppercase font-medium">Office Locations</label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input 
                type="text" 
                placeholder="City" 
                value={newLocation.city}
                onChange={(e) => setNewLocation({ ...newLocation, city: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-200"
              />
              <input 
                type="text" 
                placeholder="Address" 
                value={newLocation.address}
                onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 sm:col-span-2 text-zinc-200"
              />
              <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-lg px-3">
                <span className="text-zinc-500 text-[10px] uppercase">HQ</span>
                <input 
                  type="checkbox" 
                  checked={newLocation.isHub} 
                  onChange={(e) => setNewLocation({ ...newLocation, isHub: e.target.checked })}
                  className="w-3.5 h-3.5"
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-2 hover:bg-zinc-800 flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5"/> Add Location
            </button>
            
            <div className="space-y-2">
              {officeLocations.map((loc, i) => (
                <div key={i} className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
                  <div>
                    <span className="font-medium text-zinc-200">{loc.city}</span>
                    {loc.isHub && <span className="ml-2 text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400 uppercase">HQ</span>}
                    <p className="text-[10px] text-zinc-500">{loc.address}</p>
                  </div>
                  <Trash2 className="w-4 h-4 text-zinc-600 hover:text-rose-400 cursor-pointer" onClick={() => removeItem(setOfficeLocations, officeLocations, i)}/>
                </div>
              ))}
            </div>
          </section>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-zinc-900">
            <button type="button" onClick={() => router.push('/dashboard')} className="px-4 py-2 border border-zinc-800 rounded-xl hover:bg-zinc-900">Cancel</button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-5 py-2 bg-white text-zinc-950 rounded-xl font-medium hover:bg-zinc-200 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 2: SECURITY ─── */}
      {activeTab === 'security' && (
        <div className="space-y-8 text-xs">
          
          {/* Current Credentials */}
          <section className="space-y-4">
            <h3 className="text-xs font-medium uppercase text-zinc-400 tracking-wider">Current Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span className="uppercase text-[10px]">Email</span>
                </div>
                <p className="text-zinc-200">{companyEmail}</p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-zinc-500 mb-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span className="uppercase text-[10px]">Mobile</span>
                </div>
                <p className="text-zinc-200">{mobileNumber || 'Not set'}</p>
              </div>
            </div>
          </section>

          {/* Change Password */}
          <section className="space-y-4 border-t border-zinc-900 pt-6">
            <h3 className="text-xs font-medium uppercase text-zinc-400 tracking-wider">Change Password</h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-3">
              <input 
                type="password" 
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200"
              />
              <input 
                type="password" 
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200"
              />
              <input 
                type="password" 
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" /> {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </section>

          {/* Update Logo */}
          <section className="space-y-4 border-t border-zinc-900 pt-6">
            <h3 className="text-xs font-medium uppercase text-zinc-400 tracking-wider">Company Logo</h3>
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                {logoPreview || logoUrl ? (
                  <img src={logoPreview || logoUrl!} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-8 h-8 text-zinc-600" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  className="block w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:text-zinc-300 hover:file:bg-zinc-800"
                />
                <button 
                  type="button" 
                  onClick={handleLogoUpdate}
                  disabled={!logoFile || loading}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800 disabled:opacity-40 flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" /> {loading ? 'Uploading...' : 'Upload Logo'}
                </button>
              </div>
            </div>
          </section>

          {/* Change Mobile */}
          <section className="space-y-4 border-t border-zinc-900 pt-6">
            <h3 className="text-xs font-medium uppercase text-zinc-400 tracking-wider">Change Mobile Number</h3>
            {!mobileOtpSent ? (
              <div className="flex gap-2">
                <input 
                  type="tel" 
                  placeholder="New 10-digit mobile"
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200"
                />
                <button 
                  type="button" 
                  onClick={handleRequestMobileOtp}
                  disabled={loading}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <Check className="w-4 h-4" /> OTP sent to {newMobile}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter OTP"
                    value={mobileOtp}
                    onChange={(e) => setMobileOtp(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200"
                  />
                  <button 
                    type="button" 
                    onClick={handleVerifyMobileOtp}
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-900 border border-emerald-800 rounded-lg hover:bg-emerald-800 text-emerald-200"
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setMobileOtpSent(false); setMobileOtp(''); }}
                  className="text-zinc-500 hover:text-zinc-300 text-xs underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </section>

          {/* Change Email */}
          <section className="space-y-4 border-t border-zinc-900 pt-6">
            <h3 className="text-xs font-medium uppercase text-zinc-400 tracking-wider">Change Email Address</h3>
            {!emailOtpSent ? (
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="New email address"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200"
                />
                <button 
                  type="button" 
                  onClick={handleRequestEmailOtp}
                  disabled={loading}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-zinc-800"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs">
                  <Check className="w-4 h-4" /> OTP sent to {newEmail}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter OTP"
                    value={emailOtp}
                    onChange={(e) => setEmailOtp(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-200"
                  />
                  <button 
                    type="button" 
                    onClick={handleVerifyEmailOtp}
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-900 border border-emerald-800 rounded-lg hover:bg-emerald-800 text-emerald-200"
                  >
                    {loading ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                <button 
                  type="button" 
                  onClick={() => { setEmailOtpSent(false); setEmailOtp(''); }}
                  className="text-zinc-500 hover:text-zinc-300 text-xs underline"
                >
                  Cancel
                </button>
              </div>
            )}
          </section>

        </div>
      )}

      {/* ─── TAB 3: TEAM ─── */}
      {activeTab === 'team' && (
        <section className="space-y-6 text-xs">
          <div className="border border-zinc-900 rounded-xl bg-zinc-950 overflow-hidden">
            <div className="p-4 bg-zinc-900/20 border-b border-zinc-900">
              <h4 className="font-semibold text-zinc-200 uppercase tracking-wide">Team Members</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">Manage user access and permissions</p>
            </div>

            <div className="divide-y divide-zinc-900">
              {employees.length === 0 ? (
                <div className="p-8 text-center text-zinc-500 uppercase">No team members found</div>
              ) : (
                employees.map((member) => (
                  <div key={member.id} className="p-4 flex items-center justify-between hover:bg-zinc-900/10">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <Shield className="w-4 h-4 text-zinc-400" />
                      </div>
                      <div>
                        <h5 className="font-medium text-zinc-200">{member.user.mobileNumber}</h5>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-semibold ${
                            member.status === 'active' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-amber-950/40 text-amber-400'
                          }`}>{member.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}