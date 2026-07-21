'use client';

import { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import api from '@/app/lib/axios';
import { useGlassToast } from '@/app/components/GlassToastContainer';

export default function SettingsPage() {
  const { showToast } = useGlassToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Account Settings</h1>
        <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
          Manage your account credentials, security configuration, and workspace preferences.
        </p>
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
