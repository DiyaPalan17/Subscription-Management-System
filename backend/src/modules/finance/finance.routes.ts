import { Router, Response } from 'express';
import { dbRepository } from '../../db/repository';
import {
  requireAuth,
  requireAdmin,
  AuthenticatedRequest,
} from '../../middlewares/auth.middleware';

const router = Router();

// GET FINANCE KPIS & AGING A/R (SUB-2S PERFORMANCE)
router.get(
  '/kpis',
  requireAuth,
  requireAdmin,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const startTime = process.hrtime();
      const kpis = await dbRepository.getFinanceKPIs(new Date());
      const diff = process.hrtime(startTime);
      const executionTimeMs = (diff[0] * 1000 + diff[1] / 1e6).toFixed(2);

      res.json({
        success: true,
        executionTimeMs: `${executionTimeMs}ms`,
        kpis,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
