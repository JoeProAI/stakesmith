'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

const tiers = [
  {
    name: 'Free Beta',
    price: '$0',
    period: '/month',
    description: 'Limited access during beta',
    features: [
      '3 blueprint generations per day',
      'Basic strategies only',
      'Community support',
      'Access to dashboard',
      'No credit card required'
    ],
    cta: 'Get Beta Code',
    highlight: false,
    requiresCode: true
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
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [betaCode, setBetaCode] = useState('');

  const handleBetaCode = async () => {
    // Validate beta code
    const validCodes = ['BETA2025', 'STAKESMITH', 'EARLYACCESS'];
    
    if (validCodes.includes(betaCode.toUpperCase())) {
      alert('Beta code activated! You now have free access.');
      setShowBetaModal(false);
    } else {
      alert('Invalid beta code. Please try again or contact support.');
    }
  };

  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-neutral-400 text-lg">
          Start with free beta access or unlock unlimited potential
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
              onClick={() => tier.requiresCode ? setShowBetaModal(true) : alert('Coming soon!')}
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

      {/* Beta Code Modal */}
      {showBetaModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4" onClick={() => setShowBetaModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Enter Beta Code</h3>
              <button onClick={() => setShowBetaModal(false)} className="text-2xl hover:text-red-400">×</button>
            </div>

            <p className="text-neutral-400 text-sm mb-4">
              Enter your beta access code to unlock free access during our beta period.
            </p>

            <input
              type="text"
              value={betaCode}
              onChange={(e) => setBetaCode(e.target.value)}
              placeholder="BETA2025"
              className="w-full bg-black/40 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-[var(--accent)] focus:outline-none mb-4 uppercase"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowBetaModal(false)}
                className="flex-1 bg-neutral-700 py-3 rounded-lg hover:bg-neutral-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBetaCode}
                className="flex-1 bg-[var(--accent)] py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Activate
              </button>
            </div>

            <div className="mt-4 p-3 bg-blue-600/20 border border-blue-600/50 rounded-lg">
              <p className="text-xs text-blue-400">
                <strong>Need a code?</strong> Contact us on Twitter @StakeSmith or email beta@stakesmith.ai
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="card p-4">
            <h4 className="font-semibold mb-2">How do I get a beta code?</h4>
            <p className="text-sm text-neutral-400">
              Beta codes are available to early supporters. Follow us on Twitter or join our Discord for codes.
            </p>
          </div>
          <div className="card p-4">
            <h4 className="font-semibold mb-2">Can I upgrade later?</h4>
            <p className="text-sm text-neutral-400">
              Yes! Upgrade anytime to unlock unlimited generations and advanced features.
            </p>
          </div>
          <div className="card p-4">
            <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
            <p className="text-sm text-neutral-400">
              We accept all major credit cards, PayPal, and cryptocurrency through Stripe.
            </p>
          </div>
          <div className="card p-4">
            <h4 className="font-semibold mb-2">Is there a free trial?</h4>
            <p className="text-sm text-neutral-400">
              Pro tier includes a 7-day free trial. No credit card required for beta access.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
