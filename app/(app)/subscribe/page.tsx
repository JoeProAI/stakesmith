'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '/forever',
    description: 'Full access - No credit card required',
    features: [
      'Unlimited strategy generations',
      'All 15 strategies',
      'Real-time NFL odds',
      'Bet tracking',
      'Performance analytics',
      'Monte Carlo simulations'
    ],
    cta: 'Start Free',
    highlight: true,
    requiresCode: false
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'Full access to all features',
    features: [
      'Unlimited blueprint generations',
      'All 12 strategies',
      'Risk level controls',
      'Save & regenerate blueprints',
      'Priority AI processing',
      'Email support',
      'Daytona backtesting'
    ],
    cta: 'Start Pro Trial',
    highlight: true,
    requiresCode: false
  },
  {
    name: 'Elite',
    price: '$99',
    period: '/month',
    description: 'For serious bettors',
    features: [
      'Everything in Pro',
      'Advanced analytics',
      'Custom strategies',
      'API access',
      'Dedicated support',
      'Early feature access',
      'White-label options'
    ],
    cta: 'Contact Sales',
    highlight: false,
    requiresCode: false
  }
];

export default function SubscribePage() {
  const handleTierClick = (tierName: string) => {
    if (tierName === 'Free') {
      // Redirect to forge for free users
      window.location.href = '/forge';
    } else {
      // Pro/Elite coming soon
      alert('Pro and Elite tiers coming soon! For now, enjoy unlimited free access.');
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Free NFL Betting Strategies</h1>
        <p className="text-neutral-400 text-lg">
          Full access to all features - No credit card required
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {tiers.map((tier, idx) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`card p-6 ${
              tier.highlight ? 'ring-2 ring-[var(--accent)] relative' : ''
            }`}
          >
            {tier.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--accent)] px-4 py-1 rounded-full text-sm font-bold">
                MOST POPULAR
              </div>
            )}

            <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold">{tier.price}</span>
              <span className="text-neutral-400">{tier.period}</span>
            </div>
            <p className="text-neutral-400 text-sm mb-6">{tier.description}</p>

            <ul className="space-y-3 mb-6">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <span className="text-green-400 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleTierClick(tier.name)}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                tier.highlight
                  ? 'bg-[var(--accent)] hover:opacity-90'
                  : 'bg-neutral-800 hover:bg-neutral-700'
              }`}
            >
              {tier.cta}
            </button>
          </motion.div>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="card p-4">
            <h4 className="font-semibold mb-2">Is it really free?</h4>
            <p className="text-sm text-neutral-400">
              Yes! Full access to all features with no credit card required. Pro tiers coming soon with additional features.
            </p>
          </div>
          <div className="card p-4">
            <h4 className="font-semibold mb-2">Do I need to download anything?</h4>
            <p className="text-sm text-neutral-400">
              Nope! StakeSmith runs entirely in your browser. Just sign in with Google and start generating strategies.
            </p>
          </div>
          <div className="card p-4">
            <h4 className="font-semibold mb-2">How accurate are the predictions?</h4>
            <p className="text-sm text-neutral-400">
              AI provides analysis based on odds and data, but nothing is guaranteed. Always bet responsibly.
            </p>
          </div>
          <div className="card p-4">
            <h4 className="font-semibold mb-2">Can I track my bets?</h4>
            <p className="text-sm text-neutral-400">
              Yes! Place bets directly in the app and track your performance over time with our analytics dashboard.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
