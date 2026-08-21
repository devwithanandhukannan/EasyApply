'use client';
import { useState, useEffect } from 'react';
import { 
  Building2, 
  Mail, 
  Lock, 
  Smartphone, 
  Upload, 
  FileText,
  ArrowRight,
  ArrowLeft,
  Check,
  Briefcase,
  Users,
  MessageCircle,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../lib/axios';
import { useGlassToast } from '../components/GlassToastContainer';
import EasyApplyLogo from '../components/EasyApplyLogo';

type Step = 'company' | 'contact' | 'verify' | 'additional' | 'success';

interface CompanyData {
  companyName: string;
  industry: string;
  companySize: string;
  email: string;
  password: string;
  confirmPassword: string;
  mobileNumber: string;
  logo: File | null;
  gstNumber: string;
}

const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'Education',
  'Real Estate',
  'Other'
];

const companySizes = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees'
];

function RegisterPageComponent() {
  const { showToast } = useGlassToast();
  const router = useRouter();
  const [step, setStep] = useState<Step>('company');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Stores temporary flow token between verification and final submission
  const [preRegistrationToken, setPreRegistrationToken] = useState<string | null>(null);

  const [formData, setFormData] = useState<CompanyData>({
    companyName: '',
    industry: '',
    companySize: '',
    email: '',
    password: '',
    confirmPassword: '',
    mobileNumber: '',
    logo: null,
    gstNumber: ''
  });

  const updateFormData = (field: keyof CompanyData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Logo size must not exceed 5MB');
        return;
      }
      updateFormData('logo', file);
    }
  };

  const [nameError, setNameError] = useState<string>('');
  const [isCheckingName, setIsCheckingName] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [isCheckingEmail, setIsCheckingEmail] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string>('');
  const [isCheckingPhone, setIsCheckingPhone] = useState<boolean>(false);

  // Real-time Company Name Availability Check
  useEffect(() => {
    const cleanName = formData.companyName.trim();
    if (!cleanName || cleanName.length < 2) {
      setNameError('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingName(true);
      try {
        const response = await api.post('/company/auth/check-name', { companyName: cleanName });
        if (response.data?.exists) {
          setNameError(response.data.message || 'A company with this name is already registered.');
        } else {
          setNameError('');
        }
      } catch (err) {
        console.error('Company name check failed:', err);
      } finally {
        setIsCheckingName(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [formData.companyName]);

  // Real-time Email Availability Check
  useEffect(() => {
    const cleanEmail = formData.email.trim();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setEmailError('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingEmail(true);
      try {
        const response = await api.post('/company/auth/check-email', { email: cleanEmail });
        if (response.data?.exists) {
          setEmailError(response.data.message || 'A company or user with this email already exists.');
        } else {
          setEmailError('');
        }
      } catch (err) {
        console.error('Email availability check failed:', err);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  // Real-time Phone Availability Check
  useEffect(() => {
    const cleanPhone = formData.mobileNumber.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setPhoneError('');
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingPhone(true);
      try {
        const response = await api.post('/company/auth/check-phone', { phone: cleanPhone, mobileNumber: cleanPhone });
        if (response.data?.exists) {
          setPhoneError(response.data.message || 'A company or user with this mobile number already exists.');
        } else {
          setPhoneError('');
        }
      } catch (err) {
        console.error('Phone availability check failed:', err);
      } finally {
        setIsCheckingPhone(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [formData.mobileNumber]);

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.industry || !formData.companySize) {
      setErrorMessage('Please fill in all company information fields.');
      return;
    }
    if (nameError) {
      setErrorMessage(nameError);
      return;
    }
    if (isCheckingName) {
      setErrorMessage('Please wait while we check company name availability.');
      return;
    }
    setErrorMessage(null);
    setStep('contact');
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!formData.email.trim() || !formData.password || !formData.mobileNumber.trim()) {
      setErrorMessage('Please complete all contact & security details.');
      return;
    }

    if (emailError) {
      setErrorMessage(emailError);
      return;
    }

    if (phoneError) {
      setErrorMessage(phoneError);
      return;
    }

    if (isCheckingEmail || isCheckingPhone) {
      setErrorMessage('Please wait while we verify email and mobile availability.');
      return;
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/company/auth/send-otp', {
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        companyName: formData.companyName
      });

      if (response.data.success) {
        showToast('success', 'Verification code dispatched.', 'success');
        setStep('verify');
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setErrorMessage(err.response?.data?.message || 'Failed to dispatch verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    
    if (enteredOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit OTP.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await api.post('/company/auth/verify-otp', {
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        otp: enteredOtp
      });

      if (response.data.success) {
        setPreRegistrationToken(response.data.preRegistrationToken);
        showToast('success', 'Mobile verification successful!', 'success');
        setStep('additional');
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setErrorMessage(err.response?.data?.message || 'Invalid or expired verification code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const multipartPayload = new FormData();
      
      const analyticalPayload = {
        companyName: formData.companyName,
        industry: formData.industry,
        companySize: formData.companySize,
        email: formData.email,
        password: formData.password,
        gstNumber: formData.gstNumber,
        mobileNumber: formData.mobileNumber
      };

      multipartPayload.append('companyData', JSON.stringify(analyticalPayload));
      
      if (formData.logo) {
        multipartPayload.append('logo', formData.logo);
      }

      const response = await api.post('/company/auth/register', multipartPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${preRegistrationToken}`
        }
      });

      if (response.data.success) {
        if (response.data.token) {
          localStorage.setItem('companyToken', response.data.token);
          localStorage.setItem('token', response.data.token);
        }
        setStep('success');
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setErrorMessage(err.response?.data?.message || 'Failed to complete registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const response = await api.post('/company/auth/send-otp', {
        mobileNumber: formData.mobileNumber,
        email: formData.email,
        companyName: formData.companyName
      });

      if (response.data.success) {
        setOtp(['', '', '', '', '', '']);
        showToast('success', 'Verification code resent.', 'success');
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setErrorMessage(err.response?.data?.message || 'Failed to dispatch replacement code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const STEPS = [
    { key: 'company', label: 'Company' },
    { key: 'contact', label: 'Contact' },
    { key: 'verify', label: 'Verify' },
    { key: 'additional', label: 'Profile' },
  ];

  const currentStepIdx = STEPS.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-[#f5f5f7] dark:bg-[#000000] text-[#1d1d1f] dark:text-[#f5f5f7] transition-colors duration-200 font-sans">
      <div className="w-full max-w-xl">
        
        {/* Header & Logo */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <EasyApplyLogo size="xl" badge="Business" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] mb-1">
            Company Registration
          </h1>
          <p className="text-[#86868b] text-xs sm:text-sm font-medium">
            Join our hiring platform and start recruiting in minutes
          </p>
        </div>

        {/* Apple Stepper */}
        {step !== 'success' && (
          <div className="mb-6 bg-white dark:bg-[#1c1c1e] p-2 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-xs">
            <div className="flex items-center justify-between">
              {STEPS.map((s, idx) => {
                const isCompleted = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={s.key} className="flex items-center flex-1 last:flex-none">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-[#0071e3] text-white shadow-xs'
                          : isCompleted
                          ? 'bg-[#34c759] text-white'
                          : 'bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#86868b]'
                      }`}>
                        {isCompleted ? <Check size={13} strokeWidth={3} /> : idx + 1}
                      </div>
                      <span className={`text-xs font-semibold hidden sm:inline ${
                        isCurrent ? 'text-[#1d1d1f] dark:text-white' : 'text-[#86868b]'
                      }`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < STEPS.length - 1 && (
                      <div className={`h-[2px] flex-1 mx-2 sm:mx-3 rounded-full ${
                        idx < currentStepIdx ? 'bg-[#34c759]' : 'bg-black/[0.06] dark:bg-white/[0.08]'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && step !== 'success' && (
          <div className="mb-5 bg-[#ff3b30]/10 border border-[#ff3b30]/25 rounded-2xl p-4 text-xs sm:text-sm text-[#d70015] dark:text-[#ff453a] flex items-center gap-3 font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#ff3b30]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-6 sm:p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          
          {/* Step 1: Company Information */}
          {step === 'company' && (
            <form onSubmit={handleCompanySubmit} className="space-y-5">
              <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#1d1d1f] dark:text-white">Company Information</h2>
                <p className="text-xs text-[#86868b] font-medium mt-0.5">Tell us about your organization and industry</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                  Company Name *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                    <Building2 size={18} />
                  </div>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => updateFormData('companyName', e.target.value)}
                    placeholder="e.g. Acme Corporation"
                    className={`w-full pl-12 pr-10 py-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] border ${
                      nameError
                        ? 'border-[#ff3b30] focus:border-[#ff3b30]'
                        : 'border-black/[0.06] dark:border-white/[0.08] focus:border-[#0071e3]'
                    } rounded-2xl focus:outline-none transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] text-sm font-medium`}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isCheckingName && <Loader2 className="animate-spin text-[#0071e3]" size={18} />}
                    {!isCheckingName && nameError && <AlertCircle className="text-[#ff3b30]" size={18} />}
                    {!isCheckingName && !nameError && formData.companyName.trim().length >= 2 && (
                      <CheckCircle2 className="text-[#34c759]" size={18} />
                    )}
                  </div>
                </div>
                {nameError && (
                  <p className="text-[11px] text-[#ff3b30] mt-1.5 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} /> {nameError}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                  Industry *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                    <Briefcase size={18} />
                  </div>
                  <select
                    value={formData.industry}
                    onChange={(e) => updateFormData('industry', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-sm cursor-pointer font-medium appearance-none"
                    required
                  >
                    <option value="">Select industry</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                  Company Size *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                    <Users size={18} />
                  </div>
                  <select
                    value={formData.companySize}
                    onChange={(e) => updateFormData('companySize', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-sm cursor-pointer font-medium appearance-none"
                    required
                  >
                    <option value="">Select company size</option>
                    {companySizes.map((size) => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-[#0071e3] hover:bg-[#0077ed] text-white py-3.5 rounded-2xl font-bold shadow-[0_4px_14px_rgba(0,113,227,0.3)] transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
                >
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Contact Details */}
          {step === 'contact' && (
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#1d1d1f] dark:text-white">Contact & Security</h2>
                <p className="text-xs text-[#86868b] font-medium mt-0.5">Secure your corporate credentials and contact details</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                  Official Email Address *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="admin@company.com"
                    className={`w-full pl-12 pr-10 py-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] border ${
                      emailError
                        ? 'border-[#ff3b30] focus:border-[#ff3b30]'
                        : 'border-black/[0.06] dark:border-white/[0.08] focus:border-[#0071e3]'
                    } rounded-2xl focus:outline-none transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] text-sm font-medium`}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isCheckingEmail && <Loader2 className="animate-spin text-[#0071e3]" size={18} />}
                    {!isCheckingEmail && emailError && <AlertCircle className="text-[#ff3b30]" size={18} />}
                    {!isCheckingEmail && !emailError && formData.email.includes('@') && formData.email.includes('.') && (
                      <CheckCircle2 className="text-[#34c759]" size={18} />
                    )}
                  </div>
                </div>
                {emailError ? (
                  <p className="text-[11px] text-[#ff3b30] mt-1.5 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} /> {emailError}
                  </p>
                ) : (
                  <p className="text-[11px] text-[#86868b] mt-1.5 font-medium">We will send an activation verification link to this email.</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateFormData('password', e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full pl-12 pr-4 py-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] text-sm font-medium"
                      required
                      minLength={8}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                      <Lock size={18} />
                    </div>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full pl-12 pr-4 py-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] text-sm font-medium"
                      required
                      minLength={8}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                  WhatsApp / Mobile Number *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                    <Smartphone size={18} />
                  </div>
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => updateFormData('mobileNumber', e.target.value)}
                    placeholder="+91 9999999999"
                    className={`w-full pl-12 pr-10 py-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] border ${
                      phoneError
                        ? 'border-[#ff3b30] focus:border-[#ff3b30]'
                        : 'border-black/[0.06] dark:border-white/[0.08] focus:border-[#0071e3]'
                    } rounded-2xl focus:outline-none transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] text-sm font-medium`}
                    required
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isCheckingPhone && <Loader2 className="animate-spin text-[#0071e3]" size={18} />}
                    {!isCheckingPhone && phoneError && <AlertCircle className="text-[#ff3b30]" size={18} />}
                    {!isCheckingPhone && !phoneError && formData.mobileNumber.trim().length >= 8 && (
                      <CheckCircle2 className="text-[#34c759]" size={18} />
                    )}
                  </div>
                </div>
                {phoneError && (
                  <p className="text-[11px] text-[#ff3b30] mt-1.5 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} /> {phoneError}
                  </p>
                )}
              </div>

              <div className="bg-[#34c759]/10 border border-[#34c759]/25 rounded-2xl p-4 flex items-start space-x-3">
                <MessageCircle className="text-[#34c759] shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-bold text-[#248a3d] dark:text-[#30d158]">WhatsApp Verification (Default OTP: 000000)</p>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    WhatsApp gateway is in test mode. Use default code <strong>000000</strong> to verify.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('company')}
                  className="px-5 py-3.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] text-[#1d1d1f] dark:text-white rounded-2xl font-semibold text-sm hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] transition-all flex items-center justify-center space-x-2"
                >
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || Boolean(emailError) || Boolean(phoneError) || isCheckingEmail || isCheckingPhone}
                  className="flex-1 bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-2xl font-bold shadow-[0_4px_14px_rgba(0,113,227,0.3)] transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
                >
                  <span>Send Code</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Verify Email & Mobile */}
          {step === 'verify' && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-4 text-center">
                <h2 className="text-base sm:text-lg font-bold text-[#1d1d1f] dark:text-white">Email &amp; Security Verification</h2>
                <p className="text-xs text-[#86868b] font-medium mt-0.5">
                  Enter the 6-digit verification code sent to <strong className="text-[#0071e3] dark:text-[#2997ff]">{formData.email}</strong> &amp; <strong className="text-[#1d1d1f] dark:text-white">{formData.mobileNumber}</strong>
                </p>
              </div>

              <div>
                <div className="flex justify-between gap-2 sm:gap-3 my-4">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[index] && index > 0) {
                          const prevInput = document.getElementById(`otp-${index - 1}`);
                          prevInput?.focus();
                        }
                      }}
                      className="w-full h-14 text-center text-xl font-bold bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-white"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-center space-x-1.5 text-xs text-[#86868b] font-medium">
                  <Shield size={14} className="text-[#86868b]" />
                  <span>Code is valid for 5 minutes</span>
                </div>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                  className="text-xs text-[#0071e3] hover:underline font-semibold transition-colors cursor-pointer"
                >
                  Didn&apos;t receive code? Resend Code
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('contact')}
                  className="flex-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] py-3.5 rounded-2xl font-bold border border-black/[0.04] dark:border-white/[0.06] transition-colors flex items-center justify-center space-x-2 text-sm cursor-pointer"
                >
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || otp.some((d) => !d)}
                  className="flex-1 bg-[#0071e3] hover:bg-[#0077ed] text-white py-3.5 rounded-2xl font-bold shadow-[0_4px_14px_rgba(0,113,227,0.3)] transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer disabled:opacity-60"
                >
                  <span>{isSubmitting ? 'Verifying...' : 'Verify Code'}</span>
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Additional Details */}
          {step === 'additional' && (
            <form onSubmit={handleFinalSubmit} className="space-y-5">
              <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
                <h2 className="text-base sm:text-lg font-bold text-[#1d1d1f] dark:text-white">Additional Profile Information</h2>
                <p className="text-xs text-[#86868b] font-medium mt-0.5">Optional company branding & business verification</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                  Company Logo
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="logo-upload"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="w-full flex items-center justify-center px-4 py-8 bg-[#f2f2f7] dark:bg-[#2c2c2e] border-2 border-dashed border-black/[0.1] dark:border-white/[0.12] rounded-2xl cursor-pointer hover:border-[#0071e3] transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto text-[#0071e3] mb-2" size={24} />
                      <p className="text-xs sm:text-sm font-bold text-[#1d1d1f] dark:text-white mb-0.5">
                        {formData.logo ? formData.logo.name : 'Click or drop logo image here'}
                      </p>
                      <p className="text-[11px] text-[#86868b]">PNG, JPG, or SVG up to 5MB</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                  GST / Business Registration ID (Optional)
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                    <FileText size={18} />
                  </div>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => updateFormData('gstNumber', e.target.value)}
                    placeholder="e.g. 22AAAAA0000A1Z5"
                    className="w-full pl-12 pr-4 py-3 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] text-sm font-medium"
                  />
                </div>
                <p className="text-[11px] text-[#248a3d] dark:text-[#30d158] mt-1.5 flex items-center gap-1 font-semibold">
                  <CheckCircle2 size={13} />
                  Adding a valid registration ID earns your company a &quot;Verified Employer&quot; badge.
                </p>
              </div>

              <div className="bg-[#34c759]/8 border border-[#34c759]/20 rounded-2xl p-4 flex items-start space-x-3">
                <CheckCircle2 className="text-[#34c759] shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-xs font-bold text-[#34c759]">Instant Workspace Activation</p>
                  <p className="text-[11px] text-[#86868b] mt-0.5">
                    Mobile verification is complete. Completing registration will immediately activate your company workspace at <strong className="text-[#1d1d1f] dark:text-white">{formData.email}</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className="flex-1 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-[#f5f5f7] py-3.5 rounded-2xl font-bold border border-black/[0.04] dark:border-white/[0.06] transition-colors flex items-center justify-center space-x-2 text-sm cursor-pointer"
                >
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#0071e3] hover:bg-[#0077ed] text-white py-3.5 rounded-2xl font-bold shadow-[0_4px_14px_rgba(0,113,227,0.3)] transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer disabled:opacity-60"
                >
                  <span>{isSubmitting ? 'Registering...' : 'Complete Registration'}</span>
                  {!isSubmitting && <Check size={18} />}
                </button>
              </div>
            </form>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#34c759]/10 border border-[#34c759]/25 rounded-full text-[#34c759] mb-1">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-xl font-bold text-[#1d1d1f] dark:text-white">Workspace Activated!</h2>
              <p className="text-xs sm:text-sm text-[#86868b] max-w-md mx-auto leading-relaxed font-medium">
                Your corporate account for <strong className="text-[#1d1d1f] dark:text-white">{formData.companyName}</strong> (<span className="text-[#0071e3] font-semibold">{formData.email}</span>) has been created and verified.
              </p>
              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full sm:w-auto px-8 py-3.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl font-bold shadow-[0_4px_14px_rgba(0,113,227,0.3)] transition-all text-xs cursor-pointer flex items-center justify-center space-x-2"
                >
                  <span>Go to Company Dashboard</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] hover:bg-[#e5e5ea] dark:hover:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white rounded-2xl font-bold transition-all text-xs cursor-pointer"
                >
                  Proceed to Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step !== 'success' && (
          <div className="mt-6 text-center space-y-2">
            <p className="text-xs text-[#86868b] font-medium">
              By continuing, you agree to our Terms of Service &amp; Privacy Policy
            </p>
            <p className="text-xs sm:text-sm text-[#86868b]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#0071e3] hover:underline font-bold">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(RegisterPageComponent), { ssr: false });