import { dbRepository } from '../../db/repository';
import {
  SubscriptionEntity,
  InvoiceEntity,
  InvoiceLineEntity,
  DiscountRuleEntity,
} from '../../types';
import { advancePeriod } from './cadence';

export interface BillingRunResult {
  runTimestamp: Date;
  evaluatedSubscriptionsCount: number;
  invoicesGeneratedCount: number;
  skippedIdempotentCount: number;
  closedExpiredCount: number;
  invoices: InvoiceEntity[];
  errors: Array<{ subscriptionId: string; error: string }>;
}

export class BillingEngine {
  /**
   * Evaluates an individual subscription and generates its recurring invoice idempotently.
   */
  public static async processSubscription(
    subscription: SubscriptionEntity,
    executionDate: Date = new Date()
  ): Promise<{ invoice: InvoiceEntity; isNew: boolean } | null> {
    if (subscription.status !== 'ACTIVE') {
      return null;
    }

    const plan = await dbRepository.findPlanById(subscription.planId);
    if (!plan) {
      throw new Error(`Plan ${subscription.planId} not found for subscription ${subscription.id}`);
    }

    // Check expiry logic
    if (subscription.expiryDate && new Date(subscription.expiryDate) <= executionDate) {
      if (plan.autoCloseOnExpiry) {
        await dbRepository.updateSubscriptionStatus(subscription.id, 'CLOSED');
        return null;
      }
    }

    // 1. Idempotency Check:
    // Check if an invoice for (subscription_id, current_period_start) already exists
    const existingInvoice = await dbRepository.findInvoiceBySubscriptionAndPeriod(
      subscription.id,
      subscription.currentPeriodStart
    );

    if (existingInvoice) {
      // Already invoiced for this period!
      return { invoice: existingInvoice, isNew: false };
    }

    // 2. Compute Invoice Lines & Subtotals
    const lines = subscription.lines || [];
    let subtotal = 0;
    let totalTax = 0;
    let totalQuantity = 0;

    const invoiceLinesToCreate: Array<Omit<InvoiceLineEntity, 'id' | 'invoiceId' | 'createdAt'>> = [];

    // Optional plan base price line item if base_price > 0
    if (plan.basePrice > 0) {
      subtotal += plan.basePrice;
      invoiceLinesToCreate.push({
        description: `Plan Base Subscription: ${plan.name} (${plan.billingCadence})`,
        quantity: 1,
        unitPrice: plan.basePrice,
        taxAmount: 0,
        lineTotal: plan.basePrice,
      });
      totalQuantity += 1;
    }

    for (const line of lines) {
      const lineSubtotal = line.unitPrice * line.quantity;
      totalQuantity += line.quantity;
      subtotal += lineSubtotal;

      let lineTax = 0;
      if (line.taxRule && line.taxRule.isActive) {
        lineTax = Number(((lineSubtotal * line.taxRule.ratePercentage) / 100).toFixed(2));
      }
      totalTax += lineTax;

      const productName = line.product ? line.product.name : 'Subscription Product';
      const variantText = line.variant ? ` (${line.variant.name}: ${line.variant.value})` : '';

      invoiceLinesToCreate.push({
        description: `${productName}${variantText}`,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxAmount: lineTax,
        lineTotal: Number((lineSubtotal + lineTax).toFixed(2)),
      });
    }

    // 3. Discount Evaluation
    let discountAmount = 0;
    let applicableDiscount: DiscountRuleEntity | null = null;

    if (subscription.discountRuleId) {
      const rule = await dbRepository.findDiscountRuleById(subscription.discountRuleId);
      if (rule && rule.isActive) {
        let isEligible = true;

        // Date validity check
        if (rule.startDate && new Date(rule.startDate) > executionDate) {
          isEligible = false;
        }
        if (rule.endDate && new Date(rule.endDate) < executionDate) {
          isEligible = false;
        }

        // Max redemptions check
        if (rule.maxRedemptions !== null && rule.maxRedemptions !== undefined) {
          if (rule.timesRedeemed >= rule.maxRedemptions) {
            isEligible = false;
          }
        }

        // Minimum spend & quantity checks
        if (subtotal < rule.minSpend) {
          isEligible = false;
        }
        if (totalQuantity < rule.minQuantity) {
          isEligible = false;
        }

        if (isEligible) {
          applicableDiscount = rule;
          if (rule.type === 'PERCENTAGE') {
            discountAmount = Number(((subtotal * rule.value) / 100).toFixed(2));
          } else if (rule.type === 'FIXED') {
            discountAmount = Math.min(rule.value, subtotal);
          }
        }
      }
    }

    // 4. Calculate Net Total
    subtotal = Number(subtotal.toFixed(2));
    discountAmount = Number(discountAmount.toFixed(2));
    totalTax = Number(totalTax.toFixed(2));
    const totalAmount = Number(Math.max(0, subtotal - discountAmount + totalTax).toFixed(2));

    // Calculate Due Date based on payment terms days
    const termsDays = subscription.paymentTermsDays || 15;
    const dueDate = new Date(executionDate.getTime() + termsDays * 24 * 60 * 60 * 1000);

    // 5. Create Invoice (enforces idempotency)
    const createdInvoice = await dbRepository.createInvoice(
      {
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        periodStart: new Date(subscription.currentPeriodStart),
        periodEnd: new Date(subscription.currentPeriodEnd),
        status: 'CONFIRMED',
        subtotal,
        discountAmount,
        taxAmount: totalTax,
        totalAmount,
        amountPaid: 0,
        dueDate,
        notes: applicableDiscount
          ? `Generated automatically with discount code [${applicableDiscount.code}] applied.`
          : 'Generated automatically via scheduled billing run.',
      },
      invoiceLinesToCreate
    );

    // 6. Increment Discount Times Redeemed
    if (applicableDiscount) {
      await dbRepository.incrementDiscountRedemption(applicableDiscount.id);
    }

    // 7. Advance Subscription Period & Next Billing Date
    const nextPeriod = advancePeriod(subscription.currentPeriodEnd, plan.billingCadence);

    // Check if new period surpasses expiry date
    let newStatus = subscription.status;
    if (subscription.expiryDate && nextPeriod.newPeriodStart >= new Date(subscription.expiryDate)) {
      if (plan.autoCloseOnExpiry) {
        newStatus = 'CLOSED';
      }
    }

    await dbRepository.updateSubscriptionBillingPeriod(
      subscription.id,
      nextPeriod.newPeriodStart,
      nextPeriod.newPeriodEnd,
      nextPeriod.nextBillingDate,
      newStatus
    );

    return { invoice: createdInvoice, isNew: true };
  }

  /**
   * Executes the full automated billing run for all due subscriptions.
   */
  public static async executeBillingRun(
    executionDate: Date = new Date()
  ): Promise<BillingRunResult> {
    const dueSubscriptions = await dbRepository.findActiveSubscriptionsDue(executionDate);
    const result: BillingRunResult = {
      runTimestamp: executionDate,
      evaluatedSubscriptionsCount: dueSubscriptions.length,
      invoicesGeneratedCount: 0,
      skippedIdempotentCount: 0,
      closedExpiredCount: 0,
      invoices: [],
      errors: [],
    };

    for (const sub of dueSubscriptions) {
      try {
        const processResult = await this.processSubscription(sub, executionDate);
        if (!processResult) {
          result.closedExpiredCount += 1;
        } else if (processResult.isNew) {
          result.invoicesGeneratedCount += 1;
          result.invoices.push(processResult.invoice);
        } else {
          result.skippedIdempotentCount += 1;
        }
      } catch (err: any) {
        result.errors.push({
          subscriptionId: sub.id,
          error: err.message || 'Billing error',
        });
      }
    }

    return result;
  }
}
