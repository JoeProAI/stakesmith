'use client';

import { useState, useEffect } from 'react';

export default function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasAcknowledged = localStorage.getItem('disclaimer-acknowledged');
    if (!hasAcknowledged) {
      setIsVisible(true);
    }
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem('disclaimer-acknowledged', 'true');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-neutral-900 to-black border border-neutral-800 max-w-2xl w-full rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 border-b border-orange-500/30 p-6">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚠️</div>
            <div>
              <h2 className="text-xl font-semibold text-white">Important Disclaimer</h2>
              <p className="text-sm text-neutral-400">Please read carefully before continuing</p>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-3 text-sm max-h-96 overflow-y-auto">
          <div className="flex gap-3 p-3 bg-orange-500/5 border-l-2 border-orange-500 rounded">
            <div className="text-lg">🔞</div>
            <div>
              <p className="font-semibold text-orange-400 mb-1">Age Requirement</p>
              <p className="text-neutral-400">You must be 21+ to use this service.</p>
            </div>
          </div>

          <div className="flex gap-3 p-3">
            <div className="text-lg">📊</div>
            <div>
              <p className="font-semibold text-white mb-1">No Guarantees</p>
              <p className="text-neutral-400">For entertainment & educational purposes only. AI predictions are <strong>not guarantees</strong> of future results.</p>
            </div>
          </div>

          <div className="flex gap-3 p-3">
            <div className="text-lg">💰</div>
            <div>
              <p className="font-semibold text-white mb-1">Financial Risk</p>
              <p className="text-neutral-400">Sports betting involves risk. You may lose money. Never bet more than you can afford to lose. All decisions at <strong>your own risk</strong>.</p>
            </div>
          </div>

          <div className="flex gap-3 p-3">
            <div className="text-lg">🎲</div>
            <div>
              <p className="font-semibold text-white mb-1">Problem Gambling Help</p>
              <p className="text-neutral-400">Call <strong>1-800-522-4700</strong> or visit <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">ncpgambling.org</a></p>
            </div>
          </div>

          <div className="flex gap-3 p-3">
            <div className="text-lg">⚖️</div>
            <div>
              <p className="font-semibold text-white mb-1">Your Responsibility</p>
              <p className="text-neutral-400">You&apos;re responsible for legal compliance. StakeSmith doesn&apos;t facilitate wagers. We provide analysis tools only.</p>
            </div>
          </div>

          <div className="flex gap-3 p-3">
            <div className="text-lg">📜</div>
            <div>
              <p className="font-semibold text-white mb-1">No Liability</p>
              <p className="text-neutral-400">StakeSmith accepts <strong>no liability</strong> for losses or consequences from using this app.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-900/50 border-t border-neutral-800 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="acknowledge-checkbox"
              className="mt-1"
              onChange={(e) => {
                const btn = document.getElementById('acknowledge-btn') as HTMLButtonElement;
                if (btn) btn.disabled = !e.target.checked;
              }}
            />
            <span className="text-xs text-neutral-400">
              I acknowledge I&apos;ve read the above. I&apos;m of legal gambling age. I understand all betting is at my own risk with no guarantees.
            </span>
          </label>

          <button
            id="acknowledge-btn"
            onClick={handleAcknowledge}
            disabled
            className="w-full py-3 bg-orange-600 text-white font-semibold rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-700 transition-colors"
          >
            I Understand and Accept
          </button>
        </div>
      </div>
    </div>
  );
}
