'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/StatusBadge';
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Clock,
  Play,
  RotateCw,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [kpis, setKpis] = useState<any>(null);
  const [executionTime, setExecutionTime] = useState<string>('0.35ms');
  const [recentSubscriptions, setRecentSubscriptions] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [billingRunning, setBillingRunning] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'CUSTOMER') {
        router.push('/portal');
      } else {
        loadDashboardData();
      }
    }
  }, [user, isLoading, router]);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    const [kpiRes, subRes, invRes] = await Promise.all([
      apiRequest('/finance/kpis'),
      apiRequest('/subscriptions'),
      apiRequest('/invoices'),
    ]);
    setIsRefreshing(false);

    if (kpiRes.success && kpiRes.data?.kpis) {
      setKpis(kpiRes.data.kpis);
      if (kpiRes.data.executionTimeMs) {
        setExecutionTime(kpiRes.data.executionTimeMs);
      }
    }
    if (subRes.success && subRes.data?.subscriptions) {
      setRecentSubscriptions(subRes.data.subscriptions.slice(0, 5));
    }
    if (invRes.success && invRes.data?.invoices) {
      setRecentInvoices(invRes.data.invoices.slice(0, 5));
    }
  };

  const handleTriggerBilling = async () => {
    setBillingRunning(true);
    setBannerMessage(null);
    const res = await apiRequest('/billing/run', {
      method: 'POST',
      body: JSON.stringify({ executionDate: new Date() }),
    });
    setBillingRunning(false);

    if (res.success) {
      setBannerMessage(
        `Billing run complete: Generated ${res.data?.result?.invoicesGeneratedCount || 0} invoices. (Idempotency check skipped ${res.data?.result?.skippedIdempotentCount || 0} duplicate periods).`
      );
      loadDashboardData();
    } else {
      setBannerMessage(res.message || 'Billing run error');
    }
  };

  const handleTriggerOverdue = async () => {
    setBannerMessage(null);
    const res = await apiRequest('/billing/evaluate-overdue', {
      method: 'POST',
      body: JSON.stringify({ referenceDate: new Date() }),
    });
    if (res.success) {
      setBannerMessage(`Overdue evaluation complete: Checked invoices and updated statuses.`);
      loadDashboardData();
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-sm text-slate-500">Loading Finance Dashboard...</div>
      </div>
    );
  }

  const aging = kpis?.agingBuckets || {
    overdue1To30Days: 0,
    overdue31To60Days: 0,
    overdue60PlusDays: 0,
  };
  const totalOverdue = kpis?.totalOverdueAmount || 0;

  return (
    <div className="space-y-6">
      {/* Top Header & Fast SLA Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Finance & Billing Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time ARR, MRR, Aging A/R, and Automated Billing Operations Center.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sub-2s SLA Performance Badge */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
            <span>Query SLA: {executionTime}</span>
            <span className="text-[10px] text-emerald-600 font-normal">(Sub-2s indexed)</span>
          </div>

          <button
            onClick={loadDashboardData}
            disabled={isRefreshing}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl shadow-xs transition-colors"
            title="Refresh Metrics"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {bannerMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{bannerMessage}</span>
          </div>
          <button
            onClick={() => setBannerMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* MRR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              MRR
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            ${kpis?.mrr?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Monthly Recurring Revenue</div>
        </div>

        {/* ARR */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              ARR
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            ${kpis?.arr?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Annual Recurring Run-rate</div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Subs
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {kpis?.activeSubscriptionsCount || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Generating recurring billing</div>
        </div>

        {/* Cash Collected This Month */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Collected (Month)
            </span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            ${kpis?.totalCashCollectedThisMonth?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            All-time: ${kpis?.totalCashCollectedAllTime?.toLocaleString() || '0'}
          </div>
        </div>

        {/* Overdue Total */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">
              Overdue A/R
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 font-mono">
            ${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Past due invoices</div>
        </div>
      </div>

      {/* Aging Accounts Receivable (A/R) Buckets & Automated Actions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aging A/R Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Aging Accounts Receivable (A/R) Buckets
              </h2>
              <p className="text-xs text-slate-500">
                Categorization of delinquent invoices by days past due date.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-700">
              Total Delinquent: ${totalOverdue.toFixed(2)}
            </span>
          </div>

          {/* Aging Distribution Bar */}
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex mb-6">
            <div
              style={{
                width: `${totalOverdue > 0 ? (aging.overdue1To30Days / totalOverdue) * 100 : 0}%`,
              }}
              className="bg-amber-400 h-full transition-all"
              title={`1-30 Days: $${aging.overdue1To30Days}`}
            />
            <div
              style={{
                width: `${totalOverdue > 0 ? (aging.overdue31To60Days / totalOverdue) * 100 : 0}%`,
              }}
              className="bg-orange-500 h-full transition-all"
              title={`31-60 Days: $${aging.overdue31To60Days}`}
            />
            <div
              style={{
                width: `${totalOverdue > 0 ? (aging.overdue60PlusDays / totalOverdue) * 100 : 0}%`,
              }}
              className="bg-rose-600 h-full transition-all"
              title={`60+ Days: $${aging.overdue60PlusDays}`}
            />
          </div>

          {/* Aging Bucket Metric Tiles */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60">
              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                1 – 30 Days Overdue
              </div>
              <div className="mt-1 text-xl font-black text-amber-800 font-mono">
                ${aging.overdue1To30Days.toFixed(2)}
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">Gentle follow-up reminder</div>
            </div>

            <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/60">
              <div className="text-[11px] font-semibold text-orange-700 uppercase tracking-wider">
                31 – 60 Days Overdue
              </div>
              <div className="mt-1 text-xl font-black text-orange-800 font-mono">
                ${aging.overdue31To60Days.toFixed(2)}
              </div>
              <div className="text-[10px] text-orange-600 mt-0.5">Formal collection notice</div>
            </div>

            <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-200/60">
              <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider">
                60+ Days Overdue
              </div>
              <div className="mt-1 text-xl font-black text-rose-800 font-mono">
                ${aging.overdue60PlusDays.toFixed(2)}
              </div>
              <div className="text-[10px] text-rose-600 mt-0.5">Service suspension risk</div>
            </div>
          </div>
        </div>

        {/* Automated Engine Controls */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Engine Control Center</span>
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Background jobs run daily on cron. You can also trigger immediate on-demand runs below.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleTriggerBilling}
                disabled={billingRunning}
                className="w-full flex items-center justify-between p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <div className="flex items-center space-x-2">
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  <span>{billingRunning ? 'Executing...' : 'Trigger Automated Billing Run'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Idempotent</span>
              </button>

              <button
                onClick={handleTriggerOverdue}
                className="w-full flex items-center justify-between p-3.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span>Scan & Mark Overdue Invoices</span>
                </div>
                <span className="text-[10px] text-rose-500 font-mono">Daily check</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Scheduled Crons:</span>
            <span className="font-mono text-slate-600">0 0 * * * & 0 1 * * *</span>
          </div>
        </div>
      </div>

      {/* Recent Subscriptions & Invoices Table Previews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Subscriptions Preview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Active & Staged Subscriptions
            </h3>
            <a
              href="/subscriptions"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentSubscriptions.map((sub) => (
              <div key={sub.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                <div>
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="font-mono text-emerald-700">{sub.subscriptionNumber}</span>
                    <span className="text-slate-400">•</span>
                    <span>{sub.customer?.companyName || sub.customer?.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Plan: {sub.plan?.name} • Next Bill: {new Date(sub.nextBillingDate).toLocaleDateString()}
                  </div>
                </div>
                <StatusBadge status={sub.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Invoices Preview */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Recent Invoices & Receivables
            </h3>
            <a
              href="/invoices"
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
            >
              <span>View Ledger</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/60">
                <div>
                  <div className="font-bold text-slate-900 flex items-center space-x-2">
                    <span className="font-mono text-slate-700">{inv.invoiceNumber}</span>
                    <span className="text-slate-400">•</span>
                    <span>{inv.customer?.companyName || inv.customer?.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Total: <strong className="text-slate-900 font-mono">${inv.totalAmount?.toFixed(2)}</strong> •
                    Due: {new Date(inv.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <StatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
