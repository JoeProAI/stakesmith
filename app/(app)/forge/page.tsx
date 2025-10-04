import BlueprintFactory from '@/components/BlueprintFactory';
import LegalFooter from '@/components/LegalFooter';

export default function Forge() {
  return (
    <>
      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-4 px-3 py-2 bg-orange-500/5 border-l-2 border-orange-500 rounded text-xs flex items-center gap-2">
          <span className="text-lg">⚠️</span>
          <p className="text-neutral-400">
            <span className="text-orange-400 font-semibold">Entertainment only:</span> AI strategies aren&apos;t guarantees. Bet at your own risk.
          </p>
        </div>
        <BlueprintFactory />
      </main>
      <LegalFooter />
    </>
  );
}
