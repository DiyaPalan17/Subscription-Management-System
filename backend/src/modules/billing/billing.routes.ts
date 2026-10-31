import { Router, Response } from 'express';
import { dbRepository } from '../../db/repository';
import {
  requireAuth,
  requireStaffOrAdmin,
  AuthenticatedRequest,
} from '../../middlewares/auth.middleware';
import { BillingEngine } from './engine';

const router = Router();

// 1. TRIGGER AUTOMATED BILLING RUN
router.post(
  '/run',
  requireAuth,
  requireStaffOrAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { executionDate } = req.body;
      const targetDate = executionDate ? new Date(executionDate) : new Date();

      const result = await BillingEngine.executeBillingRun(targetDate);

      res.json({
        success: true,
        message: `Billing run executed. Generated ${result.invoicesGeneratedCount} invoices, skipped ${result.skippedIdempotentCount} idempotent cycles.`,
        result,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// 2. TRIGGER OVERDUE EVALUATION RUN
router.post(
  '/evaluate-overdue',
  requireAuth,
  requireStaffOrAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { referenceDate } = req.body;
      const targetDate = referenceDate ? new Date(referenceDate) : new Date();

      const markedCount = await dbRepository.markInvoicesOverdue(targetDate);

      res.json({
        success: true,
        message: `Overdue evaluation completed. Marked ${markedCount} invoices as OVERDUE.`,
        markedCount,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
