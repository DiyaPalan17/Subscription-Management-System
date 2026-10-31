'use client';

import React, { useState } from 'react';
import { apiRequest } from '../../lib/api';
import { Layers, Mail, ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [resetDebug, setResetDebug] = useState<{ resetToken: string; resetUrl: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setIsSubmitting(false);

    if (res.success) {
      setSubmitted(true);
      if (res.data?.debug) {
        setResetDebug(res.data.debug);
      }
    } else {
      setError(res.message || 'Failed to dispatch reset instructions');
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
            Forgot Password?
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enter your email to receive a secure password reset token.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Reset Request Dispatched</h3>
            <p className="text-xs text-slate-500">
              If an account with <strong>{email}</strong> exists, instructions and a 1-hour secure token have been sent.
            </p>

            {/* Local dev simulation box */}
            {resetDebug && (
              <div className="mt-4 p-4 rounded-xl bg-purple-50 border border-purple-100 text-left text-xs">
                <span className="font-bold text-purple-900 block mb-1">
                  🧪 Local Dev Email Service Mock:
                </span>
                <p className="text-purple-700 text-[11px] mb-2">
                  In production, this is emailed via SMTP/SES. For evaluation, use this direct link:
                </p>
                <a
                  href={`/reset-password?token=${resetDebug.resetToken}`}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-xs"
                >
                  <span>Open Password Reset Screen</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100">
              <a
                href="/login"
                className="inline-flex items-center space-x-1 text-xs text-emerald-600 font-bold hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
                {error}
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@brightloop.io"
                  className="w-full rounded-xl border border-slate-300 pl-9 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Sending Request...' : 'Send Password Reset Link'}
            </button>

            <div className="pt-4 border-t border-slate-100 text-center">
              <a
                href="/login"
                className="inline-flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-700"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
