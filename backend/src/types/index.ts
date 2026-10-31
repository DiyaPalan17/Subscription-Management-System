export type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export type ProductType = 'SOFTWARE' | 'ADDON' | 'SERVICE';

export type BillingCadence = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export type SubscriptionStatus =
  | 'DRAFT'
  | 'QUOTATION'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'CLOSED';

export type DiscountType = 'FIXED' | 'PERCENTAGE';

export type DiscountScope = 'SUBSCRIPTION' | 'PRODUCT';

export type InvoiceStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PAID'
  | 'CANCELLED'
  | 'OVERDUE';

export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'UPI' | 'MANUAL';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  name: string;
  companyName?: string | null;
}

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  name: string;
  phone?: string | null;
  companyName?: string | null;
  address?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PasswordResetTokenEntity {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface ProductVariantEntity {
  id: string;
  productId: string;
  name: string;
  value: string;
  priceAdjustment: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductEntity {
  id: string;
  name: string;
  type: ProductType;
  salesPrice: number;
  costPrice: number;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  variants?: ProductVariantEntity[];
}

export interface PlanEntity {
  id: string;
  name: string;
  billingCadence: BillingCadence;
  basePrice: number;
  minQuantity: number;
  startDate: Date;
  endDate?: Date | null;
  autoCloseOnExpiry: boolean;
  allowEarlyClose: boolean;
  allowPause: boolean;
  allowRenewal: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotationTemplateEntity {
  id: string;
  name: string;
  defaultPlanId?: string | null;
  validityDays: number;
  templateLines: Array<{
    productId: string;
    variantId?: string | null;
    quantity: number;
    taxRuleId?: string | null;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaxRuleEntity {
  id: string;
  name: string;
  ratePercentage: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiscountRuleEntity {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  targetScope: DiscountScope;
  targetProductId?: string | null;
  minSpend: number;
  minQuantity: number;
  maxRedemptions?: number | null;
  timesRedeemed: number;
  startDate?: Date | null;
  endDate?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionLineEntity {
  id: string;
  subscriptionId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  unitPrice: number;
  taxRuleId?: string | null;
  product?: ProductEntity;
  variant?: ProductVariantEntity | null;
  taxRule?: TaxRuleEntity | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionEntity {
  id: string;
  subscriptionNumber: string;
  customerId: string;
  planId: string;
  discountRuleId?: string | null;
  status: SubscriptionStatus;
  startDate: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  nextBillingDate: Date;
  expiryDate?: Date | null;
  paymentTermsDays: number;
  validUntil?: Date | null;
  notes?: string | null;
  customer?: UserEntity;
  plan?: PlanEntity;
  discountRule?: DiscountRuleEntity | null;
  lines?: SubscriptionLineEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceLineEntity {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxAmount: number;
  lineTotal: number;
  createdAt: Date;
}

export interface PaymentEntity {
  id: string;
  invoiceId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  paymentDate: Date;
  notes?: string | null;
  referenceId?: string | null;
  createdAt: Date;
}

export interface InvoiceEntity {
  id: string;
  invoiceNumber: string;
  subscriptionId: string;
  customerId: string;
  periodStart: Date;
  periodEnd: Date;
  status: InvoiceStatus;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  dueDate: Date;
  notes?: string | null;
  customer?: UserEntity;
  subscription?: SubscriptionEntity;
  lines?: InvoiceLineEntity[];
  payments?: PaymentEntity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceKPIs {
  activeSubscriptionsCount: number;
  mrr: number;
  arr: number;
  totalCashCollectedThisMonth: number;
  totalCashCollectedThisQuarter: number;
  totalCashCollectedAllTime: number;
  totalOverdueAmount: number;
  agingBuckets: {
    overdue1To30Days: number;
    overdue31To60Days: number;
    overdue60PlusDays: number;
  };
}
