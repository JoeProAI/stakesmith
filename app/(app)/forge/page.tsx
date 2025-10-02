import ProductionForge from '@/components/ProductionForge';

export default function Forge() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">⚒️ Forge Workshop</h1>
        <p className="text-neutral-400 mt-2">
          Generate AI-powered NFL parlay blueprints with live odds and detailed reasoning
        </p>
      </div>
      <ProductionForge />
    </main>
  );
}
