import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { createCheckoutSession } from '@/lib/stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { tier, token } = await req.json();

    if (!tier || !['pro', 'vip'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier' },
        { status: 400 }
      );
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const userId = decodedToken.uid;
    const userEmail = decodedToken.email || '';

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${appUrl}/dashboard?subscription=success`;
    const cancelUrl = `${appUrl}/pricing?subscription=canceled`;

    const session = await createCheckoutSession(
      userId,
      userEmail,
      tier as 'pro' | 'vip',
      successUrl,
      cancelUrl
    );

    return NextResponse.json({
      url: session.url
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
