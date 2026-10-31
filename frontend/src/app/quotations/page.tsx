'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { apiRequest } from '../../lib/api';
import { NewSubscriptionModal } from '../../components/NewSubscriptionModal';
import {
  FileText,
  Plus,
  Sparkles,
  ArrowRight,
  Clock,
  Package,
  Layers,
} from 'lucide-react';

export default function QuotationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const [templates, setTemplates] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isNewSubModalOpen, setIsNewSubModalOpen] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  // New Template form state
  const [templateName, setTemplateName] = useState('');
  const [defaultPlanId, setDefaultPlanId] = useState('');
  const [validityDays, setValidityDays] = useState(30);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role === 'CUSTOMER') {
        router.push('/portal');
      } else {
        loadData();
      }
    }
  }, [user, isLoading, router]);

  const loadData = async () => {
    const [tmplRes, planRes, prodRes] = await Promise.all([
      apiRequest('/catalog/quotation-templates'),
      apiRequest('/catalog/plans'),
      apiRequest('/catalog/products'),
    ]);

    if (tmplRes.success) setTemplates(tmplRes.data?.templates || []);
    if (planRes.success) setPlans(planRes.data?.plans || []);
    if (prodRes.success) setProducts(prodRes.data?.products || []);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest('/catalog/quotation-templates', {
      method: 'POST',
      body: JSON.stringify({
        name: templateName,
        defaultPlanId: defaultPlanId || null,
        validityDays: Number(validityDays),
        templateLines: [],
      }),
    });

    if (res.success) {
      setBanner(`Created template: ${templateName}`);
      setTemplateName('');
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Quotation Templates & Proposal Engine
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure reusable sales bundles to spin up standardized subscription proposals in seconds.
          </p>
        </div>

        <button
          onClick={() => setIsNewSubModalOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Spin Up Quote from Template</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates Grid */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {templates.map((tmpl) => {
              const plan = plans.find((p) => p.id === tmpl.defaultPlanId);

              return (
                <div
                  key={tmpl.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <span className="flex items-center space-x-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        <Clock className="w-3 h-3" />
                        <span>Valid {tmpl.validityDays} Days</span>
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                      {tmpl.name}
                    </h3>

                    <div className="mt-2 text-xs text-slate-500 space-y-1">
                      <div>
                        Default Plan:{' '}
                        <strong className="text-slate-800 font-medium">
                          {plan ? `${plan.name} ($${plan.basePrice})` : 'Flexible / None'}
                        </strong>
                      </div>
                      <div>
                        Bundled Products:{' '}
                        <span className="font-semibold text-slate-700">
                          {Array.isArray(tmpl.templateLines) ? tmpl.templateLines.length : 0} items
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Lockable Quotation</span>
                    <button
                      onClick={() => setIsNewSubModalOpen(true)}
                      className="inline-flex items-center space-x-1 text-xs text-emerald-600 font-bold hover:underline"
                    >
                      <span>Create Quote</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Template Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit text-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Create Proposal Template</h3>
          <form onSubmit={handleCreateTemplate} className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Template Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g. Standard SaaS Growth Bundle"
                className="w-full p-2 rounded-xl border border-slate-300"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Default Plan</label>
              <select
                value={defaultPlanId}
                onChange={(e) => setDefaultPlanId(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="">-- Optional / Any Plan --</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.billingCadence})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Quote Validity (Days)</label>
              <input
                type="number"
                value={validityDays}
                onChange={(e) => setValidityDays(Number(e.target.value))}
                className="w-full p-2 rounded-xl border border-slate-300 font-mono"
                min="1"
                max="90"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
            >
              Save Template
            </button>
          </form>
        </div>
      </div>

      <NewSubscriptionModal
        isOpen={isNewSubModalOpen}
        onClose={() => setIsNewSubModalOpen(false)}
        onSuccess={() => {
          setBanner('Subscription / Quote created successfully!');
          router.push('/subscriptions');
        }}
      />
    </div>
  );
}
