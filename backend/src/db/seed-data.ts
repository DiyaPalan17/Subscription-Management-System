import bcrypt from 'bcryptjs';
import {
  UserEntity,
  ProductEntity,
  ProductVariantEntity,
  PlanEntity,
  TaxRuleEntity,
  DiscountRuleEntity,
  QuotationTemplateEntity,
  SubscriptionEntity,
  SubscriptionLineEntity,
  InvoiceEntity,
  InvoiceLineEntity,
  PaymentEntity,
} from '../types';

export const getInitialSeedData = () => {
  const adminPasswordHash = bcrypt.hashSync('Admin@12345!', 10);
  const staffPasswordHash = bcrypt.hashSync('Staff@12345!', 10);
  const customerPasswordHash = bcrypt.hashSync('Customer@12345!', 10);

  const now = new Date('2026-10-31T09:00:00Z');
  const past30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const past45Days = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  const past70Days = new Date(now.getTime() - 70 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Users
  const users: UserEntity[] = [
    {
      id: 'usr-admin-1',
      email: 'admin@brightloop.io',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      name: 'Sarah Connor (Admin)',
      companyName: 'Brightloop HQ',
      phone: '+1-555-0100',
      address: '100 Silicon Blvd, Suite 400, San Francisco, CA',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-staff-1',
      email: 'staff@brightloop.io',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
      name: 'Alex Vance (Billing Ops)',
      companyName: 'Brightloop HQ',
      phone: '+1-555-0101',
      address: '100 Silicon Blvd, Suite 400, San Francisco, CA',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-cust-1',
      email: 'customer@acme.com',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      name: 'Miles Dyson',
      companyName: 'Acme Cybernetics Corp',
      phone: '+1-555-0199',
      address: '742 Evergreen Terrace, Springfield, OR',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr-cust-2',
      email: 'customer@globex.com',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      name: 'Hank Scorpio',
      companyName: 'Globex Corporation',
      phone: '+1-555-0255',
      address: '1 Cypress Creek Way, Eugene, OR',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Products
  const products: ProductEntity[] = [
    {
      id: 'prod-saas-core',
      name: 'Brightloop Core Platform Seat',
      type: 'SOFTWARE',
      salesPrice: 200.0,
      costPrice: 40.0,
      notes: 'Monthly user seat for access to core ERP and billing automation.',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-addon-api',
      name: 'High-Volume API Metering (100k req)',
      type: 'ADDON',
      salesPrice: 150.0,
      costPrice: 25.0,
      notes: 'Additional metered REST & Webhook quota block.',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-srv-sla',
      name: '24/7 Dedicated SLA & Architecture Advisory',
      type: 'SERVICE',
      salesPrice: 500.0,
      costPrice: 150.0,
      notes: 'Guaranteed 15-minute response time + monthly strategy review.',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Variants (e.g. Brand = 'Odoo' adds +560.00 as requested in specification)
  const variants: ProductVariantEntity[] = [
    {
      id: 'var-brand-odoo',
      productId: 'prod-saas-core',
      name: 'Integration Brand',
      value: 'Odoo Enterprise Connector',
      priceAdjustment: 560.0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'var-brand-salesforce',
      productId: 'prod-saas-core',
      name: 'Integration Brand',
      value: 'Salesforce Sync Engine',
      priceAdjustment: 350.0,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'var-api-premium',
      productId: 'prod-addon-api',
      name: 'Rate Limit',
      value: 'Uncapped Burst (1000 req/s)',
      priceAdjustment: 100.0,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Plans
  const plans: PlanEntity[] = [
    {
      id: 'plan-growth-monthly',
      name: 'Growth Monthly Plan',
      billingCadence: 'MONTHLY',
      basePrice: 500.0,
      minQuantity: 1,
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: null,
      autoCloseOnExpiry: true,
      allowEarlyClose: true,
      allowPause: true,
      allowRenewal: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'plan-enterprise-yearly',
      name: 'Enterprise Annual Plan',
      billingCadence: 'YEARLY',
      basePrice: 5000.0,
      minQuantity: 5,
      startDate: new Date('2025-01-01T00:00:00Z'),
      endDate: null,
      autoCloseOnExpiry: false,
      allowEarlyClose: true,
      allowPause: true,
      allowRenewal: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'plan-weekly-pilot',
      name: 'Sprint Weekly Pilot',
      billingCadence: 'WEEKLY',
      basePrice: 150.0,
      minQuantity: 1,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: null,
      autoCloseOnExpiry: true,
      allowEarlyClose: true,
      allowPause: false,
      allowRenewal: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Taxes
  const taxRules: TaxRuleEntity[] = [
    {
      id: 'tax-vat-18',
      name: 'Standard GST / VAT (18%)',
      ratePercentage: 18.0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tax-us-state',
      name: 'US Tech Sales Tax (8.25%)',
      ratePercentage: 8.25,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tax-zero',
      name: 'Zero-Tax Export (0%)',
      ratePercentage: 0.0,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Discounts
  const discountRules: DiscountRuleEntity[] = [
    {
      id: 'disc-welcome-20',
      code: 'WELCOME20',
      type: 'PERCENTAGE',
      value: 20.0,
      targetScope: 'SUBSCRIPTION',
      minSpend: 200.0,
      minQuantity: 1,
      maxRedemptions: 50,
      timesRedeemed: 3,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-12-31T23:59:59Z'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'disc-save-100',
      code: 'FLAT100',
      type: 'FIXED',
      value: 100.0,
      targetScope: 'SUBSCRIPTION',
      minSpend: 400.0,
      minQuantity: 1,
      maxRedemptions: 20,
      timesRedeemed: 5,
      startDate: new Date('2026-01-01T00:00:00Z'),
      endDate: new Date('2027-12-31T23:59:59Z'),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Quotation Templates
  const quotationTemplates: QuotationTemplateEntity[] = [
    {
      id: 'tmpl-growth-bundle',
      name: 'Growth SaaS + Support Bundle',
      defaultPlanId: 'plan-growth-monthly',
      validityDays: 14,
      templateLines: [
        {
          productId: 'prod-saas-core',
          variantId: 'var-brand-odoo',
          quantity: 2,
          taxRuleId: 'tax-vat-18',
        },
        {
          productId: 'prod-addon-api',
          variantId: 'var-api-premium',
          quantity: 1,
          taxRuleId: 'tax-vat-18',
        },
        {
          productId: 'prod-srv-sla',
          quantity: 1,
          taxRuleId: 'tax-vat-18',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tmpl-enterprise-pilot',
      name: 'Enterprise Annual Acceleration',
      defaultPlanId: 'plan-enterprise-yearly',
      validityDays: 30,
      templateLines: [
        {
          productId: 'prod-saas-core',
          quantity: 10,
          taxRuleId: 'tax-us-state',
        },
        {
          productId: 'prod-srv-sla',
          quantity: 1,
          taxRuleId: 'tax-us-state',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Subscriptions
  const subscriptions: SubscriptionEntity[] = [
    {
      id: 'sub-acme-active',
      subscriptionNumber: 'SUB-1001',
      customerId: 'usr-cust-1',
      planId: 'plan-growth-monthly',
      discountRuleId: 'disc-welcome-20',
      status: 'ACTIVE',
      startDate: past30Days,
      currentPeriodStart: past30Days,
      currentPeriodEnd: now,
      nextBillingDate: now, // Due for billing right now!
      expiryDate: new Date('2027-10-31T00:00:00Z'),
      paymentTermsDays: 15,
      validUntil: null,
      notes: 'Key enterprise growth account with Odoo sync integration.',
      createdAt: past30Days,
      updatedAt: now,
    },
    {
      id: 'sub-globex-active',
      subscriptionNumber: 'SUB-1002',
      customerId: 'usr-cust-2',
      planId: 'plan-enterprise-yearly',
      discountRuleId: null,
      status: 'ACTIVE',
      startDate: past70Days,
      currentPeriodStart: past70Days,
      currentPeriodEnd: nextMonth,
      nextBillingDate: nextMonth,
      expiryDate: new Date('2028-01-01T00:00:00Z'),
      paymentTermsDays: 30,
      validUntil: null,
      notes: 'Enterprise account with 10 platform seats.',
      createdAt: past70Days,
      updatedAt: past70Days,
    },
    {
      id: 'sub-acme-quote',
      subscriptionNumber: 'SUB-1003',
      customerId: 'usr-cust-1',
      planId: 'plan-growth-monthly',
      discountRuleId: 'disc-save-100',
      status: 'QUOTATION',
      startDate: now,
      currentPeriodStart: now,
      currentPeriodEnd: nextMonth,
      nextBillingDate: nextMonth,
      expiryDate: null,
      paymentTermsDays: 15,
      validUntil: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // Locked quotation valid for 14 days
      notes: 'Expansion proposal for supplementary division.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Subscription Lines
  const subscriptionLines: SubscriptionLineEntity[] = [
    {
      id: 'subline-1',
      subscriptionId: 'sub-acme-active',
      productId: 'prod-saas-core',
      variantId: 'var-brand-odoo',
      quantity: 3,
      unitPrice: 760.0, // 200 + 560 Odoo connector
      taxRuleId: 'tax-vat-18',
      createdAt: past30Days,
      updatedAt: past30Days,
    },
    {
      id: 'subline-2',
      subscriptionId: 'sub-acme-active',
      productId: 'prod-addon-api',
      variantId: 'var-api-premium',
      quantity: 2,
      unitPrice: 250.0, // 150 + 100
      taxRuleId: 'tax-vat-18',
      createdAt: past30Days,
      updatedAt: past30Days,
    },
    {
      id: 'subline-3',
      subscriptionId: 'sub-globex-active',
      productId: 'prod-saas-core',
      variantId: null,
      quantity: 10,
      unitPrice: 200.0,
      taxRuleId: 'tax-us-state',
      createdAt: past70Days,
      updatedAt: past70Days,
    },
    {
      id: 'subline-4',
      subscriptionId: 'sub-globex-active',
      productId: 'prod-srv-sla',
      variantId: null,
      quantity: 1,
      unitPrice: 500.0,
      taxRuleId: 'tax-us-state',
      createdAt: past70Days,
      updatedAt: past70Days,
    },
    {
      id: 'subline-5',
      subscriptionId: 'sub-acme-quote',
      productId: 'prod-saas-core',
      variantId: 'var-brand-salesforce',
      quantity: 2,
      unitPrice: 550.0, // 200 + 350
      taxRuleId: 'tax-vat-18',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Invoices
  // 1. Paid invoice for Acme (from previous billing period)
  // 2. Partially paid invoice for Globex (due recently)
  // 3. Overdue invoice for Globex (due 40 days ago -> demonstrates Aging A/R!)
  const invoices: InvoiceEntity[] = [
    {
      id: 'inv-2026-0001',
      invoiceNumber: 'INV-2026-0001',
      subscriptionId: 'sub-acme-active',
      customerId: 'usr-cust-1',
      periodStart: past70Days,
      periodEnd: past30Days,
      status: 'PAID',
      subtotal: 2780.0,
      discountAmount: 556.0, // 20% discount
      taxAmount: 400.32,
      totalAmount: 2624.32,
      amountPaid: 2624.32,
      dueDate: new Date(past70Days.getTime() + 15 * 24 * 60 * 60 * 1000),
      notes: 'Initial activation billing cycle.',
      createdAt: past70Days,
      updatedAt: past30Days,
    },
    {
      id: 'inv-2026-0002',
      invoiceNumber: 'INV-2026-0002',
      subscriptionId: 'sub-globex-active',
      customerId: 'usr-cust-2',
      periodStart: past45Days,
      periodEnd: now,
      status: 'CONFIRMED',
      subtotal: 2500.0,
      discountAmount: 0.0,
      taxAmount: 206.25,
      totalAmount: 2706.25,
      amountPaid: 1000.0, // Partial payment
      dueDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // Due in 10 days
      notes: 'Mid-term platform seats expansion invoice.',
      createdAt: past45Days,
      updatedAt: past30Days,
    },
    {
      id: 'inv-2026-0003',
      invoiceNumber: 'INV-2026-0003',
      subscriptionId: 'sub-globex-active',
      customerId: 'usr-cust-2',
      periodStart: new Date(past70Days.getTime() - 30 * 24 * 60 * 60 * 1000),
      periodEnd: past70Days,
      status: 'OVERDUE',
      subtotal: 2500.0,
      discountAmount: 0.0,
      taxAmount: 206.25,
      totalAmount: 2706.25,
      amountPaid: 0.0,
      dueDate: new Date(past45Days.getTime() - 15 * 24 * 60 * 60 * 1000), // Overdue by ~35-40 days -> Aging A/R bucket 31-60 days!
      notes: 'Unpaid billing notice sent to accounting.',
      createdAt: past70Days,
      updatedAt: past45Days,
    },
  ];

  const invoiceLines: InvoiceLineEntity[] = [
    {
      id: 'invline-1',
      invoiceId: 'inv-2026-0001',
      description: 'Brightloop Core Platform Seat (Odoo Enterprise Connector) x 3',
      quantity: 3,
      unitPrice: 760.0,
      taxAmount: 328.32,
      lineTotal: 2608.32,
      createdAt: past70Days,
    },
    {
      id: 'invline-2',
      invoiceId: 'inv-2026-0001',
      description: 'High-Volume API Metering (Uncapped Burst) x 2',
      quantity: 2,
      unitPrice: 250.0,
      taxAmount: 72.0,
      lineTotal: 572.0,
      createdAt: past70Days,
    },
    {
      id: 'invline-3',
      invoiceId: 'inv-2026-0002',
      description: 'Brightloop Core Platform Seat x 10',
      quantity: 10,
      unitPrice: 200.0,
      taxAmount: 165.0,
      lineTotal: 2165.0,
      createdAt: past45Days,
    },
    {
      id: 'invline-4',
      invoiceId: 'inv-2026-0002',
      description: '24/7 Dedicated SLA & Architecture Advisory x 1',
      quantity: 1,
      unitPrice: 500.0,
      taxAmount: 41.25,
      lineTotal: 541.25,
      createdAt: past45Days,
    },
    {
      id: 'invline-5',
      invoiceId: 'inv-2026-0003',
      description: 'Enterprise Setup & Architecture Initial License',
      quantity: 1,
      unitPrice: 2500.0,
      taxAmount: 206.25,
      lineTotal: 2706.25,
      createdAt: past70Days,
    },
  ];

  const payments: PaymentEntity[] = [
    {
      id: 'pay-1',
      invoiceId: 'inv-2026-0001',
      paymentMethod: 'CARD',
      amount: 2624.32,
      paymentDate: new Date(past70Days.getTime() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Full settlement via Stripe Corporate Card',
      referenceId: 'ch_3N19akLkd891Kla',
      createdAt: past70Days,
    },
    {
      id: 'pay-2',
      invoiceId: 'inv-2026-0002',
      paymentMethod: 'BANK_TRANSFER',
      amount: 1000.0,
      paymentDate: past30Days,
      notes: 'First installment wire transfer',
      referenceId: 'WIRE-US-99120481',
      createdAt: past30Days,
    },
  ];

  return {
    users,
    products,
    variants,
    plans,
    taxRules,
    discountRules,
    quotationTemplates,
    subscriptions,
    subscriptionLines,
    invoices,
    invoiceLines,
    payments,
  };
};
