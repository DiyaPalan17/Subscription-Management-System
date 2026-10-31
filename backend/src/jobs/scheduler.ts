import cron from 'node-cron';
import { config } from '../config';
import { BillingEngine } from '../modules/billing/engine';
import { dbRepository } from '../db/repository';

export function initializeBackgroundJobs(): void {
  console.log('[Scheduler] Initializing automated recurring billing and overdue cron jobs...');

  // 1. Daily Automated Billing Run (default midnight: 0 0 * * *)
  cron.schedule(config.billingCronSchedule, async () => {
    console.log(`[Scheduler] [${new Date().toISOString()}] Starting automated billing run...`);
    try {
      const result = await BillingEngine.executeBillingRun(new Date());
      console.log(
        `[Scheduler] Billing run completed: ${result.invoicesGeneratedCount} invoices generated, ${result.skippedIdempotentCount} skipped, ${result.closedExpiredCount} closed.`
      );
    } catch (error) {
      console.error('[Scheduler] Error during recurring billing cron job:', error);
    }
  });

  // 2. Daily Overdue Evaluation Run (default 1 AM: 0 1 * * *)
  cron.schedule(config.overdueCronSchedule, async () => {
    console.log(`[Scheduler] [${new Date().toISOString()}] Evaluating past-due invoices...`);
    try {
      const markedCount = await dbRepository.markInvoicesOverdue(new Date());
      console.log(`[Scheduler] Overdue check completed: marked ${markedCount} invoices OVERDUE.`);
    } catch (error) {
      console.error('[Scheduler] Error during overdue evaluation cron job:', error);
    }
  });

  console.log(
    `[Scheduler] Active schedules: Billing [${config.billingCronSchedule}], Overdue [${config.overdueCronSchedule}]`
  );
}
