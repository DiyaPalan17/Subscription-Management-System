import { Router } from 'express';
import { dbRepository } from '../../db/repository';
import {
  requireAuth,
  requireAdmin,
  requireStaffOrAdmin,
} from '../../middlewares/auth.middleware';

const router = Router();

// --- PRODUCTS & VARIANTS ---
router.get('/products', requireAuth, async (_req, res): Promise<void> => {
  try {
    const products = await dbRepository.listProducts();
    res.json({ success: true, products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/products', requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { name, type, salesPrice, costPrice, notes, isActive = true } = req.body;
    if (!name || salesPrice === undefined) {
      res.status(400).json({ success: false, message: 'Name and salesPrice are required' });
      return;
    }

    const product = await dbRepository.createProduct({
      name,
      type: type || 'SOFTWARE',
      salesPrice: Number(salesPrice),
      costPrice: Number(costPrice || 0),
      notes,
      isActive,
    });

    res.status(201).json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/products/:id', requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const updated = await dbRepository.updateProduct(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.json({ success: true, product: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Add Variant (e.g. Brand = 'Odoo' adds +560.00)
router.post('/products/:id/variants', requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { name, value, priceAdjustment = 0 } = req.body;
    if (!name || !value) {
      res.status(400).json({ success: false, message: 'Variant name and value are required' });
      return;
    }

    const variant = await dbRepository.createProductVariant({
      productId: req.params.id,
      name,
      value,
      priceAdjustment: Number(priceAdjustment),
    });

    res.status(201).json({ success: true, variant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- PLANS ---
router.get('/plans', requireAuth, async (_req, res): Promise<void> => {
  try {
    const plans = await dbRepository.listPlans();
    res.json({ success: true, plans });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/plans', requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const {
      name,
      billingCadence = 'MONTHLY',
      basePrice = 0,
      minQuantity = 1,
      startDate = new Date(),
      endDate = null,
      autoCloseOnExpiry = true,
      allowEarlyClose = true,
      allowPause = true,
      allowRenewal = true,
    } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Plan name is required' });
      return;
    }

    const plan = await dbRepository.createPlan({
      name,
      billingCadence,
      basePrice: Number(basePrice),
      minQuantity: Number(minQuantity),
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      autoCloseOnExpiry,
      allowEarlyClose,
      allowPause,
      allowRenewal,
    });

    res.status(201).json({ success: true, plan });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/plans/:id', requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const updated = await dbRepository.updatePlan(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, message: 'Plan not found' });
      return;
    }
    res.json({ success: true, plan: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- QUOTATION TEMPLATES ---
router.get('/quotation-templates', requireAuth, requireStaffOrAdmin, async (_req, res): Promise<void> => {
  try {
    const templates = await dbRepository.listQuotationTemplates();
    res.json({ success: true, templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/quotation-templates', requireAuth, requireStaffOrAdmin, async (req, res): Promise<void> => {
  try {
    const { name, defaultPlanId, validityDays = 30, templateLines = [] } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Template name is required' });
      return;
    }

    const template = await dbRepository.createQuotationTemplate({
      name,
      defaultPlanId: defaultPlanId || null,
      validityDays: Number(validityDays),
      templateLines,
    });

    res.status(201).json({ success: true, template });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- TAX RULES ---
router.get('/tax-rules', requireAuth, async (_req, res): Promise<void> => {
  try {
    const taxRules = await dbRepository.listTaxRules();
    res.json({ success: true, taxRules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/tax-rules', requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { name, ratePercentage, isActive = true } = req.body;
    if (!name || ratePercentage === undefined) {
      res.status(400).json({ success: false, message: 'Name and ratePercentage are required' });
      return;
    }

    const taxRule = await dbRepository.createTaxRule({
      name,
      ratePercentage: Number(ratePercentage),
      isActive,
    });

    res.status(201).json({ success: true, taxRule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- DISCOUNT RULES ---
router.get('/discount-rules', requireAuth, async (_req, res): Promise<void> => {
  try {
    const discountRules = await dbRepository.listDiscountRules();
    res.json({ success: true, discountRules });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/discount-rules', requireAuth, requireAdmin, async (req, res): Promise<void> => {
  try {
    const {
      code,
      type,
      value,
      targetScope = 'SUBSCRIPTION',
      targetProductId = null,
      minSpend = 0,
      minQuantity = 0,
      maxRedemptions = null,
      startDate = null,
      endDate = null,
      isActive = true,
    } = req.body;

    if (!code || !type || value === undefined) {
      res.status(400).json({ success: false, message: 'Code, type, and value are required' });
      return;
    }

    const existing = await dbRepository.findDiscountRuleByCode(code);
    if (existing) {
      res.status(409).json({ success: false, message: 'Discount code already exists' });
      return;
    }

    const discountRule = await dbRepository.createDiscountRule({
      code: code.toUpperCase(),
      type,
      value: Number(value),
      targetScope,
      targetProductId,
      minSpend: Number(minSpend),
      minQuantity: Number(minQuantity),
      maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive,
    });

    res.status(201).json({ success: true, discountRule });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
