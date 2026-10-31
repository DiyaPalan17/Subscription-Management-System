'use client';

import React, { useState } from 'react';
import { apiRequest } from '../lib/api';
import { X, CheckCircle, CreditCard, DollarSign } from 'lucide-react';

interface RecordPaymentModalProps {
  invoice: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CARD' | 'UPI' | 'MANUAL'>('BANK_TRANSFER');
  const [amount, setAmount] = useState<string>('');
  const [referenceId, setReferenceId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !invoice) return null;

  const remainingBalance = Number((invoice.totalAmount - (invoice.amountPaid || 0)).toFixed(2));

  const handleFullAmount = () => {
    setAmount(remainingBalance.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid positive payment amount');
      return;
    }

    if (numericAmount > remainingBalance) {
      setError(`Amount cannot exceed outstanding balance of $${remainingBalance.toFixed(2)}`);
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest('/payments', {
      method: 'POST',
      body: JSON.stringify({
        invoiceId: invoice.id,
        paymentMethod,
        amount: numericAmount,
        referenceId: referenceId || null,
        notes: notes || null,
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message || 'Failed to record payment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Record Payment</h3>
              <p className="text-xs text-slate-500">
                Invoice {invoice.invoiceNumber} • {invoice.customer?.name || 'Customer'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Balance Summary */}
        <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <div className="text-slate-400 font-medium">Total Amount</div>
            <div className="text-sm font-bold text-slate-800">${invoice.totalAmount?.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Paid To Date</div>
            <div className="text-sm font-bold text-emerald-600">${invoice.amountPaid?.toFixed(2) || '0.00'}</div>
          </div>
          <div>
            <div className="text-slate-400 font-medium">Balance Due</div>
            <div className="text-sm font-bold text-rose-600">${remainingBalance.toFixed(2)}</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="BANK_TRANSFER">Bank Wire / ACH Transfer</option>
              <option value="CARD">Credit / Debit Card</option>
              <option value="UPI">UPI Instant Pay</option>
              <option value="MANUAL">Manual Cash / Cheque</option>
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Payment Amount ($)</label>
              <button
                type="button"
                onClick={handleFullAmount}
                className="text-[11px] text-emerald-600 font-medium hover:underline"
              >
                Pay Full Balance (${remainingBalance.toFixed(2)})
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter amount, max $${remainingBalance.toFixed(2)}`}
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction / Reference ID
            </label>
            <input
              type="text"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. WIRE-881920 or ch_3N82..."
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Memo, check number, or reconciliation notes..."
              className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
