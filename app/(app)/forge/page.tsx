import AIChat from '@/components/AIChat';
import ForgeCanvas from '@/components/ForgeCanvas';

export default function Forge() {
  return (
    <main className="p-6 space-y-4">
      <h2 className="text-2xl font-semibold">Forge Workshop</h2>
      <ForgeCanvas />
      <AIChat />
    </main>
  );
}
