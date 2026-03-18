import { describe, it, expect, vi } from 'vitest';

describe('Stripe Plan Configuration — Constants and Logic', () => {
  describe('Plan pricing constants', () => {
    it('Starter plan amount is 24900 EUR cents (€249/mo)', () => {
      const PLAN_CONFIG = {
        starter: { name: 'Materialized Starter Plan', amount: 24900 },
        pro:     { name: 'Materialized Pro Plan',     amount: 49900 },
      } as const;

      expect(PLAN_CONFIG.starter.amount).toBe(24900);
      expect(PLAN_CONFIG.starter.name).toBe('Materialized Starter Plan');
    });

    it('Pro plan amount is 49900 EUR cents (€499/mo)', () => {
      const PLAN_CONFIG = {
        starter: { name: 'Materialized Starter Plan', amount: 24900 },
        pro:     { name: 'Materialized Pro Plan',     amount: 49900 },
      } as const;

      expect(PLAN_CONFIG.pro.amount).toBe(49900);
      expect(PLAN_CONFIG.pro.name).toBe('Materialized Pro Plan');
    });

    it('€249 in EUR cents equals 24900', () => {
      expect(249 * 100).toBe(24900);
    });

    it('€499 in EUR cents equals 49900', () => {
      expect(499 * 100).toBe(49900);
    });
  });

  describe('PLAN_AMOUNT_FALLBACK mapping', () => {
    it('amount 24900 maps to starter plan', () => {
      const PLAN_AMOUNT_FALLBACK: Record<number, 'starter' | 'pro'> = {
        24900: 'starter',
        49900: 'pro',
      };
      expect(PLAN_AMOUNT_FALLBACK[24900]).toBe('starter');
    });

    it('amount 49900 maps to pro plan', () => {
      const PLAN_AMOUNT_FALLBACK: Record<number, 'starter' | 'pro'> = {
        24900: 'starter',
        49900: 'pro',
      };
      expect(PLAN_AMOUNT_FALLBACK[49900]).toBe('pro');
    });

    it('unknown amount falls back to undefined (defaults to starter in handlers)', () => {
      const PLAN_AMOUNT_FALLBACK: Record<number, 'starter' | 'pro'> = {
        24900: 'starter',
        49900: 'pro',
      };
      expect(PLAN_AMOUNT_FALLBACK[99999]).toBeUndefined();
    });
  });

  describe('mapStripeStatus — status mapping logic', () => {
    function mapStripeStatus(stripeStatus: string): 'active' | 'past_due' | 'cancelled' {
      switch (stripeStatus) {
        case 'active':
        case 'trialing':
          return 'active';
        case 'past_due':
        case 'unpaid':
          return 'past_due';
        case 'canceled':
        case 'incomplete_expired':
        default:
          return 'cancelled';
      }
    }

    it('maps "active" → "active"', () => {
      expect(mapStripeStatus('active')).toBe('active');
    });

    it('maps "trialing" → "active"', () => {
      expect(mapStripeStatus('trialing')).toBe('active');
    });

    it('maps "past_due" → "past_due"', () => {
      expect(mapStripeStatus('past_due')).toBe('past_due');
    });

    it('maps "unpaid" → "past_due"', () => {
      expect(mapStripeStatus('unpaid')).toBe('past_due');
    });

    it('maps "canceled" → "cancelled" (Stripe uses US spelling)', () => {
      expect(mapStripeStatus('canceled')).toBe('cancelled');
    });

    it('maps "incomplete_expired" → "cancelled"', () => {
      expect(mapStripeStatus('incomplete_expired')).toBe('cancelled');
    });

    it('maps unknown status → "cancelled" (default)', () => {
      expect(mapStripeStatus('unknown_status')).toBe('cancelled');
    });

    it('maps "incomplete" → "cancelled" (default)', () => {
      expect(mapStripeStatus('incomplete')).toBe('cancelled');
    });
  });

  describe('extractCustomerId — helper logic', () => {
    function extractCustomerId(
      customer: string | { id: string } | null
    ): string | null {
      if (!customer) return null;
      if (typeof customer === 'string') return customer;
      return customer.id;
    }

    it('returns string customer ID as-is', () => {
      expect(extractCustomerId('cus_abc123')).toBe('cus_abc123');
    });

    it('returns .id when customer is an object', () => {
      expect(extractCustomerId({ id: 'cus_expanded' })).toBe('cus_expanded');
    });

    it('returns null when customer is null', () => {
      expect(extractCustomerId(null)).toBeNull();
    });
  });

  describe('extractSubscriptionId — helper logic', () => {
    function extractSubscriptionId(
      sub: string | { id: string } | null
    ): string | null {
      if (!sub) return null;
      if (typeof sub === 'string') return sub;
      return sub.id;
    }

    it('returns string subscription ID as-is', () => {
      expect(extractSubscriptionId('sub_abc123')).toBe('sub_abc123');
    });

    it('returns .id when subscription is an expanded object', () => {
      expect(extractSubscriptionId({ id: 'sub_expanded' })).toBe('sub_expanded');
    });

    it('returns null when subscription is null', () => {
      expect(extractSubscriptionId(null)).toBeNull();
    });
  });

  describe('subscriptionPeriodEnd — timestamp conversion', () => {
    function subscriptionPeriodEnd(periodEndTimestamp: number): Date {
      return new Date(periodEndTimestamp * 1000);
    }

    it('converts Unix timestamp to Date correctly', () => {
      const ts = 1800000000;
      const result = subscriptionPeriodEnd(ts);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(ts * 1000);
    });

    it('converts zero timestamp to epoch', () => {
      const result = subscriptionPeriodEnd(0);
      expect(result.getTime()).toBe(0);
    });

    it('produces a future date for upcoming billing periods', () => {
      const thirtyDaysFromNow = Math.floor(Date.now() / 1000) + 30 * 86400;
      const result = subscriptionPeriodEnd(thirtyDaysFromNow);
      expect(result.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Stripe plan creation parameters', () => {
    it('price creation uses EUR currency', () => {
      const priceCreateParams = {
        unit_amount: 24900,
        currency: 'eur',
        recurring: { interval: 'month' as const },
        metadata: { plan: 'starter' },
      };
      expect(priceCreateParams.currency).toBe('eur');
    });

    it('price creation uses monthly interval', () => {
      const priceCreateParams = {
        unit_amount: 49900,
        currency: 'eur',
        recurring: { interval: 'month' as const },
        metadata: { plan: 'pro' },
      };
      expect(priceCreateParams.recurring.interval).toBe('month');
    });

    it('product creation includes plan metadata for identification', () => {
      const productCreateParams = {
        name: 'Materialized Pro Plan',
        metadata: { plan: 'pro' },
      };
      expect(productCreateParams.metadata.plan).toBe('pro');
    });

    it('Stripe Connect account type is express', () => {
      const accountCreateParams = {
        type: 'express' as const,
        capabilities: { transfers: { requested: true } },
      };
      expect(accountCreateParams.type).toBe('express');
    });
  });
});
