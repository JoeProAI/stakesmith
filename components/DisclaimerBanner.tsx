'use client';

import { useState, useEffect } from 'react';

export default function DisclaimerBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

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
      <div className="bg-neutral-900 border border-neutral-700 max-w-2xl w-full rounded shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-neutral-800 border-b border-neutral-700 p-6">
          <h2 className="text-lg font-semibold text-white">Terms of Service & Disclaimer</h2>
          <p className="text-sm text-neutral-400 mt-1">Please read and accept to continue</p>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-4 text-sm max-h-96 overflow-y-auto">
          <div>
            <p className="font-semibold text-white mb-2">Age Requirement</p>
            <p className="text-neutral-400">You must be at least 21 years of age (or the legal gambling age in your jurisdiction) to use this service.</p>
          </div>

          <div>
            <p className="font-semibold text-white mb-2">No Guarantees</p>
            <p className="text-neutral-400">StakeSmith provides statistical analysis and AI-generated betting strategies for entertainment and educational purposes only. All predictions, odds analysis, and betting recommendations are not guarantees of future results.</p>
          </div>

          <div>
            <p className="font-semibold text-white mb-2">Financial Risk</p>
            <p className="text-neutral-400">Sports betting involves substantial financial risk. You may lose money. Never bet more than you can afford to lose. Past performance does not indicate future results. All betting decisions are made at your own risk.</p>
          </div>

          <div>
            <p className="font-semibold text-white mb-2">Problem Gambling Help</p>
            <p className="text-neutral-400">Gambling can be addictive. If you or someone you know has a gambling problem, call the National Problem Gambling Helpline at 1-800-522-4700 or visit <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline hover:text-blue-300">ncpgambling.org</a></p>
          </div>

          <div>
            <p className="font-semibold text-white mb-2">Legal Compliance</p>
            <p className="text-neutral-400">You are responsible for ensuring that sports betting is legal in your jurisdiction. StakeSmith does not facilitate, process, or accept wagers. We provide analysis tools only. Compliance with all applicable laws is your responsibility.</p>
          </div>

          <div>
            <p className="font-semibold text-white mb-2">No Liability</p>
            <p className="text-neutral-400">StakeSmith and its creators accept no liability for any losses, damages, or consequences resulting from the use of this application. By using StakeSmith, you acknowledge that all betting decisions are made independently and at your sole discretion.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-neutral-900 border-t border-neutral-700 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => setIsChecked(e.target.checked)}
              className="mt-1 w-4 h-4 cursor-pointer"
            />
            <span className="text-sm text-neutral-300 select-none">
              I acknowledge that I have read and understood the above disclaimers. I am of legal gambling age in my jurisdiction. I understand that all betting is done at my own risk with no guarantees of profit.
            </span>
          </label>

          <button
            onClick={handleAcknowledge}
            disabled={!isChecked}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            Accept and Continue
          </button>
        </div>
      </div>
    </div>
  );
}
