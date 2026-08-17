'use client';

import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2, Search, Sparkles } from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';

export default function SettingsPage() {
  const { showToast } = useGlassToast();
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
      const res = await api.patch('/profile/password', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      if (res.data?.success) {
        showToast('Success', 'Password updated successfully.', 'success');
        // Clear form fields
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
    <div className="space-y-6 max-w-xl">
      {/* Header Info */}
      <div className="border-b border-zinc-900 pb-5">
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Account & Visibility Settings</h1>
        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
          Manage your account credentials, security configuration, and recruiter discovery preferences.
        </p>
      </div>

      {/* Recruiter Discovery Opt-In Card */}
      <div className="bg-gradient-to-br from-indigo-950/20 via-zinc-950/30 to-zinc-950/20 border border-indigo-500/20 rounded-xl p-6 space-y-4 backdrop-blur-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-zinc-100 tracking-tight">
                  Recruiter Discovery Database
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full">
                  100% Free
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
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
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        <div className="pt-2 border-t border-indigo-500/10 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Status: <strong className={mounted && discoverable ? 'text-emerald-400' : 'text-zinc-500'}>{mounted && discoverable ? 'Visible to all employers' : 'Hidden from searches'}</strong></span>
          </div>
          {loadingDiscovery && <span className="text-indigo-400 animate-pulse">Updating...</span>}
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-zinc-950/20 border border-zinc-800 rounded-xl p-6 space-y-5 backdrop-blur-md">
        <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-4">
          <div className="p-1.5 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Security Credentials
            </h3>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Update your account password. If you logged in using OTP and have not set a password yet, you can leave the current password field blank.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-zinc-400 text-[11px] font-medium">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password (if set)"
                className="w-full px-3 py-1.5 pr-10 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                {showCurrent ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-zinc-400 text-[11px] font-medium">
              New Password *
            </label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full px-3 py-1.5 pr-10 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                {showNew ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-zinc-400 text-[11px] font-medium">
              Confirm New Password *
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-3 py-1.5 pr-10 bg-zinc-950/50 border border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 text-xs placeholder-zinc-700"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                {showConfirm ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
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
