import { SubscriptionStatus } from '../../types';

export interface FSMTransitionResult {
  valid: boolean;
  message?: string;
}

export class SubscriptionFSM {
  private static readonly ALLOWED_TRANSITIONS: Record<
    SubscriptionStatus,
    SubscriptionStatus[]
  > = {
    DRAFT: ['QUOTATION', 'CLOSED'],
    QUOTATION: ['CONFIRMED', 'DRAFT', 'CLOSED'],
    CONFIRMED: ['ACTIVE', 'CLOSED'],
    ACTIVE: ['PAUSED', 'CLOSED'],
    PAUSED: ['ACTIVE', 'CLOSED'],
    CLOSED: ['DRAFT'], // renewal creates new or restarts
  };

  public static canTransition(
    currentStatus: SubscriptionStatus,
    targetStatus: SubscriptionStatus
  ): FSMTransitionResult {
    const allowed = this.ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      return {
        valid: false,
        message: `Invalid state transition from '${currentStatus}' to '${targetStatus}'. Allowed: [${allowed.join(', ')}]`,
      };
    }
    return { valid: true };
  }
}
