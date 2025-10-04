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
        <div className="mb-4 p-3 bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded text-xs">
          <p className="text-[var(--warning)] font-bold">💰 Financial Tracking Only - No Wagering</p>
          <p className="text-[var(--text-secondary)] mt-1">
            This dashboard tracks your betting activity for record-keeping purposes only. StakeSmith does not process or facilitate wagers. All liability is yours.
          </p>
        </div>
        <DashboardContent />
      </main>
      <LegalFooter />
    </>
  );
}
