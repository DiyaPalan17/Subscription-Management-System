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
  PasswordResetTokenEntity,
  SubscriptionStatus,
  InvoiceStatus,
  FinanceKPIs,
} from '../types';
import { getInitialSeedData } from './seed-data';

class DatabaseRepository {
  private users: UserEntity[] = [];
  private passwordResetTokens: PasswordResetTokenEntity[] = [];
  private products: ProductEntity[] = [];
  private variants: ProductVariantEntity[] = [];
  private plans: PlanEntity[] = [];
  private taxRules: TaxRuleEntity[] = [];
  private discountRules: DiscountRuleEntity[] = [];
  private quotationTemplates: QuotationTemplateEntity[] = [];
  private subscriptions: SubscriptionEntity[] = [];
  private subscriptionLines: SubscriptionLineEntity[] = [];
  private invoices: InvoiceEntity[] = [];
  private invoiceLines: InvoiceLineEntity[] = [];
  private payments: PaymentEntity[] = [];

  constructor() {
    this.seedInMemory();
  }

  public seedInMemory(): void {
    const data = getInitialSeedData();
    this.users = [...data.users];
    this.products = [...data.products];
    this.variants = [...data.variants];
    this.plans = [...data.plans];
    this.taxRules = [...data.taxRules];
    this.discountRules = [...data.discountRules];
    this.quotationTemplates = [...data.quotationTemplates];
    this.subscriptions = [...data.subscriptions];
    this.subscriptionLines = [...data.subscriptionLines];
    this.invoices = [...data.invoices];
    this.invoiceLines = [...data.invoiceLines];
    this.payments = [...data.payments];
  }

  // --- USERS & AUTH ---
  public async findUserByEmail(email: string): Promise<UserEntity | null> {
    const user = this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    return user ? { ...user } : null;
  }

  public async findUserById(id: string): Promise<UserEntity | null> {
    const user = this.users.find((u) => u.id === id);
    return user ? { ...user } : null;
  }

