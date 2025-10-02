'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

const tiers = [
  {
    name: 'Free',
    price: 0,
    priceId: null,
    features: [
      '3 blueprints per month',
      'Basic AI analysis',
      'Live odds access',
      'Community support'
    ],
    limitations: [
      'No advanced analytics',
      'Limited to 3-leg parlays',
      'No PDF exports'
    ]
  },
  {
    name: 'Pro',
    price: 29,
    priceId: 'price_pro_monthly',
    popular: true,
    features: [
      'Unlimited blueprints',
      'Advanced AI reasoning',
      'Monte Carlo simulations',
      'PDF exports',
      'Bankroll tracking',
      'Win/loss analytics',
      'Email alerts for opportunities',
      'Priority support'
    ]
  },
  {
    name: 'Elite',
    price: 99,
    priceId: 'price_elite_monthly',
    features: [
      'Everything in Pro',
      'Custom AI models trained on your preferences',
      'Real-time Slack/Discord alerts',
      'Advanced hedge calculator',
      'Live odds arbitrage finder',
      'Direct access to betting experts',
      'White-glove support',
      'API access'
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
            className={`px-6 py-2 rounded-md ${
              interval === 'monthly' ? 'bg-[var(--accent)] text-white' : 'text-neutral-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setInterval('yearly')}
            className={`px-6 py-2 rounded-md ${
              interval === 'yearly' ? 'bg-[var(--accent)] text-white' : 'text-neutral-400'
            }`}
          >
            Yearly <span className="text-xs text-green-400 ml-1">(Save 20%)</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
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

            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="text-4xl font-bold text-[var(--accent)]">
                ${interval === 'yearly' ? Math.floor(tier.price * 0.8) : tier.price}
                <span className="text-lg text-neutral-400">/mo</span>
              </div>
              {interval === 'yearly' && tier.price > 0 && (
                <div className="text-sm text-green-400 mt-1">
                  Billed ${Math.floor(tier.price * 0.8 * 12)}/year
                </div>
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
              className={`w-full py-3 rounded-lg font-semibold ${
                tier.popular
                  ? 'bg-[var(--accent)] text-white hover:opacity-90'
                  : 'bg-neutral-800 hover:bg-neutral-700'
              }`}
            >
              {tier.price === 0 ? 'Get Started Free' : 'Subscribe Now'}
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
