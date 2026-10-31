import { BillingCadence } from '../../types';

export function calculateNextPeriod(
  currentPeriodStart: Date,
  cadence: BillingCadence
): { periodStart: Date; periodEnd: Date; nextBillingDate: Date } {
  const start = new Date(currentPeriodStart);
  const end = new Date(start);

  switch (cadence) {
    case 'DAILY':
      end.setDate(end.getDate() + 1);
      break;
    case 'WEEKLY':
      end.setDate(end.getDate() + 7);
      break;
    case 'MONTHLY': {
      const currentDay = end.getDate();
      end.setMonth(end.getMonth() + 1);
      // Handle month end overflow (e.g. Jan 31 to Feb 28)
      if (end.getDate() < currentDay) {
        end.setDate(0);
      }
      break;
    }
    case 'YEARLY':
      end.setFullYear(end.getFullYear() + 1);
      break;
  }

  // In recurring subscription billing, next billing date is on the end date of current period
  const nextBillingDate = new Date(end);

  return {
    periodStart: start,
    periodEnd: end,
    nextBillingDate,
  };
}

export function advancePeriod(
  currentPeriodEnd: Date,
  cadence: BillingCadence
): { newPeriodStart: Date; newPeriodEnd: Date; nextBillingDate: Date } {
  const newPeriodStart = new Date(currentPeriodEnd);
  const { periodEnd: newPeriodEnd, nextBillingDate } = calculateNextPeriod(
    newPeriodStart,
    cadence
  );

  return {
    newPeriodStart,
    newPeriodEnd,
    nextBillingDate,
  };
}
