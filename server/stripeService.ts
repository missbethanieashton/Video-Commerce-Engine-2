import { getUncachableStripeClient } from './stripeClient';

export class StripeService {
  async createCustomer(email: string, userId: string, name?: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });
  }

  async createCheckoutSession(
    customerId: string, 
    priceId: string, 
    successUrl: string, 
    cancelUrl: string,
    mode: 'payment' | 'subscription' = 'payment'
  ) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
  }

  async createPaymentIntent(amount: number, currency: string = 'eur', metadata?: Record<string, string>) {
    const stripe = await getUncachableStripeClient();
    return await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      metadata,
    });
  }

  async createConnectAccount(email: string, userId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.accounts.create({
      type: 'express',
      email,
      metadata: { userId },
      capabilities: {
        transfers: { requested: true },
      },
    });
  }

  async createConnectAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding',
    });
  }

  async createTransfer(amount: number, destinationAccountId: string, metadata?: Record<string, string>) {
    const stripe = await getUncachableStripeClient();
    return await stripe.transfers.create({
      amount: Math.round(amount * 100),
      currency: 'eur',
      destination: destinationAccountId,
      metadata,
    });
  }

  async getConnectAccount(accountId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.accounts.retrieve(accountId);
  }

  async createLoginLink(accountId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.accounts.createLoginLink(accountId);
  }
}

export const stripeService = new StripeService();
