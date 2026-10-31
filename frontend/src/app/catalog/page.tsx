'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { apiRequest } from '../../lib/api';
import {
  Package,
  Plus,
  Layers,
  Percent,
  Calendar,
  DollarSign,
  Tag,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';

export default function CatalogPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'PLANS' | 'TAXES' | 'DISCOUNTS'>('PRODUCTS');
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [discounts, setDiscounts] = useState<any[]>([]);

  // Product Create Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdType, setNewProdType] = useState('SOFTWARE');
  const [newProdSalesPrice, setNewProdSalesPrice] = useState('100');
  const [newProdCostPrice, setNewProdCostPrice] = useState('20');
  const [newProdNotes, setNewProdNotes] = useState('');

  // Variant State for adding variant to product
  const [selectedProductIdForVariant, setSelectedProductIdForVariant] = useState<string | null>(null);
  const [variantName, setVariantName] = useState('Brand Connector');
  const [variantValue, setVariantValue] = useState('Odoo Enterprise');
  const [variantAdjustment, setVariantAdjustment] = useState('560.00');

  // Plan Create Form State
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanCadence, setNewPlanCadence] = useState('MONTHLY');
  const [newPlanBasePrice, setNewPlanBasePrice] = useState('499');

  // Discount Create Form State
  const [newDiscCode, setNewDiscCode] = useState('');
  const [newDiscType, setNewDiscType] = useState('PERCENTAGE');
  const [newDiscValue, setNewDiscValue] = useState('15');
  const [newDiscMinSpend, setNewDiscMinSpend] = useState('100');

  // Tax Create Form State
  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('18');

  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        loadCatalog();
      }
    }
  }, [user, isLoading, router]);

  const loadCatalog = async () => {
    const [prodRes, planRes, taxRes, discRes] = await Promise.all([
      apiRequest('/catalog/products'),
      apiRequest('/catalog/plans'),
      apiRequest('/catalog/tax-rules'),
      apiRequest('/catalog/discount-rules'),
    ]);

    if (prodRes.success) setProducts(prodRes.data?.products || []);
    if (planRes.success) setPlans(planRes.data?.plans || []);
    if (taxRes.success) setTaxes(taxRes.data?.taxRules || []);
    if (discRes.success) setDiscounts(discRes.data?.discountRules || []);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/catalog/products', {
      method: 'POST',
      body: JSON.stringify({
        name: newProdName,
        type: newProdType,
        salesPrice: parseFloat(newProdSalesPrice),
        costPrice: parseFloat(newProdCostPrice),
        notes: newProdNotes,
      }),
    });
    if (res.success) {
      setBanner(`Created product: ${newProdName}`);
      setNewProdName('');
      loadCatalog();
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductIdForVariant) return;

    const res = await apiRequest(`/catalog/products/${selectedProductIdForVariant}/variants`, {
      method: 'POST',
      body: JSON.stringify({
        name: variantName,
        value: variantValue,
        priceAdjustment: parseFloat(variantAdjustment),
      }),
    });
    if (res.success) {
      setBanner(`Added variant: ${variantValue} (+$${variantAdjustment})`);
      setSelectedProductIdForVariant(null);
      loadCatalog();
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/catalog/plans', {
      method: 'POST',
      body: JSON.stringify({
        name: newPlanName,
        billingCadence: newPlanCadence,
        basePrice: parseFloat(newPlanBasePrice),
      }),
    });
    if (res.success) {
      setBanner(`Created billing plan: ${newPlanName}`);
      setNewPlanName('');
      loadCatalog();
    }
  };

  const handleCreateTax = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/catalog/tax-rules', {
      method: 'POST',
      body: JSON.stringify({
        name: newTaxName,
        ratePercentage: parseFloat(newTaxRate),
      }),
    });
    if (res.success) {
      setBanner(`Created tax rule: ${newTaxName} (${newTaxRate}%)`);
      setNewTaxName('');
      loadCatalog();
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/catalog/discount-rules', {
      method: 'POST',
      body: JSON.stringify({
        code: newDiscCode,
        type: newDiscType,
        value: parseFloat(newDiscValue),
        minSpend: parseFloat(newDiscMinSpend),
      }),
    });
    if (res.success) {
      setBanner(`Created discount rule: ${newDiscCode}`);
      setNewDiscCode('');
      loadCatalog();
    }
  };

  if (isLoading || !user || user.role !== 'ADMIN') return null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Product & Financial Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin configuration for Products, Brand Variants (e.g. Odoo +$560.00), Cadence Plans, Taxes, and Discounts.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-xs">
          <button
            onClick={() => setActiveTab('PRODUCTS')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'PRODUCTS' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Products & Variants
          </button>
          <button
            onClick={() => setActiveTab('PLANS')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'PLANS' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cadence Plans
          </button>
          <button
            onClick={() => setActiveTab('TAXES')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'TAXES' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tax Rules
          </button>
          <button
            onClick={() => setActiveTab('DISCOUNTS')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'DISCOUNTS' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Discounts
          </button>
        </div>
      </div>

      {banner && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs border border-emerald-200 flex justify-between items-center">
          <span>{banner}</span>
          <button onClick={() => setBanner(null)} className="font-bold">
            ×
          </button>
        </div>
      )}

      {/* PRODUCTS & VARIANTS TAB */}
      {activeTab === 'PRODUCTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Products in Catalog ({products.length})
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {products.map((p) => (
                  <div key={p.id} className="p-4 hover:bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                          <span>{p.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {p.type}
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">{p.notes || 'No description'}</p>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-slate-900">
                          ${p.salesPrice?.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-400">Cost: ${p.costPrice?.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Variants list */}
                    <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Variants:</span>
                        {p.variants && p.variants.length > 0 ? (
                          p.variants.map((v: any) => (
                            <span
                              key={v.id}
                              className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium"
                            >
                              {v.name}: {v.value} (+${v.priceAdjustment})
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400">No variants</span>
                        )}
                      </div>

                      <button
                        onClick={() => setSelectedProductIdForVariant(p.id)}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold"
                      >
                        + Add Variant
                      </button>
                    </div>

                    {/* Add Variant Inline Form */}
                    {selectedProductIdForVariant === p.id && (
                      <form
                        onSubmit={handleAddVariant}
                        className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-4 gap-2 items-end text-xs"
                      >
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Variant Name</label>
                          <input
                            type="text"
                            value={variantName}
                            onChange={(e) => setVariantName(e.target.value)}
                            placeholder="e.g. Brand"
                            className="w-full p-1.5 rounded border border-slate-300 bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Value</label>
                          <input
                            type="text"
                            value={variantValue}
                            onChange={(e) => setVariantValue(e.target.value)}
                            placeholder="e.g. Odoo"
                            className="w-full p-1.5 rounded border border-slate-300 bg-white"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-0.5">Price (+ $)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={variantAdjustment}
                            onChange={(e) => setVariantAdjustment(e.target.value)}
                            placeholder="560.00"
                            className="w-full p-1.5 rounded border border-slate-300 bg-white font-mono"
                            required
                          />
                        </div>
                        <div className="flex space-x-1">
                          <button
                            type="submit"
                            className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedProductIdForVariant(null)}
                            className="px-2 py-1.5 bg-slate-200 text-slate-700 rounded text-xs"
                          >
                            ×
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Create Product Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add New Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="e.g. AI Automation Engine"
                  className="w-full p-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={newProdType}
                  onChange={(e) => setNewProdType(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="SOFTWARE">Software / Seat</option>
                  <option value="ADDON">Addon / Quota</option>
                  <option value="SERVICE">Service / Advisory</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sales Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdSalesPrice}
                    onChange={(e) => setNewProdSalesPrice(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newProdCostPrice}
                    onChange={(e) => setNewProdCostPrice(e.target.value)}
                    className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={newProdNotes}
                  onChange={(e) => setNewProdNotes(e.target.value)}
                  placeholder="Product specification notes..."
                  className="w-full p-2 rounded-xl border border-slate-300"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
              >
                Create Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CADENCE PLANS TAB */}
      {activeTab === 'PLANS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase font-semibold">
                  <th className="p-3.5">Plan Name</th>
                  <th className="p-3.5">Cadence</th>
                  <th className="p-3.5">Base Price</th>
                  <th className="p-3.5">Pause</th>
                  <th className="p-3.5">Early Close</th>
                  <th className="p-3.5">Auto-Close Expired</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plans.map((pl) => (
                  <tr key={pl.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-900">{pl.name}</td>
                    <td className="p-3.5 font-semibold text-emerald-700">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                        {pl.billingCadence}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      ${pl.basePrice?.toFixed(2)}
                    </td>
                    <td className="p-3.5">{pl.allowPause ? '✓ Allowed' : '—'}</td>
                    <td className="p-3.5">{pl.allowEarlyClose ? '✓ Allowed' : '—'}</td>
                    <td className="p-3.5">{pl.autoCloseOnExpiry ? '✓ Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Create Plan Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Billing Plan</h3>
            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan Name</label>
                <input
                  type="text"
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. Enterprise Custom"
                  className="w-full p-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Billing Cadence</label>
                <select
                  value={newPlanCadence}
                  onChange={(e) => setNewPlanCadence(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="DAILY">Daily (30x monthly factor)</option>
                  <option value="WEEKLY">Weekly (52/12 factor)</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly (1/12 monthly factor)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Base Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newPlanBasePrice}
                  onChange={(e) => setNewPlanBasePrice(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
              >
                Create Plan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAX RULES TAB */}
      {activeTab === 'TAXES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase font-semibold">
                  <th className="p-3.5">Tax Name</th>
                  <th className="p-3.5">Rate Percentage</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {taxes.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-900">{t.name}</td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">{t.ratePercentage}%</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Tax Rule</h3>
            <form onSubmit={handleCreateTax} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={newTaxName}
                  onChange={(e) => setNewTaxName(e.target.value)}
                  placeholder="e.g. EU Digital Services Tax"
                  className="w-full p-2 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newTaxRate}
                  onChange={(e) => setNewTaxRate(e.target.value)}
                  placeholder="18.00"
                  className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
              >
                Create Tax Rule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DISCOUNTS TAB */}
      {activeTab === 'DISCOUNTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-slate-400 uppercase font-semibold">
                  <th className="p-3.5">Promo Code</th>
                  <th className="p-3.5">Discount</th>
                  <th className="p-3.5">Scope</th>
                  <th className="p-3.5">Min Spend</th>
                  <th className="p-3.5">Redemptions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-mono font-bold text-emerald-700">{d.code}</td>
                    <td className="p-3.5 font-bold text-slate-900">
                      {d.type === 'PERCENTAGE' ? `${d.value}% Off` : `$${d.value} Flat`}
                    </td>
                    <td className="p-3.5 text-slate-600">{d.targetScope}</td>
                    <td className="p-3.5 font-mono">${d.minSpend}</td>
                    <td className="p-3.5 font-mono text-slate-700">
                      {d.timesRedeemed} / {d.maxRedemptions || '∞'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit text-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Add Discount Coupon</h3>
            <form onSubmit={handleCreateDiscount} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Coupon Code</label>
                <input
                  type="text"
                  value={newDiscCode}
                  onChange={(e) => setNewDiscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. FLASH30"
                  className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Type</label>
                <select
                  value={newDiscType}
                  onChange={(e) => setNewDiscType(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 bg-white"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount ($)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Value (% or $)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newDiscValue}
                  onChange={(e) => setNewDiscValue(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Min Spend ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newDiscMinSpend}
                  onChange={(e) => setNewDiscMinSpend(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
              >
                Create Discount
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
