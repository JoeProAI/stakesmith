export default function LegalFooter() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-950/50 backdrop-blur mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center space-y-3">
          <p className="text-xs text-neutral-500">
            <span className="text-orange-400 font-semibold">Entertainment & Educational Use Only</span> – AI predictions aren&apos;t guarantees. 
            Sports betting involves risk. You may lose money. All decisions at <strong>your own risk</strong>. 
            StakeSmith doesn&apos;t facilitate wagers and accepts <strong>no liability</strong> for losses.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 text-xs text-neutral-600">
            <span className="flex items-center gap-1">
              <span>🔞</span>
              <span>21+ Only</span>
            </span>
            <span className="text-neutral-800">|</span>
            <a 
              href="https://www.ncpgambling.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)] transition-colors"
            >
              Problem Gambling Help: 1-800-522-4700
            </a>
            <span className="text-neutral-800">|</span>
            <span>Gamble Responsibly</span>
          </div>
          
          <p className="text-[10px] text-neutral-700">
            © {new Date().getFullYear()} StakeSmith. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
