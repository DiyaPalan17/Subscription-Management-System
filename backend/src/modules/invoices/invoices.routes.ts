import { Router, Response } from 'express';
import { dbRepository } from '../../db/repository';
import {
  requireAuth,
  requireStaffOrAdmin,
  AuthenticatedRequest,
} from '../../middlewares/auth.middleware';
import { InvoiceStatus } from '../../types';

const router = Router();

// 1. LIST INVOICES (WITH FILTERS)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let customerId = req.query.customerId as string | undefined;
    const status = req.query.status as InvoiceStatus | undefined;
    const subscriptionId = req.query.subscriptionId as string | undefined;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    // CUSTOMER role can strictly ONLY view their own invoices
    if (user.role === 'CUSTOMER') {
      customerId = user.id;
    }

    const invoices = await dbRepository.listInvoices({
      customerId,
      status,
      subscriptionId,
      startDate,
      endDate,
    });

    res.json({ success: true, invoices });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. GET SINGLE INVOICE
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const invoice = await dbRepository.findInvoiceById(req.params.id);

    if (!invoice) {
      res.status(404).json({ success: false, message: 'Invoice not found' });
      return;
    }

    // Role check: customer can only view their own
    if (user.role === 'CUSTOMER' && invoice.customerId !== user.id) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    res.json({ success: true, invoice });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. CONFIRM INVOICE
router.post(
  '/:id/confirm',
  requireAuth,
  requireStaffOrAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const invoice = await dbRepository.findInvoiceById(req.params.id);
      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }

      if (invoice.status !== 'DRAFT') {
        res.status(400).json({
          success: false,
          message: `Cannot confirm invoice in '${invoice.status}' state`,
        });
        return;
      }

      const updated = await dbRepository.updateInvoiceStatus(invoice.id, 'CONFIRMED');
      res.json({ success: true, invoice: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// 4. CANCEL INVOICE
router.post(
  '/:id/cancel',
  requireAuth,
  requireStaffOrAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const invoice = await dbRepository.findInvoiceById(req.params.id);
      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }

      if (invoice.status === 'PAID') {
        res.status(400).json({
          success: false,
          message: 'Cannot cancel an invoice that has already been marked PAID',
        });
        return;
      }

      const updated = await dbRepository.updateInvoiceStatus(invoice.id, 'CANCELLED');
      res.json({ success: true, invoice: updated });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
