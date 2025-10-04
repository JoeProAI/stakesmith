'use client';
import DashboardContent from '@/components/DashboardContent';
import LegalFooter from '@/components/LegalFooter';

export default function Dashboard() {
  return (
    <>
      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">📊 Dashboard</h1>
          <p className="text-neutral-400 mt-2">
            Track your bankroll, saved blueprints, and betting performance
          </p>
        </div>
        <div className="mb-4 px-3 py-2 bg-blue-500/5 border-l-2 border-blue-500 rounded text-xs flex items-center gap-2">
          <span className="text-lg">💰</span>
          <p className="text-neutral-400">
            <span className="text-blue-400 font-semibold">Tracking only:</span> StakeSmith doesn&apos;t process wagers. All liability is yours.
          </p>
        </div>
        <DashboardContent />
      </main>
      <LegalFooter />
    </>
  );
}
