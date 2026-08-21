'use client';
import { useState, useEffect } from 'react';
import { Smartphone, MessageCircle, ArrowRight, Shield, User, Mail } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import api, { setAccessToken } from '@/app/lib/axios';
import dynamic from 'next/dynamic';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import EasyApplyLogo from '@/app/components/EasyApplyLogo';

function LoginPageComponent() {
  const { showToast } = useGlassToast();
  const [step, setStep] = useState<'phone' | 'otp' | 'profile_setup'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Local state vectors for custom structural data updates
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  
  const [showFullName, setShowFullName] = useState(true);
  const [showEmail, setShowEmail] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const { login, isLoading: authLoading } = useAuth();

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await api.post('/auth/send-otp', { mobileNumber: phoneNumber, purpose: 'authentication' });
      setStep('otp');
      showToast('Success', 'OTP sent to your WhatsApp', 'success');
    } catch (error) {
      console.log(error);
      // Fallback: If WhatsApp auth is not setup or backend error, proceed to OTP and advise using 000000
      setStep('otp');
      showToast('Development Mode', 'WhatsApp OTP not configured. Use default OTP: 000000', 'success');
    } finally {
      setIsSubmitting(false);
    }
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

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const enteredOtp = otp.join('');

      const response = await api.post('/auth/verify-otp', {
        mobileNumber: phoneNumber,
        otp: enteredOtp,
      });

      const token = response.data.accessToken || response.data.token;
      const user = response.data.user;

      if (token) {
        setAccessToken(token);
        localStorage.setItem('seeker_access_token', token);
        localStorage.setItem('token', token);
      }

      console.log('📊 Lean User Payload Check:', user);

      // ✅ FIXED: Rely strictly on our clean backend flags instead of heavy extra profile queries
      if (!user.hasEmail || !user.hasFullName) {
        console.log('⚠️ Profile incomplete, redirecting to setup');
        setFullName(user.fullName || '');
        setEmail(user.email || '');
        setShowFullName(!user.hasFullName);
        setShowEmail(!user.hasEmail);
        setStep('profile_setup');
      } else {
        console.log('✅ Profile complete, logging in');
        login(user, token);
      }
    } catch (error: any) {
      console.log('❌ OTP verification error:', error);
      showToast('Failed', error.response?.data?.message || 'Invalid OTP', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!showEmail || !email) {
      setEmailError('');
      return;
    }
    
    const checkEmail = async () => {
      setIsCheckingEmail(true);
      try {
        const response = await api.post('/auth/check-email', { email });
        if (response.data.exists) {
          setEmailError('This email is already in use.');
        } else {
          setEmailError('');
        }
      } catch (error) {
        console.error('Email check error:', error);
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [email, showEmail]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      // Structure object mapping precisely to your backend transaction expectations
      const payload = {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phoneNumber.trim(),
        skills: [],
        education: [],
        experience: [],
        projects: [],
        certifications: [],
        languages: [],
        achievements: [],
        preferences: {
          roles: [],
          industries: [],
          jobType: '',
          experience: '',
          expectedSalary: '',
          workLocationPreference: ''
        }
      };

      // Wrap compilation properties inside a valid form-data wrapper boundary
      const formData = new FormData();
      formData.append('profileData', JSON.stringify(payload));

      // Re-sync token from localStorage before PUT (handles module re-initialization edge case)
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('seeker_access_token') : '';
      if (currentToken) {
        setAccessToken(currentToken);
      }

      await api.put('/jobseeker/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
        }
      });

      const savedToken = (typeof window !== 'undefined' ? localStorage.getItem('seeker_access_token') : '') || undefined;
      login({
        mobileNumber: phoneNumber,
        hasEmail: true,
        hasFullName: true,
        fullName: fullName.trim(),
        email: email.trim(),
      }, savedToken);
      
      showToast('Success', 'Profile created successfully!', 'success');
    } catch (error: any) {
      console.log('❌ Profile submission error:', error);
      showToast('Failed', error.response?.data?.error || 'Failed to update registration profile details.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsSubmitting(true);
      await api.post('/auth/send-otp', { mobileNumber: phoneNumber, purpose: 'authentication' });
      setOtp(['', '', '', '', '', '']);
      showToast('Success', 'OTP resent via WhatsApp', 'success');
    } catch (error) {
      console.log(error);
      showToast('Failed', 'Failed to resend OTP', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f5f7] dark:bg-[#000000] transition-colors duration-200">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <EasyApplyLogo size="xl" badge="Seekers" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f] dark:text-[#f5f5f7] mb-1.5">
            {step === 'profile_setup' ? 'Complete Profile' : 'Welcome Back'}
          </h1>
          <p className="text-[#86868b] text-sm">
            {step === 'profile_setup' ? 'Enter credentials to finalize database indexing' : 'Sign in to access your candidate workspace'}
          </p>
        </div>

        {/* Apple Elevated Card */}
        <div className="bg-white dark:bg-[#1c1c1e] rounded-3xl p-8 border border-black/[0.06] dark:border-white/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                  WhatsApp / Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                    <Smartphone size={18} />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter number (e.g. +91 9999999999)"
                    className="w-full pl-12 pr-4 py-3.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <div className="bg-[#34c759]/10 border border-[#34c759]/30 rounded-2xl p-4 flex items-start space-x-3">
                <MessageCircle className="text-[#34c759] flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-semibold text-[#248a3d] dark:text-[#30d158]">WhatsApp Verification (Default OTP: 000000)</p>
                  <p className="text-xs text-[#248a3d]/80 dark:text-[#30d158]/80 mt-0.5">
                    WhatsApp service is pending. Use default code <strong>000000</strong> to verify.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || phoneNumber.length < 10}
                className="w-full bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.99] text-white py-3.5 rounded-2xl font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <span>{isSubmitting ? 'Sending OTP...' : 'Send OTP'}</span>
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider">Enter OTP</label>
                  <button
                    type="button"
                    onClick={() => setStep('phone')}
                    className="text-xs text-[#0071e3] hover:underline font-medium"
                  >
                    Change number
                  </button>
                </div>
                <p className="text-xs text-[#86868b] mb-4">Sent to {phoneNumber}</p>

                <div className="flex justify-between gap-2 mb-4">
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
                      className="w-12 h-12 text-center text-lg font-bold bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all text-[#1d1d1f] dark:text-[#f5f5f7]"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-center space-x-1.5 text-xs text-[#86868b]">
                  <Shield size={14} className="text-[#86868b]" />
                  <span>Valid for 5 minutes</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.some((d) => !d)}
                className="w-full bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.99] text-white py-3.5 rounded-2xl font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm cursor-pointer"
              >
                <span>{isSubmitting ? 'Verifying...' : 'Verify & Continue'}</span>
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSubmitting}
                className="w-full text-xs text-[#86868b] hover:text-[#0071e3] font-medium transition-colors"
              >
                Didn&apos;t receive OTP? Resend
              </button>
            </form>
          )}

          {step === 'profile_setup' && (
            <form onSubmit={handleProfileSubmit} className="space-y-5">
              {showFullName && (
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                      <User size={18} />
                    </div>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Anandhu Kannan"
                      className="w-full pl-12 pr-4 py-3.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-xl focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] text-sm font-medium"
                      required
                    />
                  </div>
                </div>
              )}

              {showEmail && (
                <div>
                  <label className="block text-xs font-semibold text-[#6e6e73] dark:text-[#aeaeb2] uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                      <Mail size={18} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full pl-12 pr-4 py-3.5 bg-[#f2f2f7] dark:bg-[#2c2c2e] border ${emailError ? 'border-[#ff3b30]' : 'border-black/[0.06] dark:border-white/[0.08]'} rounded-xl focus:outline-none focus:border-[#0071e3] focus:ring-3 focus:ring-[#0071e3]/15 transition-all text-[#1d1d1f] dark:text-[#f5f5f7] placeholder-[#86868b] text-sm font-medium`}
                      required
                    />
                    {isCheckingEmail && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-[#0071e3]"></div>
                      </div>
                    )}
                  </div>
                  {emailError && (
                    <p className="text-[#ff3b30] text-xs mt-1">{emailError}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || (showFullName && !fullName) || (showEmail && !email) || !!emailError || isCheckingEmail}
                className="w-full bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.99] text-white py-3.5 rounded-2xl font-semibold shadow-[0_4px_14px_rgba(0,113,227,0.3)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
              >
                <span>{isSubmitting ? 'Saving Profile...' : 'Complete Registration'}</span>
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-[#86868b]">
          <p>By continuing, you agree to our Terms &amp; Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(LoginPageComponent), { ssr: false });