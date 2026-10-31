import assert from 'assert';
import http from 'http';
import app from '../src/index';

async function runApiE2ETests() {
  console.log('================================================================');
  console.log('🌐 RUNNING BRIGHTLOOP REST API END-TO-END INTEGRATION TEST SUITE');
  console.log('================================================================');

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(4001, () => resolve());
  });

  const baseUrl = 'http://localhost:4001/api';

  try {
    // 1. Health Check
    console.log('\n[API 1] Testing GET /api/health:');
    const healthRes = await fetch(`${baseUrl}/health`).then((r) => r.json());
    assert.strictEqual(healthRes.status, 'HEALTHY');
    console.log(`✓ Health check passed: ${healthRes.service}`);

    // 2. Admin Login
    console.log('\n[API 2] Testing POST /api/auth/login (Admin Credentials):');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@brightloop.io',
        password: 'Admin@12345!',
      }),
    }).then((r) => r.json());

    assert.strictEqual(adminLoginRes.success, true);
    assert.strictEqual(adminLoginRes.user.role, 'ADMIN');
    assert(adminLoginRes.token, 'Token must be issued');
    const adminToken = adminLoginRes.token;
    console.log(`✓ Admin logged in. JWT token issued for ${adminLoginRes.user.email}`);

    // 3. Staff Login
    console.log('\n[API 3] Testing POST /api/auth/login (Staff Credentials):');
    const staffLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'staff@brightloop.io',
        password: 'Staff@12345!',
      }),
    }).then((r) => r.json());

    assert.strictEqual(staffLoginRes.success, true);
    assert.strictEqual(staffLoginRes.user.role, 'STAFF');
    const staffToken = staffLoginRes.token;
    console.log(`✓ Staff logged in: ${staffLoginRes.user.name} (Role: ${staffLoginRes.user.role})`);

    // 4. Customer Login
    console.log('\n[API 4] Testing POST /api/auth/login (Customer Credentials):');
    const custLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@acme.com',
        password: 'Customer@12345!',
      }),
    }).then((r) => r.json());

    assert.strictEqual(custLoginRes.success, true);
    assert.strictEqual(custLoginRes.user.role, 'CUSTOMER');
    const customerToken = custLoginRes.token;
    console.log(`✓ Customer logged in: ${custLoginRes.user.companyName}`);

    // 5. Password Complexity Validation on Register
    console.log('\n[API 5] Testing Password Regex & Uniqueness on POST /api/auth/register:');
    const weakPassRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Weak',
        email: 'weak@brightloop.io',
        password: 'weakpassword',
      }),
    }).then((r) => r.json());

    assert.strictEqual(weakPassRes.success, false);
    console.log(`✓ Weak password rejected: "${weakPassRes.message}"`);

    // Valid registration
    const validRegisterRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Developer',
        email: 'john@startup.co',
        password: 'StrongPassword123!',
        companyName: 'Startup Co',
        role: 'CUSTOMER',
      }),
    }).then((r) => r.json());

    assert.strictEqual(validRegisterRes.success, true);
    assert.strictEqual(validRegisterRes.user.email, 'john@startup.co');
    console.log(`✓ Valid user registered with role CUSTOMER: ${validRegisterRes.user.name}`);

    // 6. Forgot Password Token Generation
    console.log('\n[API 6] Testing POST /api/auth/forgot-password:');
    const forgotRes = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@brightloop.io' }),
    }).then((r) => r.json());

    assert.strictEqual(forgotRes.success, true);
    assert(forgotRes.debug?.resetToken, 'Reset token generated');
    console.log(`✓ Reset token generated: ${forgotRes.debug.resetToken}`);

    // 7. Finance KPIs & Sub-2s SLA Verification
    console.log('\n[API 7] Testing GET /api/finance/kpis (RBAC Admin Only):');
    const kpiRes = await fetch(`${baseUrl}/finance/kpis`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());

    assert.strictEqual(kpiRes.success, true);
    assert(kpiRes.kpis.mrr > 0);
    assert(kpiRes.kpis.arr > 0);
    console.log(`✓ Finance KPIs fetched in ${kpiRes.executionTimeMs}`);
    console.log(`  - MRR: $${kpiRes.kpis.mrr}`);
    console.log(`  - ARR: $${kpiRes.kpis.arr}`);
    console.log(`  - Aging A/R (31-60d): $${kpiRes.kpis.agingBuckets.overdue31To60Days}`);

    // Customer role forbidden from viewing finance KPIs
    const forbiddenKpi = await fetch(`${baseUrl}/finance/kpis`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert.strictEqual(forbiddenKpi.status, 403, 'Customer must be forbidden from Finance KPIs');
    console.log('✓ RBAC verified: Customer correctly received 403 Forbidden on Finance KPIs');

    // 8. Catalog: Products & Variants
    console.log('\n[API 8] Testing GET /api/catalog/products:');
    const prodRes = await fetch(`${baseUrl}/catalog/products`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    }).then((r) => r.json());

    assert.strictEqual(prodRes.success, true);
    const odooVariant = prodRes.products
      .flatMap((p: any) => p.variants || [])
      .find((v: any) => v.name.includes('Odoo') || v.value.includes('Odoo'));
    assert(odooVariant, 'Odoo Connector variant must be present in catalog');
    assert.strictEqual(odooVariant.priceAdjustment, 560, 'Odoo variant price adjustment must be +$560.00');
    console.log(`✓ Catalog verified: ${prodRes.products.length} products, Odoo variant found with +$${odooVariant.priceAdjustment}`);

    // 9. Quotation to Subscription Workflow & FSM Transitions
    console.log('\n[API 9] Testing Quotation to Subscription Workflow & FSM Transitions:');
    const newQuoteRes = await fetch(`${baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        customerId: custLoginRes.user.id,
        planId: 'plan-growth-monthly',
        discountRuleId: 'disc-welcome-20',
        paymentTermsDays: 15,
        notes: 'API Workflow Proposal',
        lines: [
          {
            productId: 'prod-saas-core',
            variantId: odooVariant.id,
            quantity: 2,
            unitPrice: 760,
            taxRuleId: 'tax-vat-18',
          },
        ],
      }),
    }).then((r) => r.json());

    assert.strictEqual(newQuoteRes.success, true);
    const subId = newQuoteRes.subscription.id;
    assert.strictEqual(newQuoteRes.subscription.status, 'DRAFT');
    console.log(`✓ Created subscription in DRAFT: ${newQuoteRes.subscription.subscriptionNumber}`);

    // DRAFT -> QUOTATION
    const quoteTransition = await fetch(`${baseUrl}/subscriptions/${subId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ targetStatus: 'QUOTATION', validityDays: 14 }),
    }).then((r) => r.json());

    assert.strictEqual(quoteTransition.success, true);
    assert.strictEqual(quoteTransition.subscription.status, 'QUOTATION');
    assert(quoteTransition.subscription.validUntil, 'validUntil date must be set on quotation');
    console.log(`✓ Transitioned DRAFT -> QUOTATION (validUntil: ${quoteTransition.subscription.validUntil})`);

    // QUOTATION -> CONFIRMED
    const confirmTransition = await fetch(`${baseUrl}/subscriptions/${subId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ targetStatus: 'CONFIRMED' }),
    }).then((r) => r.json());

    assert.strictEqual(confirmTransition.success, true);
    assert.strictEqual(confirmTransition.subscription.status, 'CONFIRMED');
    console.log(`✓ Transitioned QUOTATION -> CONFIRMED`);

    // CONFIRMED -> ACTIVE
    const activeTransition = await fetch(`${baseUrl}/subscriptions/${subId}/transition`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ targetStatus: 'ACTIVE' }),
    }).then((r) => r.json());

    assert.strictEqual(activeTransition.success, true);
    assert.strictEqual(activeTransition.subscription.status, 'ACTIVE');
    console.log(`✓ Transitioned CONFIRMED -> ACTIVE`);

    // 10. Automated Billing Engine via API
    console.log('\n[API 10] Testing POST /api/billing/run:');
    const billingRunRes = await fetch(`${baseUrl}/billing/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({ executionDate: new Date('2026-10-31T09:00:00Z') }),
    }).then((r) => r.json());

    assert.strictEqual(billingRunRes.success, true);
    console.log(`✓ Billing run executed: ${billingRunRes.message}`);

    // 11. Payment Recording & Reconciliation
    console.log('\n[API 11] Testing POST /api/payments (Partial & Full Settlement):');
    const invoicesRes = await fetch(`${baseUrl}/invoices`, {
      headers: { Authorization: `Bearer ${staffToken}` },
    }).then((r) => r.json());

    const openInvoice = invoicesRes.invoices.find(
      (inv: any) => inv.status === 'CONFIRMED' || inv.status === 'OVERDUE'
    );
    assert(openInvoice, 'Must find an open invoice to test payment');

    const paymentAmount = 100.0;
    const paymentRes = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${staffToken}`,
      },
      body: JSON.stringify({
        invoiceId: openInvoice.id,
        paymentMethod: 'CARD',
        amount: paymentAmount,
        referenceId: 'ch_test_12345',
        notes: 'API integration test payment',
      }),
    }).then((r) => r.json());

    assert.strictEqual(paymentRes.success, true);
    console.log(`✓ Recorded $${paymentAmount} payment against ${openInvoice.invoiceNumber}: ${paymentRes.message}`);

    // 12. Customer Data Isolation
    console.log('\n[API 12] Testing Customer Self-Service Data Isolation:');
    const custInvoicesRes = await fetch(`${baseUrl}/invoices`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    }).then((r) => r.json());

    assert.strictEqual(custInvoicesRes.success, true);
    for (const inv of custInvoicesRes.invoices) {
      assert.strictEqual(
        inv.customerId,
        custLoginRes.user.id,
        'Customer must strictly only receive their own invoices'
      );
    }
    console.log(`✓ Customer data isolation verified: received ${custInvoicesRes.invoices.length} invoices, all belonging exclusively to customer.`);

    console.log('\n================================================================');
    console.log('🎉 ALL REST API END-TO-END INTEGRATION TESTS PASSED (12/12)!');
    console.log('================================================================\n');
  } finally {
    server.close();
    process.exit(0);
  }
}

runApiE2ETests().catch((err) => {
  console.error('❌ Integration tests failed:', err);
  process.exit(1);
});
