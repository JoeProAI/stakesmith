import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

export { stripe };

// Subscription tiers
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    simulationLimit: 1000,
    strategiesPerDay: 5,
    features: ['Basic strategies', '1,000 simulations', 'Bet tracking']
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 999, // $9.99 in cents
    priceId: process.env.STRIPE_PRO_PRICE_ID || '',
    simulationLimit: 10000,
    strategiesPerDay: 999,
    features: ['All 15 strategies', '10,000 simulations', 'Priority support', 'Advanced analytics']
  },
  VIP: {
    id: 'vip',
    name: 'VIP',
    price: 2999, // $29.99 in cents
    priceId: process.env.STRIPE_VIP_PRICE_ID || '',
    simulationLimit: 999999,
    strategiesPerDay: 999,
    features: ['Unlimited everything', 'Exclusive strategies', 'Live Discord community', '1-on-1 strategy sessions']
  }
};

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  userEmail: string,
  tier: 'pro' | 'vip',
  successUrl: string,
  cancelUrl: string
) {
  const tierData = tier === 'pro' ? SUBSCRIPTION_TIERS.PRO : SUBSCRIPTION_TIERS.VIP;

  if (!tierData.priceId) {
    throw new Error(`Price ID not configured for ${tier} tier`);
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    line_items: [
      {
        price: tierData.priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      userId,
      tier
    }
  });

  return session;
}

/**
 * Create a portal session for managing subscriptions
 */
export async function createPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  });

  return session;
}

/**
 * Get customer subscription
 */
export async function getCustomerSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 1
  });

  return subscriptions.data[0] || null;
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

/**
 * Get subscription tier from Stripe subscription
 */
export function getSubscriptionTier(subscription: Stripe.Subscription | null): 'free' | 'pro' | 'vip' {
  if (!subscription || subscription.status !== 'active') {
    return 'free';
  }

  const priceId = subscription.items.data[0]?.price.id;

  if (priceId === SUBSCRIPTION_TIERS.PRO.priceId) {
    return 'pro';
  } else if (priceId === SUBSCRIPTION_TIERS.VIP.priceId) {
    return 'vip';
  }

  return 'free';
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(body: string, signature: string): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET not configured');
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
