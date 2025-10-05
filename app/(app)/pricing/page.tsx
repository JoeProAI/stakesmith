'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

const tiers = [
  {
    name: 'Basic',
    price: 12,
    annualPrice: 120,
    priceId: 'price_basic_monthly',
    features: [
      '15 blueprints per week',
      'Basic AI analysis',
      'Live DraftKings odds',
      'Bankroll tracking',
      'Community support'
    ],
    limitations: [
      'No Monte Carlo simulations',
      'No PDF exports',
      'Standard support'
    ]
  },
  {
    name: 'Pro',
    price: 24,
    annualPrice: 240,
    priceId: 'price_pro_monthly',
    popular: true,
    features: [
      'Unlimited blueprints',
      'Advanced AI reasoning (Grok + GPT-4o)',
      'Monte Carlo simulations (1k iterations)',
      'PDF exports',
      'Advanced bankroll tracking',
      'Win/loss analytics',
      'Email alerts',
      'Priority support'
    ]
  },
  {
    name: 'VIP',
    price: 59,
    annualPrice: 590,
    priceId: 'price_vip_monthly',
    features: [
      'Everything in Pro',
      'Custom AI models trained on your style',
      'Real-time Slack/Discord alerts',
      'Advanced hedge calculator',
      'Live odds arbitrage finder',
      'Exclusive VIP Discord channel',
      'White-glove support',
      'API access (coming soon)'
    ]
  },
  {
    name: 'Founder Lifetime',
    price: 79,
    isLifetime: true,
    priceId: 'price_founder_lifetime',
    badge: 'Limited: 300 spots',
    features: [
      'All VIP features forever',
      'Lifetime access - pay once',
      'Founding member badge',
      'Early access to new features',
      'Exclusive founder-only channel',
      'Priority feature requests',
      'Direct line to founders',
      'Lock in all future features'
    ]
  }
];

export default function Pricing() {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = async (priceId: string | null) => {
    if (!priceId) return; // Free tier

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId })
      });

      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-neutral-400 text-lg">
          From casual bettor to professional gambler - we have you covered
        </p>

        <div className="inline-flex items-center gap-3 mt-6 p-1 rounded-lg bg-neutral-800">
          <button
            onClick={() => setInterval('monthly')}
            className={`px-6 py-2 rounded-md transition-colors ${
              interval === 'monthly' ? 'bg-[var(--accent)] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-6 py-2 rounded-md transition-colors ${
              interval === 'yearly' ? 'bg-[var(--accent)] text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Annual <span className="text-xs text-green-400 ml-1">(2 months free)</span>
          </button>
        </div>

        <div className="mt-6 px-4 py-3 bg-gradient-to-r from-yellow-600/10 to-orange-600/10 border border-yellow-600/30 rounded-lg">
          <p className="text-sm text-yellow-200">
            <strong>🔥 Founder Lifetime Special:</strong> First 300 members lock in all VIP features forever for just $79 one-time. No recurring fees, ever.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {tiers.map((tier, idx) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`card p-6 relative ${
              tier.popular ? 'ring-2 ring-[var(--accent)]' : ''
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent)] px-4 py-1 rounded-full text-xs font-semibold">
                MOST POPULAR
              </div>
            )}
            
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-600 to-orange-600 px-4 py-1 rounded-full text-xs font-semibold">
                {tier.badge}
              </div>
            )}

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              {tier.isLifetime ? (
                <>
                  <div className="text-4xl font-bold text-[var(--accent)]">
                    ${tier.price}
                    <span className="text-lg text-neutral-400"> one-time</span>
                  </div>
                  <div className="text-sm text-green-400 mt-1">
                    Lifetime access • No recurring fees
                  </div>
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold text-[var(--accent)]">
                    ${interval === 'yearly' && tier.annualPrice ? Math.floor(tier.annualPrice / 12) : tier.price}
                    <span className="text-lg text-neutral-400">/mo</span>
                  </div>
                  {interval === 'yearly' && tier.annualPrice && (
                    <div className="text-sm text-green-400 mt-1">
                      ${tier.annualPrice}/year • Save ${(tier.price * 12) - tier.annualPrice}
                    </div>
                  )}
                </>
              )}
            </div>

            <ul className="space-y-3 mb-6">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <span className="text-green-400">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
              {tier.limitations?.map((limitation) => (
                <li key={limitation} className="flex items-start gap-2 text-sm text-neutral-500">
                  <span>✗</span>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(tier.priceId)}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                tier.popular || tier.badge
                  ? 'bg-[var(--accent)] text-white hover:opacity-90'
                  : 'bg-neutral-800 hover:bg-neutral-700'
              }`}
            >
              {tier.isLifetime 
                ? 'Claim Lifetime Access' 
                : interval === 'yearly' 
                  ? 'Subscribe Annually' 
                  : 'Subscribe Monthly'}
            </button>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h3 className="text-2xl font-bold mb-4">Why StakeSmith?</h3>
        <div className="grid md:grid-cols-4 gap-6 mt-8">
          <div className="card p-6">
            <div className="text-4xl mb-3">🤖</div>
            <h4 className="font-semibold mb-2">AI-Powered</h4>
            <p className="text-sm text-neutral-400">
              Dual AI system (Grok + GPT-4o) analyzes every angle
            </p>
          </div>
          <div className="card p-6">
            <div className="text-4xl mb-3">📊</div>
            <h4 className="font-semibold mb-2">Live Odds</h4>
            <p className="text-sm text-neutral-400">
              Real-time DraftKings odds with EV calculations
            </p>
          </div>
          <div className="card p-6">
            <div className="text-4xl mb-3">🎯</div>
            <h4 className="font-semibold mb-2">Personalized</h4>
            <p className="text-sm text-neutral-400">
              Learns your preferences and betting style
            </p>
          </div>
          <div className="card p-6">
            <div className="text-4xl mb-3">💰</div>
            <h4 className="font-semibold mb-2">ROI Focused</h4>
            <p className="text-sm text-neutral-400">
              Track performance and optimize your edge
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
