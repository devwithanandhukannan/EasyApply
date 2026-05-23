'use client';
import { useState } from 'react';
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
  Shield
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AxiosError } from 'axios';
import api from '../lib/axios';

type Step = 'company' | 'contact' | 'verify' | 'additional';

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
  const [step, setStep] = useState<Step>('company');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Stores the temporary flow state to maintain auth sanity between Step 3 & Step 4
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
    if (errorMessage) setErrorMessage(null); // Clear errors dynamically
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
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size exceeds the permitted corporate 5MB limit.');
        return;
      }
      updateFormData('logo', file);
    }
  };

  // ─── STEP 1 SUBMIT: Local transition to Contact Details ─────────────────
  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('contact');
  };

  // ─── STEP 2 SUBMIT: Send WhatsApp OTP & Validate Uniqueness ────────────
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match');
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
        setStep('verify');
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setErrorMessage(err.response?.data?.message || 'Failed to dispatch verification OTP.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── STEP 3 SUBMIT: Verify WhatsApp Code & Receive Pre-Reg Token ─────────
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const combinedOtp = otp.join('');

    if (combinedOtp.length !== 6) {
      setErrorMessage('Please input a valid 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/company/auth/verify-otp', {
        mobileNumber: formData.mobileNumber,
        otp: combinedOtp
      });

      if (response.data.success && response.data.preRegistrationToken) {
        setPreRegistrationToken(response.data.preRegistrationToken);
        setStep('additional');
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setErrorMessage(err.response?.data?.message || 'Invalid verification token entered.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── STEP 4 SUBMIT: Upload Multipart Payload (JSON + Binary File) ───────
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!preRegistrationToken) {
      setErrorMessage('Session context lost. Please return to Step 1.');
      return;
    }

    setIsSubmitting(true);
    try {
      const multipartPayload = new FormData();
      
      // Separate file properties cleanly from structural string properties
      const analyticalPayload = {
        companyName: formData.companyName,
        industry: formData.industry,
        companySize: formData.companySize,
        email: formData.email,
        password: formData.password,
        gstNumber: formData.gstNumber
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
        alert('Corporate shell registered! Please check your verification link inbox to activate.');
        // Optional tracking reset or router push goes here
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setErrorMessage(err.response?.data?.message || 'Failed to capture corporate profile parameters.');
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
        alert('A replacement security token was logged via WhatsApp.');
      }
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      setErrorMessage(err.response?.data?.message || 'Failed to dispatch replacement code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProgressBar = () => {
    const steps = ['company', 'contact', 'verify', 'additional'];
    const currentIndex = steps.indexOf(step);
    
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex flex-col items-center w-full">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  index <= currentIndex 
                    ? 'bg-white border-white text-black' 
                    : 'bg-transparent border-[#2c2c2e] text-gray-600'
                }`}>
                  {index < currentIndex ? (
                    <Check size={16} />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-full mt-4 ${
                    index < currentIndex ? 'bg-white' : 'bg-[#2c2c2e]'
                  }`} />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white rounded-2xl mb-4">
            <span className="text-black font-semibold text-xl">J</span>
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Company Registration</h1>
          <p className="text-gray-500 text-sm">Join our hiring platform in minutes</p>
        </div>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Error Notification Context Block */}
        {errorMessage && (
          <div className="mb-6 bg-red-950/40 border border-red-900 rounded-xl p-4 text-sm text-red-400 text-center font-medium">
            {errorMessage}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-[#1c1c1e] rounded-2xl p-8 border border-[#2c2c2e]">
          
          {/* Step 1: Company Information */}
          {step === 'company' && (
            <form onSubmit={handleCompanySubmit} className="space-y-5">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-1">Company Information</h2>
                <p className="text-xs text-gray-500">Tell us about your organization</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Company Name *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <Building2 size={18} />
                  </div>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => updateFormData('companyName', e.target.value)}
                    placeholder="Enter company name"
                    className="w-full pl-12 pr-4 py-3 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Industry *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <Briefcase size={18} />
                  </div>
                  <select
                    value={formData.industry}
                    onChange={(e) => updateFormData('industry', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm appearance-none cursor-pointer"
                    required
                  >
                    <option value="" className="bg-[#1c1c1e]">Select industry</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind} className="bg-[#1c1c1e]">
                        {ind}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Company Size *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <Users size={18} />
                  </div>
                  <select
                    value={formData.companySize}
                    onChange={(e) => updateFormData('companySize', e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white text-sm appearance-none cursor-pointer"
                    required
                  >
                    <option value="" className="bg-[#1c1c1e]">Select company size</option>
                    {companySizes.map((size) => (
                      <option key={size} value={size} className="bg-[#1c1c1e]">
                        {size}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black py-3.5 rounded-xl font-medium hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 text-sm"
              >
                <span>Continue</span>
                <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* Step 2: Contact Details */}
          {step === 'contact' && (
            <form onSubmit={handleContactSubmit} className="space-y-5">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-1">Contact Details</h2>
                <p className="text-xs text-gray-500">Secure your account and verify contact</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Official Email *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="company@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                    required
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">We&apos;ll send a verification link to this email</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => updateFormData('password', e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full pl-12 pr-4 py-3 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-12 pr-4 py-3 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Mobile Number *
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <Smartphone size={18} />
                  </div>
                  <input
                    type="tel"
                    value={formData.mobileNumber}
                    onChange={(e) => updateFormData('mobileNumber', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-12 pr-4 py-3 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="bg-[#000000] border border-[#2c2c2e] rounded-xl p-4 flex items-start space-x-3">
                <MessageCircle className="text-green-500 flex-shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-medium text-white">WhatsApp Verification</p>
                  <p className="text-xs text-gray-500 mt-1">
                    We&apos;ll send a 6-digit OTP to verify your mobile number
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('company')}
                  className="flex-1 bg-[#000000] text-white py-3.5 rounded-xl font-medium border border-[#2c2c2e] hover:border-white transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-white text-black py-3.5 rounded-xl font-medium hover:bg-gray-100 disabled:bg-[#2c2c2e] disabled:text-gray-600 transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  <span>{isSubmitting ? 'Sending OTP...' : 'Send OTP'}</span>
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Verify Mobile */}
          {step === 'verify' && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-1">Verify Mobile Number</h2>
                <p className="text-xs text-gray-500">Enter the OTP sent to {formData.mobileNumber}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-3">
                  Enter OTP
                </label>

                <div className="flex justify-between gap-2 mb-5">
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
                      className="w-full h-14 text-center text-lg font-medium bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-center space-x-1.5 text-xs mb-5">
                  <Shield size={14} className="text-gray-600" />
                  <span className="text-gray-500">Valid for 5 minutes</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSubmitting}
                className="w-full text-sm text-gray-500 hover:text-white font-medium disabled:text-gray-700 transition-colors mb-3"
              >
                Didn&apos;t receive OTP? Resend
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('contact')}
                  className="flex-1 bg-[#000000] text-white py-3.5 rounded-xl font-medium border border-[#2c2c2e] hover:border-white transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || otp.some((d) => !d)}
                  className="flex-1 bg-white text-black py-3.5 rounded-xl font-medium hover:bg-gray-100 disabled:bg-[#2c2c2e] disabled:text-gray-600 transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  <span>{isSubmitting ? 'Verifying...' : 'Verify'}</span>
                  {!isSubmitting && <ArrowRight size={18} />}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Additional Details */}
          {step === 'additional' && (
            <form onSubmit={handleFinalSubmit} className="space-y-5">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-1">Additional Details</h2>
                <p className="text-xs text-gray-500">Optional information to enhance your profile</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
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
                    className="w-full flex items-center justify-center px-4 py-8 bg-[#000000] border border-[#2c2c2e] border-dashed rounded-xl cursor-pointer hover:border-white transition-colors"
                  >
                    <div className="text-center">
                      <Upload className="mx-auto text-gray-600 mb-2" size={24} />
                      <p className="text-sm text-white mb-1">
                        {formData.logo ? formData.logo.name : 'Upload company logo'}
                      </p>
                      <p className="text-xs text-gray-600">PNG, JPG up to 5MB</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  GST / Business Registration Number
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">
                    <FileText size={18} />
                  </div>
                  <input
                    type="text"
                    value={formData.gstNumber}
                    onChange={(e) => updateFormData('gstNumber', e.target.value)}
                    placeholder="Enter GST or registration number"
                    className="w-full pl-12 pr-4 py-3 bg-[#000000] border border-[#2c2c2e] rounded-xl focus:outline-none focus:border-white transition-colors text-white placeholder-gray-600 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                  <Check size={12} className="text-green-500" />
                  Adding this earns you a &quot;Verified Company&quot; badge
                </p>
              </div>

              <div className="bg-[#000000] border border-[#2c2c2e] rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <Mail className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="text-sm font-medium text-white">Email Verification Required</p>
                    <p className="text-xs text-gray-500 mt-1">
                      After registration, check your inbox at <span className="text-white">{formData.email}</span> for a verification link
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className="flex-1 bg-[#000000] text-white py-3.5 rounded-xl font-medium border border-[#2c2c2e] hover:border-white transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-white text-black py-3.5 rounded-xl font-medium hover:bg-gray-100 disabled:bg-[#2c2c2e] disabled:text-gray-600 transition-colors flex items-center justify-center space-x-2 text-sm"
                >
                  <span>{isSubmitting ? 'Creating Account...' : 'Complete Registration'}</span>
                  {!isSubmitting && <Check size={18} />}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600 mb-3">
            By continuing, you agree to our Terms &amp; Privacy Policy
          </p>
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <a href="/login" className="text-white hover:underline font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(RegisterPageComponent), { ssr: false });