import { Router, Response } from 'express';
import { dbRepository } from '../../db/repository';
import {
  requireAuth,
  requireStaffOrAdmin,
  AuthenticatedRequest,
} from '../../middlewares/auth.middleware';
import { SubscriptionFSM } from './fsm';
import { calculateNextPeriod } from '../billing/cadence';
import { BillingEngine } from '../billing/engine';
import { SubscriptionStatus } from '../../types';

const router = Router();

// 1. LIST SUBSCRIPTIONS
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let customerId = req.query.customerId as string | undefined;
    const status = req.query.status as SubscriptionStatus | undefined;

    // CUSTOMER role can strictly ONLY view their own subscriptions
    if (user.role === 'CUSTOMER') {
      customerId = user.id;
    }

    const subscriptions = await dbRepository.listSubscriptions({
      customerId,
      status,
    });

    res.json({ success: true, subscriptions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET SINGLE SUBSCRIPTION
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const subscription = await dbRepository.findSubscriptionById(req.params.id);

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    // Role check: customer can only view their own
    if (user.role === 'CUSTOMER' && subscription.customerId !== user.id) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    res.json({ success: true, subscription });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. CREATE SUBSCRIPTION (OR SPIN UP FROM TEMPLATE)
router.post('/', requireAuth, requireStaffOrAdmin, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      customerId,
      planId,
      templateId,
      discountRuleId,
      paymentTermsDays = 15,
      notes,
      lines = [],
      startDate = new Date(),
    } = req.body;

    if (!customerId || (!planId && !templateId)) {
      res.status(400).json({
        success: false,
        message: 'customerId and either planId or templateId are required',
      });
      return;
    }

    let targetPlanId = planId;
    let initialLines = [...lines];
    let validityDays = 30;

    // If template specified, spin up from Quotation Template
    if (templateId) {
      const template = await dbRepository.findQuotationTemplateById(templateId);
      if (template) {
        if (!targetPlanId && template.defaultPlanId) {
          targetPlanId = template.defaultPlanId;
        }
        validityDays = template.validityDays;

        if (initialLines.length === 0 && Array.isArray(template.templateLines)) {
          for (const line of template.templateLines) {
            const product = await dbRepository.findProductById(line.productId);
            if (product) {
              let unitPrice = product.salesPrice;
              if (line.variantId) {
                const variant = await dbRepository.findVariantById(line.variantId);
                if (variant) {
                  unitPrice += variant.priceAdjustment;
                }
              }

              initialLines.push({
                productId: line.productId,
                variantId: line.variantId || null,
                quantity: line.quantity || 1,
                unitPrice,
                taxRuleId: line.taxRuleId || null,
              });
            }
          }
        }
      }
    }

    const plan = await dbRepository.findPlanById(targetPlanId);
    if (!plan) {
      res.status(400).json({ success: false, message: 'Target plan does not exist' });
      return;
    }

    const start = new Date(startDate);
    const { periodEnd, nextBillingDate } = calculateNextPeriod(start, plan.billingCadence);

    const subscription = await dbRepository.createSubscription(
      {
        customerId,
        planId: targetPlanId,
        discountRuleId: discountRuleId || null,
        status: 'DRAFT',
        startDate: start,
        currentPeriodStart: start,
        currentPeriodEnd: periodEnd,
        nextBillingDate,
        expiryDate: plan.endDate || null,
        paymentTermsDays: Number(paymentTermsDays),
        validUntil: new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000),
        notes: notes || null,
      },
      initialLines
    );

    res.status(201).json({ success: true, subscription });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. FSM TRANSITIONS (DRAFT -> QUOTATION -> CONFIRMED -> ACTIVE -> PAUSED -> CLOSED)
router.post(
  '/:id/transition',
  requireAuth,
  requireStaffOrAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { targetStatus, validityDays = 30 } = req.body;
      const sub = await dbRepository.findSubscriptionById(req.params.id);

      if (!sub) {
        res.status(404).json({ success: false, message: 'Subscription not found' });
        return;
      }

      const check = SubscriptionFSM.canTransition(sub.status, targetStatus);
      if (!check.valid) {
        res.status(400).json({ success: false, message: check.message });
        return;
      }

      // Special handling based on target status:
      let validUntil = sub.validUntil;

      // 1. DRAFT -> QUOTATION: locks pricing and sets valid_until date
      if (targetStatus === 'QUOTATION') {
        validUntil = new Date(Date.now() + validityDays * 24 * 60 * 60 * 1000);
      }

      // 2. ACTIVE -> PAUSED: check if plan allows pause
      if (targetStatus === 'PAUSED' && sub.plan && !sub.plan.allowPause) {
        res.status(400).json({
          success: false,
          message: 'The assigned plan does not permit pausing active subscriptions',
        });
        return;
      }

      // 3. -> CLOSED: check if early close allowed if before expiry
      if (
        targetStatus === 'CLOSED' &&
        sub.status === 'ACTIVE' &&
        sub.plan &&
        !sub.plan.allowEarlyClose
      ) {
        res.status(400).json({
          success: false,
          message: 'The assigned plan does not permit early termination',
        });
        return;
      }

      const updated = await dbRepository.updateSubscriptionStatus(
        sub.id,
        targetStatus,
        validUntil
      );

      res.json({
        success: true,
        message: `Subscription transitioned from ${sub.status} to ${targetStatus}`,
        subscription: updated,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// 5. TRIGGER ON-DEMAND BILLING FOR SINGLE SUBSCRIPTION
router.post(
  '/:id/trigger-billing',
  requireAuth,
  requireStaffOrAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const sub = await dbRepository.findSubscriptionById(req.params.id);
      if (!sub) {
        res.status(404).json({ success: false, message: 'Subscription not found' });
        return;
      }

      if (sub.status !== 'ACTIVE') {
        res.status(400).json({
          success: false,
          message: `Cannot bill subscription in '${sub.status}' state. Only ACTIVE subscriptions can be billed.`,
        });
        return;
      }

      const processResult = await BillingEngine.processSubscription(sub, new Date());
      if (!processResult) {
        res.status(400).json({
          success: false,
          message: 'Subscription was expired or could not be billed',
        });
        return;
      }

      res.json({
        success: true,
        isNew: processResult.isNew,
        invoice: processResult.invoice,
        message: processResult.isNew
          ? 'New invoice generated successfully'
          : 'Invoice for current period already generated (Idempotent response)',
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
