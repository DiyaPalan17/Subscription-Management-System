'use client';

import React, { useState, useEffect } from 'react';
import { apiRequest } from '../lib/api';
import { X, Plus, Trash2, Layers, Sparkles } from 'lucide-react';

interface NewSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewSubscriptionModal: React.FC<NewSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [taxRules, setTaxRules] = useState<any[]>([]);
  const [discountRules, setDiscountRules] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedDiscountId, setSelectedDiscountId] = useState('');
  const [paymentTermsDays, setPaymentTermsDays] = useState(15);
  const [notes, setNotes] = useState('');

  const [lines, setLines] = useState<
    Array<{
      productId: string;
      variantId: string;
      quantity: number;
      unitPrice: number;
      taxRuleId: string;
    }>
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  const loadInitialData = async () => {
    const [custRes, planRes, prodRes, taxRes, discRes, tmplRes] = await Promise.all([
      apiRequest('/auth/customers'),
      apiRequest('/catalog/plans'),
      apiRequest('/catalog/products'),
      apiRequest('/catalog/tax-rules'),
      apiRequest('/catalog/discount-rules'),
      apiRequest('/catalog/quotation-templates'),
    ]);

    if (custRes.success) setCustomers(custRes.data?.customers || []);
    if (planRes.success) setPlans(planRes.data?.plans || []);
    if (prodRes.success) setProducts(prodRes.data?.products || []);
    if (taxRes.success) setTaxRules(taxRes.data?.taxRules || []);
    if (discRes.success) setDiscountRules(discRes.data?.discountRules || []);
    if (tmplRes.success) setTemplates(tmplRes.data?.templates || []);

    if (custRes.data?.customers?.length > 0) {
      setSelectedCustomerId(custRes.data.customers[0].id);
    }
    if (planRes.data?.plans?.length > 0) {
      setSelectedPlanId(planRes.data.plans[0].id);
    }
  };

  // Spin up from template
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      if (tmpl.defaultPlanId) {
        setSelectedPlanId(tmpl.defaultPlanId);
      }
      if (Array.isArray(tmpl.templateLines) && tmpl.templateLines.length > 0) {
        const newLines = tmpl.templateLines.map((tl: any) => {
          const prod = products.find((p) => p.id === tl.productId);
          let price = prod ? prod.salesPrice : 0;
          if (tl.variantId && prod?.variants) {
            const v = prod.variants.find((v: any) => v.id === tl.variantId);
            if (v) price += v.priceAdjustment;
          }
          return {
            productId: tl.productId,
            variantId: tl.variantId || '',
            quantity: tl.quantity || 1,
            unitPrice: price,
            taxRuleId: tl.taxRuleId || (taxRules[0]?.id || ''),
          };
        });
        setLines(newLines);
      }
    }
  };

  const addLine = () => {
    if (products.length === 0) return;
    const defaultProd = products[0];
    setLines([
      ...lines,
      {
        productId: defaultProd.id,
        variantId: defaultProd.variants?.[0]?.id || '',
        quantity: 1,
        unitPrice: defaultProd.salesPrice + (defaultProd.variants?.[0]?.priceAdjustment || 0),
        taxRuleId: taxRules[0]?.id || '',
      },
    ]);
  };

  const updateLineProduct = (index: number, productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const newLines = [...lines];
    newLines[index].productId = productId;
    newLines[index].variantId = prod.variants?.[0]?.id || '';
    newLines[index].unitPrice = prod.salesPrice + (prod.variants?.[0]?.priceAdjustment || 0);
    setLines(newLines);
  };

  const updateLineVariant = (index: number, variantId: string) => {
    const newLines = [...lines];
    const line = newLines[index];
    line.variantId = variantId;
    const prod = products.find((p) => p.id === line.productId);
    if (prod) {
      let price = prod.salesPrice;
      const v = prod.variants?.find((va: any) => va.id === variantId);
      if (v) price += v.priceAdjustment;
      line.unitPrice = price;
    }
    setLines(newLines);
  };

  const updateLine = (index: number, field: string, val: any) => {
    const newLines = [...lines];
    (newLines[index] as any)[field] = val;
    setLines(newLines);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId || !selectedPlanId) {
      setError('Customer and Plan are required');
      return;
    }

    setIsSubmitting(true);
    const res = await apiRequest('/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        customerId: selectedCustomerId,
        planId: selectedPlanId,
        templateId: selectedTemplateId || null,
        discountRuleId: selectedDiscountId || null,
        paymentTermsDays: Number(paymentTermsDays),
        notes: notes || null,
        lines: lines.map((l) => ({
          productId: l.productId,
          variantId: l.variantId || null,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          taxRuleId: l.taxRuleId || null,
        })),
      }),
    });
    setIsSubmitting(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.message || 'Failed to create subscription');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Create Subscription or Quote</h3>
              <p className="text-xs text-slate-500">
                Starts in DRAFT status, ready to transition to Quotation or Active billing.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {/* Quotation Template Pre-fill option */}
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-purple-900 font-medium">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Spin up from Quote Template:</span>
            </div>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleTemplateSelect(e.target.value)}
              className="text-xs rounded-lg border border-purple-200 p-1.5 bg-white text-purple-900 font-medium focus:ring-2 focus:ring-purple-500"
            >
              <option value="">-- Custom (No Template) --</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.validityDays}d)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Customer</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-emerald-500"
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName || c.name} ({c.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Billing Plan</label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-emerald-500"
                required
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} • ${p.basePrice}/cycle ({p.billingCadence})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Discount Coupon (Optional)</label>
              <select
                value={selectedDiscountId}
                onChange={(e) => setSelectedDiscountId(e.target.value)}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- No Discount --</option>
                {discountRules.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} • {d.type === 'PERCENTAGE' ? `${d.value}% Off` : `$${d.value} Flat`} (Min ${d.minSpend})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Payment Terms (Days)</label>
              <input
                type="number"
                value={paymentTermsDays}
                onChange={(e) => setPaymentTermsDays(Number(e.target.value))}
                className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-emerald-500"
                min="0"
                max="90"
              />
            </div>
          </div>

          {/* Line Items Builder */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800">Subscription Line Items</span>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg text-slate-400">
                No extra line items added yet. Click &quot;Add Product&quot; or choose a template above.
              </div>
            ) : (
              <div className="space-y-2">
                {lines.map((line, idx) => {
                  const currentProd = products.find((p) => p.id === line.productId);
                  const variants = currentProd?.variants || [];

                  return (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-4">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Product</label>
                        <select
                          value={line.productId}
                          onChange={(e) => updateLineProduct(idx, e.target.value)}
                          className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                        >
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-3">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Variant</label>
                        <select
                          value={line.variantId}
                          onChange={(e) => updateLineVariant(idx, e.target.value)}
                          className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white"
                        >
                          <option value="">Base (No Variant)</option>
                          {variants.map((v: any) => (
                            <option key={v.id} value={v.id}>
                              {v.value} (+${v.priceAdjustment})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-1">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, 'quantity', e.target.value)}
                          className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white text-center"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-0.5">Unit ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={line.unitPrice}
                          onChange={(e) => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                          className="w-full text-xs rounded border border-slate-300 p-1.5 bg-white font-mono"
                        />
                      </div>

                      <div className="col-span-2 flex items-center justify-end space-x-1 pt-3">
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Remove line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Notes / Terms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enterprise agreement notes or SLA clauses..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create Subscription (DRAFT)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
