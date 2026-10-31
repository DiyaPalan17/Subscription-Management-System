import { Router, Response } from 'express';
import { dbRepository } from '../../db/repository';
import {
  requireAuth,
  requireStaffOrAdmin,
  AuthenticatedRequest,
} from '../../middlewares/auth.middleware';
import { PaymentMethod } from '../../types';

const router = Router();

// 1. RECORD PAYMENT (PARTIAL OR FULL RECONCILIATION)
router.post(
  '/',
  requireAuth,
  requireStaffOrAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const {
        invoiceId,
        paymentMethod = 'MANUAL',
        amount,
        paymentDate = new Date(),
        notes,
        referenceId,
      } = req.body;

      if (!invoiceId || amount === undefined || Number(amount) <= 0) {
        res.status(400).json({
          success: false,
          message: 'Valid invoiceId and positive payment amount are required',
        });
        return;
      }

      const invoice = await dbRepository.findInvoiceById(invoiceId);
      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }

      if (invoice.status === 'PAID') {
        res.status(400).json({
          success: false,
          message: 'This invoice has already been fully settled',
        });
        return;
      }

      if (invoice.status === 'CANCELLED') {
        res.status(400).json({
          success: false,
          message: 'Cannot record payments against a CANCELLED invoice',
        });
        return;
      }

      const numericAmount = Number(Number(amount).toFixed(2));
      const remainingBalance = Number((invoice.totalAmount - invoice.amountPaid).toFixed(2));

      if (numericAmount > remainingBalance) {
        res.status(400).json({
          success: false,
          message: `Payment amount ($${numericAmount}) exceeds remaining balance ($${remainingBalance})`,
        });
        return;
      }

      const { payment, updatedInvoice } = await dbRepository.recordPayment({
        invoiceId,
        paymentMethod: paymentMethod as PaymentMethod,
        amount: numericAmount,
        paymentDate: new Date(paymentDate),
        notes: notes || null,
        referenceId: referenceId || null,
      });

      res.status(201).json({
        success: true,
        message:
          updatedInvoice.status === 'PAID'
            ? 'Payment recorded in full. Invoice marked PAID.'
            : `Partial payment of $${numericAmount} recorded. Remaining balance: $${(
                updatedInvoice.totalAmount - updatedInvoice.amountPaid
              ).toFixed(2)}`,
        payment,
        invoice: updatedInvoice,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

// 2. GET PAYMENTS BY INVOICE
router.get(
  '/invoice/:invoiceId',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const invoice = await dbRepository.findInvoiceById(req.params.invoiceId);
      if (!invoice) {
        res.status(404).json({ success: false, message: 'Invoice not found' });
        return;
      }

      // Customer authorization check
      if (req.user?.role === 'CUSTOMER' && invoice.customerId !== req.user.id) {
        res.status(403).json({ success: false, message: 'Forbidden' });
        return;
      }

      res.json({ success: true, payments: invoice.payments || [] });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

export default router;
