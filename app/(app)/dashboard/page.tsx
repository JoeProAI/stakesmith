'use client';
import DashboardContent from '@/components/DashboardContent';

export default function Dashboard() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">📊 Dashboard</h1>
        <p className="text-neutral-400 mt-2">
          Track your bankroll, saved blueprints, and betting performance
        </p>
      </div>
      <DashboardContent />
    </main>
  );
}
