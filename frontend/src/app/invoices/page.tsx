'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { apiRequest } from '../../lib/api';
import { StatusBadge } from '../../components/StatusBadge';
import { RecordPaymentModal } from '../../components/RecordPaymentModal';
import { InvoicePrintModal } from '../../components/InvoicePrintModal';
import {
  Receipt,
  Search,
  Printer,
  DollarSign,
  Calendar,
  AlertTriangle,
  RotateCw,
  Clock,
} from 'lucide-react';

export default function InvoicesPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [invoices, setInvoices] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any | null>(null);
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<any | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'CUSTOMER') {
        router.push('/portal');
      } else {
        loadInvoices();
      }
    }
  }, [user, isLoading, router]);

  const loadInvoices = async () => {
    const res = await apiRequest('/invoices');
    if (res.success && res.data?.invoices) {
      setInvoices(res.data.invoices);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer?.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Accounts Receivable Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Idempotent invoice ledger with multi-method payment reconciliation and printable previews.
          </p>
        </div>

        <button
          onClick={loadInvoices}
          className="p-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-xl shadow-xs self-start sm:self-auto transition-colors"
          title="Reload ledger"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {banner && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex justify-between items-center">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice #, customer name..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CONFIRMED', 'PAID', 'OVERDUE', 'DRAFT', 'CANCELLED'].map((st) => (
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

      {/* Invoices Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase tracking-wider font-semibold">
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer & Account</th>
              <th className="py-3 px-4">Billing Period</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Total Amount</th>
              <th className="py-3 px-4 text-right">Balance Due</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400">
                  No invoices found in ledger.
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => {
                const balanceDue = Number(
                  (inv.totalAmount - (inv.amountPaid || 0)).toFixed(2)
                );
                const isOverdue = inv.status === 'OVERDUE';

                return (
                  <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                      <div className="text-[10px] text-slate-400 font-sans font-normal">
                        Issued: {new Date(inv.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">
                        {inv.customer?.companyName || inv.customer?.name}
                      </div>
                      <div className="text-[11px] text-slate-500">{inv.customer?.email}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      {new Date(inv.periodStart).toLocaleDateString()} –{' '}
                      {new Date(inv.periodEnd).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ${inv.totalAmount?.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono">
                      {balanceDue <= 0 ? (
                        <span className="text-emerald-600 font-bold">$0.00</span>
                      ) : (
                        <span className={isOverdue ? 'text-rose-600 font-bold' : 'text-slate-800 font-medium'}>
                          ${balanceDue.toFixed(2)}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={inv.status} />
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {/* Printable Invoice Modal Trigger */}
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View & Print Invoice"
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Record Payment Action */}
                        {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                          <button
                            onClick={() => setSelectedInvoiceForPayment(inv)}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold text-xs transition-colors"
                            title="Record manual / bank / UPI payment"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            <span>Record Pay</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <RecordPaymentModal
        isOpen={Boolean(selectedInvoiceForPayment)}
        invoice={selectedInvoiceForPayment}
        onClose={() => setSelectedInvoiceForPayment(null)}
        onSuccess={() => {
          setBanner('Payment successfully recorded and reconciled!');
          loadInvoices();
        }}
      />

      <InvoicePrintModal
        isOpen={Boolean(selectedInvoiceForPrint)}
        invoice={selectedInvoiceForPrint}
        onClose={() => setSelectedInvoiceForPrint(null)}
      />
    </div>
  );
}
