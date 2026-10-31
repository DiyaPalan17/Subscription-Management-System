'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { apiRequest } from '../../lib/api';
import { Layers, Lock, Mail, User, Building, ArrowRight, Check, X } from 'lucide-react';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'STAFF' | 'ADMIN'>('CUSTOMER');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid) {
      setError('Please satisfy all password complexity criteria.');
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        role,
        companyName: companyName || null,
      }),
    });
    setIsSubmitting(false);

    if (res.success && res.data?.token && res.data?.user) {
      login(res.data.token, res.data.user);
      if (res.data.user.role === 'CUSTOMER') {
        router.push('/portal');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(res.message || 'Registration failed');
    }
  };

  return (
    <div className="max-w-md mx-auto my-8">
      <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Create an Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Join the Brightloop Recurring Billing Network
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-xl border border-slate-300 pl-9 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company / Organization</label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                className="w-full rounded-xl border border-slate-300 pl-9 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full rounded-xl border border-slate-300 pl-9 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
            >
              <option value="CUSTOMER">Customer (Self-service billing & subscriptions)</option>
              <option value="STAFF">Staff (Billing ops, quote creator, invoices)</option>
              <option value="ADMIN">Admin (Full system catalog, rules, reports)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
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

            {/* Live Password Regex Validation Checklist */}
            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-[11px]">
              <span className="font-semibold text-slate-500 block mb-1">
                Password Security Requirements:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <div
                  className={`flex items-center space-x-1.5 ${
                    hasMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {hasMinLength ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>Min 8 characters</span>
                </div>
                <div
                  className={`flex items-center space-x-1.5 ${
                    hasUpper ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {hasUpper ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>1 Uppercase letter</span>
                </div>
                <div
                  className={`flex items-center space-x-1.5 ${
                    hasLower ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {hasLower ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>1 Lowercase letter</span>
                </div>
                <div
                  className={`flex items-center space-x-1.5 ${
                    hasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                  }`}
                >
                  {hasSpecial ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  <span>1 Special character</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !isPasswordValid}
            className="w-full mt-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-sm flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Registering...' : 'Complete Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <a href="/login" className="text-emerald-600 font-bold hover:underline">
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
