'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { Layers, Lock, Mail, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { loginWithCredentials, switchDemoRole } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await loginWithCredentials(email, password);
    setIsSubmitting(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.message || 'Invalid credentials');
    }
  };

  return (
    <div className="max-w-md mx-auto my-12">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        {/* Brand Icon */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Sign in to Brightloop</h1>
          <p className="text-xs text-slate-500 mt-1">
            Subscription Management & Recurring Billing Platform
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full rounded-xl border border-slate-300 pl-9 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-700">Password</label>
              <a
                href="/forgot-password"
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-300 pl-9 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Demo Login Buttons */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3 flex items-center justify-center space-x-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Instant 1-Click Demo Accounts</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => switchDemoRole('ADMIN')}
              className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-center transition-all group"
            >
              <div className="font-bold text-xs">Admin</div>
              <div className="text-[10px] text-rose-500 mt-0.5">Full Access</div>
            </button>

            <button
              type="button"
              onClick={() => switchDemoRole('STAFF')}
              className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 text-center transition-all group"
            >
              <div className="font-bold text-xs">Staff</div>
              <div className="text-[10px] text-blue-500 mt-0.5">Billing Ops</div>
            </button>

            <button
              type="button"
              onClick={() => switchDemoRole('CUSTOMER')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-700 text-center transition-all group"
            >
              <div className="font-bold text-xs">Customer</div>
              <div className="text-[10px] text-emerald-500 mt-0.5">Self-Service</div>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{' '}
          <a href="/register" className="text-emerald-600 font-bold hover:underline">
            Create an account
          </a>
        </div>
      </div>
    </div>
  );
}
