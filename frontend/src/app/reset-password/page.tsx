'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiRequest } from '../../lib/api';
import { Layers, Lock, CheckCircle, Check, X } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  // Password validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Password reset token is missing from URL');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!isPasswordValid) {
      setError('Please satisfy all password complexity requirements');
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        newPassword,
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.message || 'Password reset failed');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Set New Password
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Choose a new strong password for your Brightloop account.
          </p>
        </div>

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Password Updated</h3>
            <p className="text-xs text-slate-500">
              Your password has been successfully reset. You may now sign in.
            </p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reset Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token or load from link"
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-mono bg-slate-50"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 pl-9 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px]">
                <div className="grid grid-cols-2 gap-1.5">
                  <div
                    className={`flex items-center space-x-1.5 ${
                      hasMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>Min 8 chars</span>
                  </div>
                  <div
                    className={`flex items-center space-x-1.5 ${
                      hasUpper ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>1 Uppercase</span>
                  </div>
                  <div
                    className={`flex items-center space-x-1.5 ${
                      hasLower ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>1 Lowercase</span>
                  </div>
                  <div
                    className={`flex items-center space-x-1.5 ${
                      hasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                    <span>1 Special char</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 pl-9 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isPasswordValid}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-sm text-slate-500">Loading Password Reset...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
