'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/StatusBadge';
import { NewSubscriptionModal } from '../../components/NewSubscriptionModal';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  CheckCircle,
  FileText,
  XCircle,
  RefreshCw,
  Search,
  Filter,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function SubscriptionsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'CUSTOMER') {
        router.push('/portal');
      } else {
        loadSubscriptions();
      }
    }
  }, [user, isLoading, router]);

  const loadSubscriptions = async () => {
    const res = await apiRequest('/subscriptions');
    if (res.success && res.data?.subscriptions) {
      setSubscriptions(res.data.subscriptions);
    }
  };

  const handleTransition = async (id: string, targetStatus: string) => {
    setActionLoading(id);
    setBanner(null);
    const res = await apiRequest(`/subscriptions/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify({ targetStatus }),
    });
    setActionLoading(null);

    if (res.success) {
      setBanner({
        type: 'success',
        message: `Subscription transitioned to ${targetStatus} successfully!`,
      });
      loadSubscriptions();
    } else {
      setBanner({
        type: 'error',
        message: res.message || 'Transition failed',
      });
    }
  };

  const handleTriggerBilling = async (id: string) => {
    setActionLoading(id);
    setBanner(null);
    const res = await apiRequest(`/subscriptions/${id}/trigger-billing`, {
      method: 'POST',
    });
    setActionLoading(null);

    if (res.success) {
      setBanner({
        type: 'success',
        message: res.data?.message || 'Billing processed successfully',
      });
      loadSubscriptions();
    } else {
      setBanner({
        type: 'error',
        message: res.message || 'Billing generation failed',
      });
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesStatus = statusFilter === 'ALL' || sub.status === statusFilter;
    const matchesSearch =
      sub.subscriptionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.customer?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.plan?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Subscription Lifecycle Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Finite State Machine: DRAFT → QUOTATION → CONFIRMED → ACTIVE → PAUSED → CLOSED.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Subscription / Quote</span>
          </button>
        </div>
      </div>

      {banner && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
            banner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <span>{banner.message}</span>
          <button onClick={() => setBanner(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subscription #, customer, plan..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'ACTIVE', 'CONFIRMED', 'QUOTATION', 'DRAFT', 'PAUSED', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Subscription</th>
              <th className="py-3 px-4">Customer & Account</th>
              <th className="py-3 px-4">Plan & Terms</th>
              <th className="py-3 px-4">Next Billing Date</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Lifecycle Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredSubscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No subscriptions match the selected criteria.
                </td>
              </tr>
            ) : (
              filteredSubscriptions.map((sub) => {
                const isExpanded = expandedSubId === sub.id;
                const isLoading = actionLoading === sub.id;

                return (
                  <React.Fragment key={sub.id}>
                    <tr className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                          className="font-bold text-slate-900 font-mono flex items-center space-x-1 text-emerald-700 hover:text-emerald-800"
                        >
                          <span>{sub.subscriptionNumber}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </button>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Started: {new Date(sub.startDate).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {sub.customer?.companyName || sub.customer?.name}
                        </div>
                        <div className="text-[11px] text-slate-500">{sub.customer?.email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {sub.plan?.name} (${sub.plan?.basePrice}/{sub.plan?.billingCadence})
                        </div>
                        {sub.discountRule && (
                          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                            Promo: {sub.discountRule.code} (
                            {sub.discountRule.type === 'PERCENTAGE'
                              ? `${sub.discountRule.value}%`
                              : `$${sub.discountRule.value}`}
                            )
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                        {new Date(sub.nextBillingDate).toLocaleDateString()}
                        <div className="text-[10px] text-slate-400">
                          Period: {new Date(sub.currentPeriodStart).toLocaleDateString()} -{' '}
                          {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={sub.status} />
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* FSM ACTION BUTTONS */}
                          {sub.status === 'DRAFT' && (
                            <button
                              onClick={() => handleTransition(sub.id, 'QUOTATION')}
                              disabled={isLoading}
                              className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded font-semibold border border-purple-200 text-xs transition-colors"
                              title="Lock pricing and turn into official Quote"
                            >
                              Lock as Quote
                            </button>
                          )}

                          {sub.status === 'QUOTATION' && (
                            <button
                              onClick={() => handleTransition(sub.id, 'CONFIRMED')}
                              disabled={isLoading}
                              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-semibold border border-blue-200 text-xs transition-colors"
                              title="Customer accepts quote"
                            >
                              Confirm Quote
                            </button>
                          )}

                          {sub.status === 'CONFIRMED' && (
                            <button
                              onClick={() => handleTransition(sub.id, 'ACTIVE')}
                              disabled={isLoading}
                              className="px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-700 rounded font-semibold text-xs shadow-xs transition-colors"
                              title="Activate subscription and start billing cycle"
                            >
                              Activate
                            </button>
                          )}

                          {sub.status === 'ACTIVE' && (
                            <>
                              <button
                                onClick={() => handleTriggerBilling(sub.id)}
                                disabled={isLoading}
                                className="px-2.5 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded font-semibold text-xs transition-colors flex items-center space-x-1"
                                title="Run automated billing cycle right now"
                              >
                                <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                                <span>Bill Cycle</span>
                              </button>

                              <button
                                onClick={() => handleTransition(sub.id, 'PAUSED')}
                                disabled={isLoading}
                                className="px-2 py-1 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded font-semibold border border-orange-200 text-xs transition-colors"
                                title="Pause subscription"
                              >
                                Pause
                              </button>
                            </>
                          )}

                          {sub.status === 'PAUSED' && (
                            <button
                              onClick={() => handleTransition(sub.id, 'ACTIVE')}
                              disabled={isLoading}
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-semibold border border-emerald-200 text-xs transition-colors"
                              title="Resume subscription"
                            >
                              Resume
                            </button>
                          )}

                          {sub.status !== 'CLOSED' && (
                            <button
                              onClick={() => handleTransition(sub.id, 'CLOSED')}
                              disabled={isLoading}
                              className="px-2 py-1 bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded font-semibold text-xs transition-colors"
                              title="Terminate subscription"
                            >
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Line Items Preview */}
                    {isExpanded && (
                      <tr className="bg-slate-50/80">
                        <td colSpan={6} className="p-4">
                          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="font-bold text-slate-900">
                                Line Items for {sub.subscriptionNumber}
                              </span>
                              {sub.validUntil && (
                                <span className="text-[11px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                  Quote Valid Until: {new Date(sub.validUntil).toLocaleDateString()}
                                </span>
                              )}
                            </div>

                            <table className="w-full text-left text-xs">
                              <thead>
                                <tr className="text-slate-400 uppercase font-semibold text-[10px]">
                                  <th>Product</th>
                                  <th>Variant Adjustment</th>
                                  <th className="text-center">Quantity</th>
                                  <th className="text-right">Unit Price</th>
                                  <th className="text-right">Line Total</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {sub.lines && sub.lines.length > 0 ? (
                                  sub.lines.map((l: any) => (
                                    <tr key={l.id}>
                                      <td className="py-2 font-medium text-slate-900">
                                        {l.product?.name || 'Product'}
                                      </td>
                                      <td className="py-2 text-slate-600">
                                        {l.variant ? (
                                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                                            {l.variant.name}: {l.variant.value} (+${l.variant.priceAdjustment})
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">None</span>
                                        )}
                                      </td>
                                      <td className="py-2 text-center font-bold">{l.quantity}</td>
                                      <td className="py-2 text-right font-mono">${l.unitPrice?.toFixed(2)}</td>
                                      <td className="py-2 text-right font-mono font-bold text-slate-900">
                                        ${(l.unitPrice * l.quantity).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={5} className="py-2 text-center text-slate-400">
                                      No extra line items. Base plan price applies.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <NewSubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setBanner({
            type: 'success',
            message: 'New subscription / quote staged in DRAFT mode!',
          });
          loadSubscriptions();
        }}
      />
    </div>
  );
}
