import Stripe from 'stripe';
import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

const PLAN_AMOUNT_MAP: Record<number, 'starter' | 'pro'> = {
  24900: 'starter',
  49900: 'pro',
};

function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
    case 'unpaid':
      return 'past_due';
    case 'canceled':
    case 'incomplete_expired':
      return 'cancelled';
    default:
      return 'active';
  }
}

function planFromSubscription(subscription: Stripe.Subscription): 'starter' | 'pro' {
  const item = subscription.items?.data?.[0];
  const amount = item?.price?.unit_amount ?? 0;
  return PLAN_AMOUNT_MAP[amount] ?? 'starter';
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  if (session.mode !== 'subscription') return;

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

  if (!customerId || !subscriptionId) {
    console.warn('[Webhook] checkout.session.completed: missing customer or subscription ID');
    return;
  }

  const metaUserId = session.metadata?.userId;
  const metaPlan = session.metadata?.plan as 'starter' | 'pro' | undefined;

  let userId: string | undefined = metaUserId;
  if (!userId) {
    const user = await storage.getUserByStripeCustomerId(customerId);
    userId = user?.id;
  }
  if (!userId) {
    console.warn('[Webhook] checkout.session.completed: no user found for customer', customerId);
    return;
  }

  const stripe = await getUncachableStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
  const plan = metaPlan ?? planFromSubscription(subscription);

  await storage.upsertBrandSubscription({
    userId,
    plan,
    status: 'active',
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd,
  });

  console.log(`[Webhook] Subscription activated — user ${userId}, plan ${plan}, ends ${currentPeriodEnd.toISOString()}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId) return;

  const user = await storage.getUserByStripeCustomerId(customerId);
  if (!user) {
    console.warn('[Webhook] customer.subscription.updated: no user found for customer', customerId);
    return;
  }

  const plan = planFromSubscription(subscription);
  const status = mapStripeStatus(subscription.status);
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);

  await storage.upsertBrandSubscription({
    userId: user.id,
    plan,
    status,
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd,
  });

  console.log(`[Webhook] Subscription updated — user ${user.id}, plan ${plan}, status ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId) return;

  const user = await storage.getUserByStripeCustomerId(customerId);
  if (!user) return;

  await storage.upsertBrandSubscription({
    userId: user.id,
    plan: planFromSubscription(subscription),
    status: 'cancelled',
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: null,
  });

  console.log(`[Webhook] Subscription cancelled — user ${user.id}`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id;
  if (!customerId) return;

  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : (invoice.subscription as any)?.id;
  if (!subscriptionId) return;

  const user = await storage.getUserByStripeCustomerId(customerId);
  if (!user) return;

  const stripe = await getUncachableStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
  const plan = planFromSubscription(subscription);

  await storage.upsertBrandSubscription({
    userId: user.id,
    plan,
    status: 'active',
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd,
  });

  console.log(`[Webhook] Payment succeeded — user ${user.id}, period ends ${currentPeriodEnd.toISOString()}`);
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : (invoice.customer as any)?.id;
  if (!customerId) return;

  const user = await storage.getUserByStripeCustomerId(customerId);
  if (!user) return;

  const existing = await storage.getBrandSubscription(user.id);
  if (!existing) return;

  await storage.upsertBrandSubscription({
    userId: user.id,
    plan: existing.plan as 'starter' | 'pro',
    status: 'past_due',
    stripeSubscriptionId: existing.stripeSubscriptionId ?? undefined,
    currentPeriodEnd: existing.currentPeriodEnd ?? undefined,
  });

  console.log(`[Webhook] Payment failed — user ${user.id} marked past_due`);
}

async function dispatchEvent(event: Stripe.Event): Promise<void> {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        break;
    }
  } catch (err) {
    console.error(`[Webhook] Error handling ${event.type}:`, err);
    throw err;
  }
}

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    let event: Stripe.Event;
    try {
      event = JSON.parse(payload.toString('utf8')) as Stripe.Event;
    } catch {
      console.warn('[Webhook] Could not parse event payload as JSON — skipping custom handlers');
      return;
    }

    await dispatchEvent(event);
  }
}
