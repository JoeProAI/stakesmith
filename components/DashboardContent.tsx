'use client';
import { useState, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { motion } from 'framer-motion';

type SavedBlueprint = {
  id: string;
  name: string;
  date: string;
  bankroll: number;
  legs: number;
  payout: number;
  status: 'pending' | 'won' | 'lost';
};

export default function DashboardContent() {
  const [user, setUser] = useState(auth.currentUser);
  const [blueprints, setBlueprints] = useState<SavedBlueprint[]>([
    {
      id: '1',
      name: 'Week 15 Upset Special',
      date: '2025-02-01',
      bankroll: 1000,
      legs: 4,
      payout: 8.5,
      status: 'pending'
    },
    {
      id: '2',
      name: 'Safe Sunday Stack',
      date: '2025-01-28',
      bankroll: 500,
      legs: 3,
      payout: 3.2,
      status: 'won'
    }
  ]);
  const [bankroll, setBankroll] = useState(5000);
  const [profit, setProfit] = useState(850);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="card inline-block p-8">
          <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
          <p className="text-neutral-400 mb-4">
            Sign in with Google to save blueprints and track your bankroll
          </p>
          <div className="text-sm text-neutral-500">
            Use the &quot;Sign In with Google&quot; button in the header
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="text-sm text-neutral-400">Current Bankroll</div>
          <div className="text-3xl font-bold text-[var(--accent)] mt-2">
            ${bankroll.toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="text-sm text-neutral-400">Total Profit/Loss</div>
          <div className={`text-3xl font-bold mt-2 ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profit >= 0 ? '+' : ''}${profit.toLocaleString()}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="text-sm text-neutral-400">Active Blueprints</div>
          <div className="text-3xl font-bold mt-2">
            {blueprints.filter(b => b.status === 'pending').length}
          </div>
        </motion.div>
      </div>

      {/* Saved Blueprints */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Saved Blueprints</h3>
          <button className="text-sm bg-[var(--accent)] px-4 py-2 rounded">
            + New Blueprint
          </button>
        </div>

        <div className="space-y-3">
          {blueprints.map((bp, idx) => (
            <motion.div
              key={bp.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-center justify-between p-4 rounded border border-neutral-700 bg-black/30 hover:border-[var(--accent)] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    bp.status === 'pending'
                      ? 'bg-yellow-400'
                      : bp.status === 'won'
                      ? 'bg-green-400'
                      : 'bg-red-400'
                  }`}
                />
                <div>
                  <div className="font-semibold">{bp.name}</div>
                  <div className="text-xs text-neutral-400">
                    {bp.legs} legs • ${bp.bankroll} stake • {new Date(bp.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-[var(--accent)]">{bp.payout}x</div>
                <div className="text-xs text-neutral-400 capitalize">{bp.status}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h4 className="font-semibold mb-3">📊 Bankroll Manager</h4>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded bg-black/40 hover:bg-black/60 transition-colors">
              + Add Funds
            </button>
            <button className="w-full text-left p-3 rounded bg-black/40 hover:bg-black/60 transition-colors">
              - Withdraw
            </button>
            <button className="w-full text-left p-3 rounded bg-black/40 hover:bg-black/60 transition-colors">
              📈 View Analytics
            </button>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="font-semibold mb-3">⚡ Quick Stats</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-400">Win Rate:</span>
              <span className="font-semibold">67.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Avg. Payout:</span>
              <span className="font-semibold">4.2x</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Best Streak:</span>
              <span className="font-semibold">8 wins</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Total Bets:</span>
              <span className="font-semibold">42</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