  public async createUser(data: Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserEntity> {
    const user: UserEntity = {
      ...data,
      id: `usr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return { ...user };
  }

  public async listUsers(): Promise<UserEntity[]> {
    return this.users.map((u) => ({ ...u, passwordHash: '***' }));
  }

  public async listCustomers(): Promise<UserEntity[]> {
    return this.users
      .filter((u) => u.role === 'CUSTOMER')
      .map((u) => ({ ...u, passwordHash: '***' }));
  }

  public async updateUserPassword(userId: string, newPasswordHash: string): Promise<boolean> {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    user.passwordHash = newPasswordHash;
    user.updatedAt = new Date();
    return true;
  }

  // --- PASSWORD RESET TOKENS ---
  public async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetTokenEntity> {
    const tokenEntity: PasswordResetTokenEntity = {
      id: `tok-${Date.now()}`,
      userId,
      token,
      expiresAt,
      used: false,
      createdAt: new Date(),
    };
    this.passwordResetTokens.push(tokenEntity);
    return { ...tokenEntity };
  }

  public async findValidResetToken(token: string): Promise<PasswordResetTokenEntity | null> {
    const t = this.passwordResetTokens.find(
      (item) => item.token === token && !item.used && item.expiresAt > new Date()
    );
    return t ? { ...t } : null;
  }

  public async markResetTokenUsed(token: string): Promise<void> {
    const t = this.passwordResetTokens.find((item) => item.token === token);
    if (t) {
      t.used = true;
    }
  }

  // --- PRODUCTS & VARIANTS ---
  public async listProducts(): Promise<ProductEntity[]> {
    return this.products.map((p) => ({
      ...p,
      variants: this.variants.filter((v) => v.productId === p.id),
    }));
  }

  public async findProductById(id: string): Promise<ProductEntity | null> {
    const p = this.products.find((prod) => prod.id === id);
    if (!p) return null;
    return {
      ...p,
      variants: this.variants.filter((v) => v.productId === p.id),
    };
  }

  public async createProduct(data: Omit<ProductEntity, 'id' | 'createdAt' | 'updatedAt' | 'variants'>): Promise<ProductEntity> {
    const product: ProductEntity = {
      ...data,
      id: `prod-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.products.push(product);
    return { ...product, variants: [] };
  }

  public async updateProduct(id: string, data: Partial<ProductEntity>): Promise<ProductEntity | null> {
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.products[index] = {
      ...this.products[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.findProductById(id);
  }

  public async createProductVariant(data: Omit<ProductVariantEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductVariantEntity> {
    const variant: ProductVariantEntity = {
      ...data,
      id: `var-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.variants.push(variant);
    return { ...variant };
  }

  public async findVariantById(id: string): Promise<ProductVariantEntity | null> {
    const v = this.variants.find((item) => item.id === id);
    return v ? { ...v } : null;
  }

  // --- PLANS ---
  public async listPlans(): Promise<PlanEntity[]> {
    return this.plans.map((p) => ({ ...p }));
  }

  public async findPlanById(id: string): Promise<PlanEntity | null> {
    const p = this.plans.find((plan) => plan.id === id);
    return p ? { ...p } : null;
  }

  public async createPlan(data: Omit<PlanEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<PlanEntity> {
    const plan: PlanEntity = {
      ...data,
      id: `plan-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.plans.push(plan);
    return { ...plan };
  }

  public async updatePlan(id: string, data: Partial<PlanEntity>): Promise<PlanEntity | null> {
    const index = this.plans.findIndex((p) => p.id === id);
    if (index === -1) return null;
    this.plans[index] = {
      ...this.plans[index],
      ...data,
      updatedAt: new Date(),
    };
    return { ...this.plans[index] };
  }

  // --- QUOTATION TEMPLATES ---
  public async listQuotationTemplates(): Promise<QuotationTemplateEntity[]> {
    return this.quotationTemplates.map((t) => ({ ...t }));
  }

  public async findQuotationTemplateById(id: string): Promise<QuotationTemplateEntity | null> {
    const t = this.quotationTemplates.find((tmpl) => tmpl.id === id);
    return t ? { ...t } : null;
  }

  public async createQuotationTemplate(data: Omit<QuotationTemplateEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuotationTemplateEntity> {
    const tmpl: QuotationTemplateEntity = {
      ...data,
      id: `tmpl-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.quotationTemplates.push(tmpl);
    return { ...tmpl };
  }

  // --- TAX & DISCOUNT RULES ---
  public async listTaxRules(): Promise<TaxRuleEntity[]> {
    return this.taxRules.map((t) => ({ ...t }));
  }

  public async findTaxRuleById(id: string): Promise<TaxRuleEntity | null> {
    const t = this.taxRules.find((tax) => tax.id === id);
    return t ? { ...t } : null;
  }

  public async createTaxRule(data: Omit<TaxRuleEntity, 'id' | 'createdAt' | 'updatedAt'>): Promise<TaxRuleEntity> {
    const tax: TaxRuleEntity = {
      ...data,
      id: `tax-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.taxRules.push(tax);
    return { ...tax };
  }

  public async updateTaxRule(id: string, data: Partial<TaxRuleEntity>): Promise<TaxRuleEntity | null> {
    const index = this.taxRules.findIndex((t) => t.id === id);
    if (index === -1) return null;
    this.taxRules[index] = {
      ...this.taxRules[index],
      ...data,
      updatedAt: new Date(),
    };
    return { ...this.taxRules[index] };
  }

  public async listDiscountRules(): Promise<DiscountRuleEntity[]> {
    return this.discountRules.map((d) => ({ ...d }));
  }

  public async findDiscountRuleByCode(code: string): Promise<DiscountRuleEntity | null> {
    const d = this.discountRules.find(
      (disc) => disc.code.toUpperCase() === code.toUpperCase()
    );
    return d ? { ...d } : null;
  }

  public async findDiscountRuleById(id: string): Promise<DiscountRuleEntity | null> {
    const d = this.discountRules.find((disc) => disc.id === id);
    return d ? { ...d } : null;
  }

  public async createDiscountRule(data: Omit<DiscountRuleEntity, 'id' | 'createdAt' | 'updatedAt' | 'timesRedeemed'>): Promise<DiscountRuleEntity> {
    const disc: DiscountRuleEntity = {
      ...data,
      id: `disc-${Date.now()}`,
      timesRedeemed: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.discountRules.push(disc);
    return { ...disc };
  }

  public async incrementDiscountRedemption(id: string): Promise<void> {
    const d = this.discountRules.find((disc) => disc.id === id);
    if (d) {
      d.timesRedeemed += 1;
      d.updatedAt = new Date();
    }
  }

  // --- SUBSCRIPTIONS & LINES ---
  public async listSubscriptions(filters?: {
    customerId?: string;
    status?: SubscriptionStatus;
  }): Promise<SubscriptionEntity[]> {
    let result = this.subscriptions;
    if (filters?.customerId) {
      result = result.filter((s) => s.customerId === filters.customerId);
    }
    if (filters?.status) {
      result = result.filter((s) => s.status === filters.status);
    }

    return result.map((sub) => this.attachSubscriptionRelations(sub));
  }

  public async findSubscriptionById(id: string): Promise<SubscriptionEntity | null> {
    const sub = this.subscriptions.find((s) => s.id === id);
    if (!sub) return null;
    return this.attachSubscriptionRelations(sub);
  }

  public async findSubscriptionByNumber(num: string): Promise<SubscriptionEntity | null> {
    const sub = this.subscriptions.find((s) => s.subscriptionNumber === num);
    if (!sub) return null;
    return this.attachSubscriptionRelations(sub);
  }

  public async createSubscription(
    data: Omit<SubscriptionEntity, 'id' | 'subscriptionNumber' | 'createdAt' | 'updatedAt'>,
    lines: Array<Omit<SubscriptionLineEntity, 'id' | 'subscriptionId' | 'createdAt' | 'updatedAt'>>
  ): Promise<SubscriptionEntity> {
    const count = this.subscriptions.length + 1001;
    const subNumber = `SUB-${count}`;
    const subId = `sub-${Date.now()}`;

    const newSub: SubscriptionEntity = {
      ...data,
      id: subId,
      subscriptionNumber: subNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.subscriptions.push(newSub);

    for (const line of lines) {
      const newLine: SubscriptionLineEntity = {
        ...line,
        id: `subline-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        subscriptionId: subId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.subscriptionLines.push(newLine);
    }

    return this.attachSubscriptionRelations(newSub);
  }

  public async updateSubscriptionStatus(
    id: string,
    status: SubscriptionStatus,
    validUntil?: Date | null
  ): Promise<SubscriptionEntity | null> {
    const sub = this.subscriptions.find((s) => s.id === id);
    if (!sub) return null;
    sub.status = status;
    if (validUntil !== undefined) {
      sub.validUntil = validUntil;
    }
    sub.updatedAt = new Date();
    return this.attachSubscriptionRelations(sub);
  }

  public async updateSubscriptionBillingPeriod(
    id: string,
    newPeriodStart: Date,
    newPeriodEnd: Date,
    nextBillingDate: Date,
    newStatus?: SubscriptionStatus
  ): Promise<SubscriptionEntity | null> {
    const sub = this.subscriptions.find((s) => s.id === id);
    if (!sub) return null;
    sub.currentPeriodStart = newPeriodStart;
    sub.currentPeriodEnd = newPeriodEnd;
    sub.nextBillingDate = nextBillingDate;
    if (newStatus) {
      sub.status = newStatus;
    }
    sub.updatedAt = new Date();
    return this.attachSubscriptionRelations(sub);
  }

  public async findActiveSubscriptionsDue(targetDate: Date): Promise<SubscriptionEntity[]> {
    const dueSubs = this.subscriptions.filter(
      (s) => s.status === 'ACTIVE' && new Date(s.nextBillingDate).getTime() <= targetDate.getTime()
    );
    return dueSubs.map((s) => this.attachSubscriptionRelations(s));
  }

  private attachSubscriptionRelations(sub: SubscriptionEntity): SubscriptionEntity {
    const customer = this.users.find((u) => u.id === sub.customerId);
    const plan = this.plans.find((p) => p.id === sub.planId);
    const discountRule = sub.discountRuleId
      ? this.discountRules.find((d) => d.id === sub.discountRuleId) || null
      : null;
    const lines = this.subscriptionLines
      .filter((l) => l.subscriptionId === sub.id)
      .map((line) => {
        const product = this.products.find((p) => p.id === line.productId);
        const variant = line.variantId
          ? this.variants.find((v) => v.id === line.variantId) || null
          : null;
        const taxRule = line.taxRuleId
          ? this.taxRules.find((t) => t.id === line.taxRuleId) || null
          : null;
        return {
          ...line,
          product,
          variant,
          taxRule,
        };
      });

    return {
      ...sub,
      customer: customer ? { ...customer, passwordHash: '***' } : undefined,
      plan: plan ? { ...plan } : undefined,
      discountRule: discountRule ? { ...discountRule } : null,
      lines,
    };
  }

  // --- INVOICES & LINES ---
  public async listInvoices(filters?: {
    customerId?: string;
    status?: InvoiceStatus;
    subscriptionId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<InvoiceEntity[]> {
    let result = this.invoices;
    if (filters?.customerId) {
      result = result.filter((i) => i.customerId === filters.customerId);
    }
    if (filters?.status) {
      result = result.filter((i) => i.status === filters.status);
    }
    if (filters?.subscriptionId) {
      result = result.filter((i) => i.subscriptionId === filters.subscriptionId);
    }
    if (filters?.startDate) {
      result = result.filter((i) => new Date(i.periodStart) >= filters.startDate!);
    }
    if (filters?.endDate) {
      result = result.filter((i) => new Date(i.periodEnd) <= filters.endDate!);
    }

    // Sort newest first
    result = [...result].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return result.map((inv) => this.attachInvoiceRelations(inv));
  }

  public async findInvoiceById(id: string): Promise<InvoiceEntity | null> {
    const inv = this.invoices.find((i) => i.id === id);
    if (!inv) return null;
    return this.attachInvoiceRelations(inv);
  }

  public async findInvoiceByNumber(invoiceNumber: string): Promise<InvoiceEntity | null> {
    const inv = this.invoices.find((i) => i.invoiceNumber === invoiceNumber);
    if (!inv) return null;
    return this.attachInvoiceRelations(inv);
  }

  // Enforces UNIQUE(subscription_id, period_start) idempotency check!
  public async findInvoiceBySubscriptionAndPeriod(
    subscriptionId: string,
    periodStart: Date
  ): Promise<InvoiceEntity | null> {
    const periodStartIso = new Date(periodStart).toISOString().split('T')[0];
    const match = this.invoices.find((inv) => {
      const invPeriodIso = new Date(inv.periodStart).toISOString().split('T')[0];
      return inv.subscriptionId === subscriptionId && invPeriodIso === periodStartIso;
    });
    return match ? this.attachInvoiceRelations(match) : null;
  }

  public async createInvoice(
    invoiceData: Omit<InvoiceEntity, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'lines' | 'payments'>,
    lines: Array<Omit<InvoiceLineEntity, 'id' | 'invoiceId' | 'createdAt'>>
  ): Promise<InvoiceEntity> {
    // Idempotency check:
    const existing = await this.findInvoiceBySubscriptionAndPeriod(
      invoiceData.subscriptionId,
      invoiceData.periodStart
    );
    if (existing) {
      return existing;
    }

    const year = new Date().getFullYear();
    const count = this.invoices.length + 1;
    const invNumber = `INV-${year}-${count.toString().padStart(4, '0')}`;
    const invoiceId = `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newInvoice: InvoiceEntity = {
      ...invoiceData,
      id: invoiceId,
      invoiceNumber: invNumber,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.invoices.push(newInvoice);

    for (const line of lines) {
      const newLine: InvoiceLineEntity = {
        ...line,
        id: `invline-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        invoiceId,
        createdAt: new Date(),
      };
      this.invoiceLines.push(newLine);
    }

    return this.attachInvoiceRelations(newInvoice);
  }

  public async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<InvoiceEntity | null> {
    const inv = this.invoices.find((i) => i.id === id);
    if (!inv) return null;
    inv.status = status;
    inv.updatedAt = new Date();
    return this.attachInvoiceRelations(inv);
  }

  public async recordPayment(
    paymentData: Omit<PaymentEntity, 'id' | 'createdAt'>
  ): Promise<{ payment: PaymentEntity; updatedInvoice: InvoiceEntity }> {
    const inv = this.invoices.find((i) => i.id === paymentData.invoiceId);
    if (!inv) {
      throw new Error(`Invoice not found: ${paymentData.invoiceId}`);
    }

    const payment: PaymentEntity = {
      ...paymentData,
      id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: new Date(),
    };
    this.payments.push(payment);

    // Reconcile invoice amount paid
    inv.amountPaid = Number((inv.amountPaid + payment.amount).toFixed(2));
    if (inv.amountPaid >= inv.totalAmount) {
      inv.status = 'PAID';
    } else if (inv.status === 'OVERDUE' && inv.amountPaid > 0) {
      // Partially paid overdue invoice remains overdue or confirmed based on business policy
    }
    inv.updatedAt = new Date();

    return {
      payment,
      updatedInvoice: this.attachInvoiceRelations(inv),
    };
  }

  public async findOverdueInvoices(targetDate: Date = new Date()): Promise<InvoiceEntity[]> {
    const overdueList = this.invoices.filter((inv) => {
      const isPastDue = new Date(inv.dueDate).getTime() < targetDate.getTime();
      const isUnsettled = inv.status !== 'PAID' && inv.status !== 'CANCELLED';
      const hasBalance = inv.amountPaid < inv.totalAmount;
      return isPastDue && isUnsettled && hasBalance;
    });

    return overdueList.map((inv) => this.attachInvoiceRelations(inv));
  }

  public async markInvoicesOverdue(targetDate: Date = new Date()): Promise<number> {
    const overdueInvoices = await this.findOverdueInvoices(targetDate);
    let count = 0;
    for (const inv of overdueInvoices) {
      if (inv.status !== 'OVERDUE') {
        const target = this.invoices.find((i) => i.id === inv.id);
        if (target) {
          target.status = 'OVERDUE';
          target.updatedAt = new Date();
          count++;
        }
      }
    }
    return count;
  }

  private attachInvoiceRelations(inv: InvoiceEntity): InvoiceEntity {
    const customer = this.users.find((u) => u.id === inv.customerId);
    const sub = this.subscriptions.find((s) => s.id === inv.subscriptionId);
    const lines = this.invoiceLines.filter((l) => l.invoiceId === inv.id);
    const payments = this.payments.filter((p) => p.invoiceId === inv.id);

    return {
      ...inv,
      customer: customer ? { ...customer, passwordHash: '***' } : undefined,
      subscription: sub ? this.attachSubscriptionRelations(sub) : undefined,
      lines,
      payments,
    };
  }

  // --- FINANCE KPIS & AGING A/R (SUB-2S PERFORMANCE) ---
  public async getFinanceKPIs(referenceDate: Date = new Date()): Promise<FinanceKPIs> {
    const refTime = referenceDate.getTime();

    // 1. Active Subscriptions Count
    const activeSubs = this.subscriptions.filter((s) => s.status === 'ACTIVE');
    const activeSubscriptionsCount = activeSubs.length;

    // 2. MRR & ARR calculation (normalized to monthly value)
    let mrr = 0;
    for (const sub of activeSubs) {
      const plan = this.plans.find((p) => p.id === sub.planId);
      if (!plan) continue;

      const lines = this.subscriptionLines.filter((l) => l.subscriptionId === sub.id);
      const linesTotal = lines.reduce(
        (sum, line) => sum + line.unitPrice * line.quantity,
        0
      );
      const cycleTotal = plan.basePrice + linesTotal;

      let monthlyNorm = 0;
      switch (plan.billingCadence) {
        case 'DAILY':
          monthlyNorm = cycleTotal * 30;
          break;
        case 'WEEKLY':
          monthlyNorm = (cycleTotal * 52) / 12;
          break;
        case 'MONTHLY':
          monthlyNorm = cycleTotal;
          break;
        case 'YEARLY':
          monthlyNorm = cycleTotal / 12;
          break;
      }
      mrr += monthlyNorm;
    }
    mrr = Number(mrr.toFixed(2));
    const arr = Number((mrr * 12).toFixed(2));

    // 3. Cash Collected (this month, this quarter, all time)
    const currentMonth = referenceDate.getMonth();
    const currentYear = referenceDate.getFullYear();
    const currentQuarter = Math.floor(currentMonth / 3);

    let totalCashCollectedThisMonth = 0;
    let totalCashCollectedThisQuarter = 0;
    let totalCashCollectedAllTime = 0;

    for (const payment of this.payments) {
      const pDate = new Date(payment.paymentDate);
      const pMonth = pDate.getMonth();
      const pYear = pDate.getFullYear();
      const pQuarter = Math.floor(pMonth / 3);

      totalCashCollectedAllTime += payment.amount;

      if (pYear === currentYear && pMonth === currentMonth) {
        totalCashCollectedThisMonth += payment.amount;
      }
      if (pYear === currentYear && pQuarter === currentQuarter) {
        totalCashCollectedThisQuarter += payment.amount;
      }
    }

    // 4. Aging A/R Buckets & Total Overdue
    let overdue1To30Days = 0;
    let overdue31To60Days = 0;
    let overdue60PlusDays = 0;
    let totalOverdueAmount = 0;

    for (const inv of this.invoices) {
      if (inv.status === 'PAID' || inv.status === 'CANCELLED') continue;

      const outstandingBalance = Number((inv.totalAmount - inv.amountPaid).toFixed(2));
      if (outstandingBalance <= 0) continue;

      const dueDateTime = new Date(inv.dueDate).getTime();
      if (refTime > dueDateTime) {
        const diffDays = Math.floor((refTime - dueDateTime) / (1000 * 60 * 60 * 24));
        totalOverdueAmount += outstandingBalance;

        if (diffDays <= 30) {
          overdue1To30Days += outstandingBalance;
        } else if (diffDays <= 60) {
          overdue31To60Days += outstandingBalance;
        } else {
          overdue60PlusDays += outstandingBalance;
        }
      }
    }

    return {
      activeSubscriptionsCount,
      mrr,
      arr,
      totalCashCollectedThisMonth: Number(totalCashCollectedThisMonth.toFixed(2)),
      totalCashCollectedThisQuarter: Number(totalCashCollectedThisQuarter.toFixed(2)),
      totalCashCollectedAllTime: Number(totalCashCollectedAllTime.toFixed(2)),
      totalOverdueAmount: Number(totalOverdueAmount.toFixed(2)),
      agingBuckets: {
        overdue1To30Days: Number(overdue1To30Days.toFixed(2)),
        overdue31To60Days: Number(overdue31To60Days.toFixed(2)),
        overdue60PlusDays: Number(overdue60PlusDays.toFixed(2)),
      },
    };
  }
}

export const dbRepository = new DatabaseRepository();
