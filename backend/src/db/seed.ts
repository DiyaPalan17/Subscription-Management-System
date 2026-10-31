import { dbRepository } from './repository';
import { getInitialSeedData } from './seed-data';

export async function runSeed() {
  console.log('--- [Brightloop Database Seeder] ---');
  console.log('Initializing seed dataset for Brightloop Platform...');

  const data = getInitialSeedData();
  dbRepository.seedInMemory();

  console.log(`✓ Seeded ${data.users.length} Users (Admin, Staff, Customers)`);
  console.log(`✓ Seeded ${data.products.length} Products with ${data.variants.length} Variants (Odoo Connector +$560.00)`);
  console.log(`✓ Seeded ${data.plans.length} Cadence Plans (Daily, Weekly, Monthly, Yearly)`);
  console.log(`✓ Seeded ${data.taxRules.length} Tax Rules & ${data.discountRules.length} Discount Rules`);
  console.log(`✓ Seeded ${data.quotationTemplates.length} Quotation Templates`);
  console.log(`✓ Seeded ${data.subscriptions.length} Subscriptions (${data.subscriptions.map(s => s.subscriptionNumber).join(', ')})`);
  console.log(`✓ Seeded ${data.invoices.length} Invoices with Aging Overdue Samples`);
  console.log(`✓ Seeded ${data.payments.length} Payments`);
  console.log('--- [Brightloop Database Seed Completed Successfully] ---');
}

if (require.main === module) {
  runSeed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
  });
}
