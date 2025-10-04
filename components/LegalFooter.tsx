export default function LegalFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)]/50 backdrop-blur mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-xs text-[var(--text-secondary)] space-y-2">
          <p className="font-bold text-[var(--warning)]">
            ⚠️ FOR ENTERTAINMENT & EDUCATIONAL PURPOSES ONLY - NO GUARANTEES
          </p>
          
          <p>
            StakeSmith provides AI-generated betting analysis. All predictions and strategies are <strong>NOT GUARANTEES</strong> of future results. 
            Sports betting involves financial risk. You may lose money. <strong>Never bet more than you can afford to lose</strong>.
          </p>
          
          <p>
            All betting decisions are made at <strong>YOUR OWN RISK</strong>. StakeSmith does not facilitate wagers and accepts <strong>NO LIABILITY</strong> for losses.
          </p>
          
          <div className="flex justify-center gap-6 mt-4 text-[var(--text-secondary)]">
            <span>🔞 21+ Only</span>
            <span>|</span>
            <a 
              href="https://www.ncpgambling.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-[var(--accent)] underline"
            >
              Problem Gambling Help: 1-800-522-4700
            </a>
            <span>|</span>
            <span>Gamble Responsibly</span>
          </div>
          
          <p className="mt-4 text-[10px]">
            © {new Date().getFullYear()} StakeSmith. All rights reserved. By using this service, you agree to our terms and accept all risks associated with sports betting.
          </p>
        </div>
      </div>
    </footer>
  );
}
