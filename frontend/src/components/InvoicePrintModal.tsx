'use client';

import React from 'react';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface InvoicePrintModalProps {
  invoice: any;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  invoice,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const periodStart = invoice.periodStart
    ? new Date(invoice.periodStart).toLocaleDateString()
    : 'N/A';
  const periodEnd = invoice.periodEnd
    ? new Date(invoice.periodEnd).toLocaleDateString()
    : 'N/A';
  const dueDate = invoice.dueDate
    ? new Date(invoice.dueDate).toLocaleDateString()
    : 'N/A';
  const balanceDue = Number(
    (invoice.totalAmount - (invoice.amountPaid || 0)).toFixed(2)
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-slate-100 print:shadow-none print:border-none print:w-full print:max-w-full">
        {/* Modal Controls - Hidden during print */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Document Preview
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document */}
        <div className="pt-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <div className="text-2xl font-black tracking-tight text-slate-900 flex items-center space-x-2">
                <span className="text-emerald-600">Brightloop</span>
                <span className="text-slate-400 text-sm font-normal">Platform Inc.</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                100 Silicon Blvd, Suite 400<br />
                San Francisco, CA 94107 • billing@brightloop.io
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-extrabold text-slate-900 uppercase tracking-tight">
                INVOICE
              </h2>
              <div className="text-sm font-mono font-bold text-slate-700 mt-0.5">
                {invoice.invoiceNumber}
              </div>
              <div className="mt-2">
                <StatusBadge status={invoice.status} />
              </div>
            </div>
          </div>

          {/* Bill To & Metadata */}
          <div className="mt-8 grid grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Billed To
              </span>
              <div className="font-bold text-slate-900 text-sm">
                {invoice.customer?.companyName || invoice.customer?.name}
              </div>
              <div className="text-slate-600 mt-0.5">{invoice.customer?.name}</div>
              <div className="text-slate-500">{invoice.customer?.email}</div>
              {invoice.customer?.address && (
                <div className="text-slate-500 mt-1">{invoice.customer?.address}</div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-right">
              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                  Billing Period
                </span>
                <span className="font-medium text-slate-700">
                  {periodStart} – {periodEnd}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                  Payment Terms
                </span>
                <span className="font-medium text-slate-700">Net 15 Days</span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                  Invoice Date
                </span>
                <span className="font-medium text-slate-700">
                  {new Date(invoice.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 uppercase tracking-wider block">
                  Due Date
                </span>
                <span className="font-bold text-rose-600">{dueDate}</span>
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="w-full mt-6 text-left border-collapse text-xs">
            <thead>
              <tr className="border-b-2 border-slate-200 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-2.5">Item Description</th>
                <th className="py-2.5 text-center">Qty</th>
                <th className="py-2.5 text-right">Unit Price</th>
                <th className="py-2.5 text-right">Tax</th>
                <th className="py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoice.lines && invoice.lines.length > 0 ? (
                invoice.lines.map((line: any) => (
                  <tr key={line.id}>
                    <td className="py-3 font-medium text-slate-900">{line.description}</td>
                    <td className="py-3 text-center">{line.quantity}</td>
                    <td className="py-3 text-right font-mono">${line.unitPrice?.toFixed(2)}</td>
                    <td className="py-3 text-right font-mono text-slate-500">
                      ${line.taxAmount?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-slate-900">
                      ${line.lineTotal?.toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-400">
                    No line items attached.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Summary / Calculation Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">${invoice.subtotal?.toFixed(2)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Applied Discount:</span>
                  <span className="font-mono font-medium">
                    -${invoice.discountAmount?.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Total Tax:</span>
                <span className="font-mono font-medium">${invoice.taxAmount?.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount:</span>
                <span className="font-mono text-emerald-700">${invoice.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1">
                <span>Amount Paid:</span>
                <span className="font-mono font-medium text-emerald-600">
                  ${invoice.amountPaid?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between font-bold text-xs">
                <span className="text-slate-800">Balance Due:</span>
                <span className={`font-mono ${balanceDue > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                  ${balanceDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payments Record List */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mt-8 pt-4 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Recorded Payments
              </span>
              <div className="space-y-1.5">
                {invoice.payments.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex justify-between items-center text-xs p-2 rounded bg-slate-50 border border-slate-100 font-mono"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-emerald-700">[{p.paymentMethod}]</span>
                      <span className="text-slate-600">
                        {new Date(p.paymentDate).toLocaleDateString()}
                      </span>
                      {p.referenceId && (
                        <span className="text-slate-400 text-[11px]">Ref: {p.referenceId}</span>
                      )}
                    </div>
                    <div className="font-bold text-emerald-700">+${p.amount?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Notes */}
          <div className="mt-10 pt-4 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Thank you for choosing Brightloop. Automated Recurring Billing Platform.
          </div>
        </div>
      </div>
    </div>
  );
};
