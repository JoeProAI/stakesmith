import BlueprintFactory from '@/components/BlueprintFactory';
import LegalFooter from '@/components/LegalFooter';

export default function Forge() {
  return (
    <>
      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-4 p-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 rounded text-xs">
          <p className="text-[var(--danger)] font-bold">⚠️ Entertainment Only - No Guarantees</p>
          <p className="text-[var(--text-secondary)] mt-1">
            AI-generated strategies are NOT guarantees. All betting is at YOUR OWN RISK. You may lose money.
          </p>
        </div>
        <BlueprintFactory />
      </main>
      <LegalFooter />
    </>
  );
}
