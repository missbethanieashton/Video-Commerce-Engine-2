import Stripe from 'stripe';
import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

const PLAN_AMOUNT_FALLBACK: Record<number, 'starter' | 'pro'> = {
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

async function planFromSubscription(subscription: Stripe.Subscription): Promise<'starter' | 'pro'> {
  const item = subscription.items?.data?.[0];
  if (!item) return 'starter';

  const price = item.price as Stripe.Price;

  if (price.metadata?.plan === 'starter' || price.metadata?.plan === 'pro') {
    return price.metadata.plan;
  }

  if (typeof price.product === 'string') {
    try {
      const stripe = await getUncachableStripeClient();
      const product = await stripe.products.retrieve(price.product);
      if (product.metadata?.plan === 'starter' || product.metadata?.plan === 'pro') {
        return product.metadata.plan;
      }
    } catch {
    }
  } else if (price.product && typeof price.product === 'object') {
    const product = price.product as Stripe.Product;
    if (product.metadata?.plan === 'starter' || product.metadata?.plan === 'pro') {
      return product.metadata.plan;
    }
  }

  return PLAN_AMOUNT_FALLBACK[price.unit_amount ?? 0] ?? 'starter';
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
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  });
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
  const plan = metaPlan ?? (await planFromSubscription(subscription));

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

  const stripe = await getUncachableStripeClient();
  const fullSub = await stripe.subscriptions.retrieve(subscription.id, {
    expand: ['items.data.price.product'],
  });

  const plan = await planFromSubscription(fullSub);
  const status = mapStripeStatus(fullSub.status);
  const currentPeriodEnd = new Date((fullSub as any).current_period_end * 1000);

  await storage.upsertBrandSubscription({
    userId: user.id,
    plan,
    status,
    stripeSubscriptionId: fullSub.id,
    currentPeriodEnd,
  });

  console.log(`[Webhook] Subscription updated — user ${user.id}, plan ${plan}, status ${status}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  if (!customerId) return;

  const user = await storage.getUserByStripeCustomerId(customerId);
  if (!user) return;

  const existing = await storage.getBrandSubscription(user.id);

  await storage.upsertBrandSubscription({
    userId: user.id,
    plan: (existing?.plan ?? 'starter') as 'starter' | 'pro',
    status: 'cancelled',
    stripeSubscriptionId: subscription.id,
    currentPeriodEnd: undefined,
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
  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data.price.product'],
  });
  const currentPeriodEnd = new Date((subscription as any).current_period_end * 1000);
  const plan = await planFromSubscription(subscription);

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
    plan: (existing.plan ?? 'starter') as 'starter' | 'pro',
    status: 'past_due',
    stripeSubscriptionId: existing.stripeSubscriptionId ?? undefined,
    currentPeriodEnd: existing.currentPeriodEnd ?? undefined,
  });

  console.log(`[Webhook] Payment failed — user ${user.id} marked past_due`);
}

export async function dispatchStripeEvent(event: Stripe.Event): Promise<void> {
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

    await dispatchStripeEvent(event);
  }
}
