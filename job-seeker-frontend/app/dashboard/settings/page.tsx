'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2, Search, Sparkles, Sun, Moon } from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';
import { useTheme } from '@/app/lib/theme';

export default function SettingsPage() {
  const { showToast } = useGlassToast();
  const { mode, setMode } = useTheme();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Discovery toggle state
  const [mounted, setMounted] = useState(false);
  const [discoverable, setDiscoverable] = useState(false);
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setInitialLoading(true);
      const res = await api.get('/jobseeker/profile');
      if (res.data?.success && res.data.profile) {
        setDiscoverable(!!res.data.profile.discoverable);
      }
    } catch (err) {
      console.error('Failed to load profile for discovery setting', err);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleToggleDiscovery = async () => {
    const nextVal = !discoverable;
    try {
      setLoadingDiscovery(true);
      const res = await api.put('/jobseeker/profile/discoverable', { discoverable: nextVal });
      if (res.data?.success) {
        setDiscoverable(nextVal);
        showToast(
          nextVal ? 'Discovery Enabled' : 'Discovery Disabled',
          res.data.message || (nextVal ? 'Your profile is now visible to all employers.' : 'Your profile is now private.'),
          'success'
        );
      } else {
        showToast('Error', res.data?.message || 'Failed to update discovery preference', 'danger');
      }
    } catch (err: any) {
      showToast('Error', err.response?.data?.message || 'Failed to update discovery preference', 'danger');
    } finally {
      setLoadingDiscovery(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword) {
      showToast('Validation Error', 'New password is required.', 'danger');
      return;
    }

    if (newPassword.length < 6) {
      showToast('Validation Error', 'Password must be at least 6 characters long.', 'danger');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Validation Error', 'New passwords do not match.', 'danger');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.patch('/jobseeker/profile/password', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      if (res.data?.success) {
        showToast('Success', 'Password updated successfully.', 'success');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('Error', res.data?.message || 'Failed to update password.', 'danger');
      }
    } catch (error: any) {
      console.error('Password update error:', error);
      showToast(
        'Error',
        error.response?.data?.message || 'An error occurred while updating your password.',
        'danger'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl text-[#1d1d1f] dark:text-[#f5f5f7] font-sans antialiased p-1">
      {/* Header Info */}
      <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] dark:text-white">Account &amp; Visibility Settings</h1>
        <p className="text-xs sm:text-sm text-[#86868b] mt-0.5 font-medium leading-relaxed">
          Manage your account credentials, interface theme (Dark / Light mode), and recruiter discovery preferences.
        </p>
      </div>

      {/* ─── APPEARANCE & THEME TOGGLE CARD ──────────────────────────── */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-[#0071e3]/10 border border-[#0071e3]/20 rounded-2xl text-[#0071e3]">
              {mounted && mode === 'light' ? (
                <Sun className="w-5 h-5 text-[#ff9500]" />
              ) : (
                <Moon className="w-5 h-5 text-[#0071e3]" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                Interface Appearance
              </h3>
              <p className="text-xs text-[#86868b] font-medium mt-0.5">
                Toggle between dark mode and clean light mode.
              </p>
            </div>
          </div>

          {/* Dark / Light Mode Toggle Pill */}
          <div className="inline-flex p-1 bg-[#e5e5ea] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl shrink-0">
            <button
              type="button"
              onClick={() => {
                setMode('dark');
                showToast('Theme Updated', 'Dark mode activated', 'info');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mounted && mode === 'dark'
                  ? 'bg-white dark:bg-[#1c1c1e] text-[#1d1d1f] dark:text-white shadow-xs'
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
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mounted && mode === 'light'
                  ? 'bg-white text-[#1d1d1f] shadow-xs'
                  : 'text-[#86868b] hover:text-[#1d1d1f]'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-[#ff9500]" />
              <span>Light</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recruiter Discovery Opt-In Card */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 space-y-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-[#0071e3]/10 border border-[#0071e3]/20 rounded-2xl text-[#0071e3]">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1d1d1f] dark:text-white tracking-tight">
                  Recruiter Discovery Database
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] font-bold bg-[#34c759]/10 border border-[#34c759]/20 text-[#248a3d] dark:text-[#30d158] rounded-full uppercase tracking-wider">
                  100% Free
                </span>
              </div>
              <p className="text-xs text-[#86868b] font-medium mt-1 leading-relaxed">
                Allow all verified companies on EasyApply to browse your profile, match your skills, and invite you to interviews directly.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={mounted ? discoverable : false}
              onChange={handleToggleDiscovery}
              disabled={!mounted || loadingDiscovery}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#e5e5ea] dark:bg-[#2c2c2e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:shadow-xs peer-checked:bg-[#34c759]"></div>
          </label>
        </div>

        <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs text-[#86868b] font-medium">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0071e3]" />
            <span>Status: <strong className={mounted && discoverable ? 'text-[#248a3d] dark:text-[#30d158] font-bold' : 'text-[#86868b] font-semibold'}>{mounted && discoverable ? 'Visible to all employers' : 'Hidden from searches'}</strong></span>
          </div>
          {loadingDiscovery && <span className="text-[#0071e3] font-semibold animate-pulse">Updating...</span>}
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-black/[0.06] dark:border-white/[0.08] rounded-3xl p-6 sm:p-7 space-y-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
          <div className="p-2 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.04] dark:border-white/[0.06] rounded-2xl text-[#0071e3]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1d1d1f] dark:text-white uppercase tracking-wider">
              Security Credentials
            </h3>
            <p className="text-[11px] text-[#86868b] font-medium mt-0.5">
              Update your account password. If you logged in using OTP and have not set a password yet, you can leave the current password field blank.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password (if set)"
                className="w-full px-4 py-2.5 pr-10 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium placeholder-[#86868b]"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors cursor-pointer"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 pr-10 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium placeholder-[#86868b]"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors cursor-pointer"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#86868b] uppercase tracking-wider">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-2.5 pr-10 bg-[#f2f2f7] dark:bg-[#2c2c2e] border border-black/[0.06] dark:border-white/[0.08] rounded-2xl focus:outline-none focus:border-[#0071e3] transition-colors text-[#1d1d1f] dark:text-[#f5f5f7] text-xs font-medium placeholder-[#86868b]"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] dark:hover:text-white transition-colors cursor-pointer"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0071e3] hover:bg-[#0077ed] text-white rounded-2xl text-xs font-bold transition-all shadow-[0_4px_14px_rgba(0,113,227,0.25)] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
