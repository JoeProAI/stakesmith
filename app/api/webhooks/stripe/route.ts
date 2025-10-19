import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { Timestamp } from 'firebase/firestore';
import { verifyWebhookSignature, getSubscriptionTier } from '@/lib/stripe';
import { updateUserSubscription } from '@/lib/subscription-manager';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16'
});

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature') || '';

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = verifyWebhookSignature(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log(`📨 Stripe webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (!userId) {
          console.warn('No userId in subscription metadata');
          break;
        }

        const tier = getSubscriptionTier(subscription);

        const startSeconds = subscription.current_period_start || 0;
        const endSeconds = subscription.current_period_end || 0;

        await updateUserSubscription(userId, {
          tier,
          stripeCustomerId: subscription.customer as string,
          stripeSubscriptionId: subscription.id,
          status: subscription.status as any,
          currentPeriodStart: startSeconds ? Timestamp.fromMillis(startSeconds * 1000) : undefined,
          currentPeriodEnd: endSeconds ? Timestamp.fromMillis(endSeconds * 1000) : undefined
        });

        console.log(`✅ Subscription updated: ${userId} → ${tier}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        if (!userId) {
          console.warn('No userId in subscription metadata');
          break;
        }

        await updateUserSubscription(userId, {
          tier: 'free',
          status: 'canceled',
          canceledAt: Timestamp.now()
        });

        console.log(`❌ Subscription canceled: ${userId}`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Get subscription for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          limit: 1
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          const userId = subscription.metadata.userId;

          if (userId) {
            console.log(`💰 Payment succeeded for ${userId}`);
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // Get subscription for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          limit: 1
        });

        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          const userId = subscription.metadata.userId;

          if (userId) {
            await updateUserSubscription(userId, {
              status: 'past_due'
            });

            console.log(`⚠️ Payment failed for ${userId}`);
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log(`💸 Refund processed: ${charge.id}`);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
