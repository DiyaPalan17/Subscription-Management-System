'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/StatusBadge';
import { InvoicePrintModal } from '../../components/InvoicePrintModal';
import {
  Repeat,
  Receipt,
  Printer,
  Calendar,
  Building,
  CheckCircle,
  CreditCard,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function CustomerPortalPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<any | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else {
        loadCustomerData();
      }
    }
  }, [user, isLoading, router]);

  const loadCustomerData = async () => {
    const [subRes, invRes] = await Promise.all([
      apiRequest('/subscriptions'),
      apiRequest('/invoices'),
    ]);

    if (subRes.success && subRes.data?.subscriptions) {
      setSubscriptions(subRes.data.subscriptions);
    }
    if (invRes.success && invRes.data?.invoices) {
      setInvoices(invRes.data.invoices);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Account Welcome Hero */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Building className="w-3.5 h-3.5" />
            <span>{user.companyName || 'Customer Portal'}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Welcome, {user.name}</h1>
          <p className="text-xs text-slate-300 mt-1">
            Manage your recurring services, review active plans, and download tax invoices.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-center">
            <div className="text-[10px] text-slate-300 uppercase font-semibold">Active Services</div>
            <div className="text-xl font-bold font-mono text-emerald-400">
              {subscriptions.filter((s) => s.status === 'ACTIVE').length}
            </div>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl border border-white/10 text-center">
            <div className="text-[10px] text-slate-300 uppercase font-semibold">Invoices</div>
            <div className="text-xl font-bold font-mono text-white">{invoices.length}</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: MY SUBSCRIPTIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Repeat className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">My Subscriptions & Services</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {subscriptions.length === 0 ? (
            <div className="col-span-2 p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No subscriptions found on your account. Contact sales or support for assistance.
            </div>
          ) : (
            subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        {sub.subscriptionNumber}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2">
                        {sub.plan?.name || 'Recurring Plan'}
                      </h3>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 mt-4 pt-3 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cadence:</span>
                      <span className="font-semibold text-slate-800">{sub.plan?.billingCadence}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Current Period:</span>
                      <span className="font-mono">
                        {new Date(sub.currentPeriodStart).toLocaleDateString()} –{' '}
                        {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Next Billing Renewal:</span>
                      <span className="font-mono font-bold text-emerald-700">
                        {new Date(sub.nextBillingDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Bundled Items */}
                  {sub.lines && sub.lines.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Included Platform Components
                      </span>
                      <div className="space-y-1">
                        {sub.lines.map((l: any) => (
                          <div
                            key={l.id}
                            className="flex justify-between text-xs p-1.5 rounded bg-slate-50"
                          >
                            <span className="text-slate-800 font-medium">
                              {l.product?.name}{' '}
                              {l.variant && (
                                <span className="text-slate-500 text-[11px]">
                                  ({l.variant.value})
                                </span>
                              )}
                            </span>
                            <span className="font-mono text-slate-600">x{l.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Terms: Net {sub.paymentTermsDays} Days</span>
                  <span className="text-emerald-600 font-semibold">Active & Running</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* SECTION 2: MY INVOICES */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Billing History & Invoices</h2>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Invoice Document</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                      <div className="text-[10px] text-slate-400 font-normal">
                        Issued {new Date(inv.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {new Date(inv.periodStart).toLocaleDateString()} –{' '}
                      {new Date(inv.periodEnd).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${inv.totalAmount?.toFixed(2)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <StatusBadge status={inv.status} />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoiceForPrint(inv)}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InvoicePrintModal
        isOpen={Boolean(selectedInvoiceForPrint)}
        invoice={selectedInvoiceForPrint}
        onClose={() => setSelectedInvoiceForPrint(null)}
      />
    </div>
  );
}
