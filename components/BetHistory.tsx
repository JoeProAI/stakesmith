'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth } from '@/lib/firebase';
import { getUserBets, getUserBetStats, settleParlayBet, type ParlayBet } from '@/lib/bet-tracking';
import type { User } from 'firebase/auth';

export default function BetHistory() {
  const [user, setUser] = useState<User | null>(null);
  const [bets, setBets] = useState<ParlayBet[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBet, setSelectedBet] = useState<ParlayBet | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadBets(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadBets = async (userId: string) => {
    setLoading(true);
    try {
      const [userBets, userStats] = await Promise.all([
        getUserBets(userId, 100),
        getUserBetStats(userId)
      ]);
      setBets(userBets);
      setStats(userStats);
    } catch (error) {
      console.error('Error loading bets:', error);
    }
    setLoading(false);
  };

  const handleSettleBet = async (betId: string, status: 'won' | 'lost' | 'pushed') => {
    if (!user) return;
    
    const bet = bets.find(b => b.id === betId);
    if (!bet) return;
    
    const actualPayout = status === 'won' ? bet.potentialPayout : status === 'pushed' ? bet.stake : 0;
    
    const confirmed = confirm(
      `Settle this bet as ${status.toUpperCase()}?\n\n` +
      `Strategy: ${bet.strategy}\n` +
      `Stake: $${bet.stake.toFixed(2)}\n` +
      `${status === 'won' ? `Payout: $${actualPayout.toFixed(2)}\nProfit: $${(actualPayout - bet.stake).toFixed(2)}` : status === 'pushed' ? 'Returned: $' + bet.stake.toFixed(2) : 'Loss: -$' + bet.stake.toFixed(2)}`
    );
    
    if (!confirmed) return;
    
    try {
      await settleParlayBet(betId, status, actualPayout);
      await loadBets(user.uid);
      alert(`✅ Bet settled as ${status}!`);
    } catch (error) {
      console.error('Error settling bet:', error);
      alert('Failed to settle bet. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[var(--text-secondary)]">Please sign in to view your bet history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="card p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-3 heat-glow"></div>
        <p className="text-sm text-[var(--text-secondary)]">Loading bet history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4"
          >
            <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Total Bets</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats.totalBets}</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">{stats.pendingBets} pending</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-4"
          >
            <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Win Rate</div>
            <div className="text-2xl font-bold text-[var(--accent)] mt-1">{stats.winRate.toFixed(1)}%</div>
            <div className="text-xs text-[var(--text-secondary)] mt-1">Avg odds: {stats.avgOdds.toFixed(2)}x</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-4"
          >
            <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Total Wagered</div>
            <div className="text-2xl font-bold text-[var(--warning)] mt-1">${stats.totalWagered.toFixed(0)}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`card p-4 ${stats.netProfit >= 0 ? 'border-[var(--success)]/30' : 'border-[var(--danger)]/30'}`}
          >
            <div className="text-xs text-[var(--text-secondary)] uppercase tracking-wide">Net Profit</div>
            <div className={`text-2xl font-bold mt-1 ${stats.netProfit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {stats.netProfit >= 0 ? '+' : ''}${stats.netProfit.toFixed(0)}
            </div>
          </motion.div>
        </div>
      )}

      {/* Bet List */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Bet History</h3>
        
        {bets.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-secondary)]">
            <p>No bets placed yet</p>
            <p className="text-sm mt-2">Place a bet from the Factory to start tracking</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bets.map((bet) => (
              <motion.div
                key={bet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border p-4 rounded transition-all hover:border-[var(--accent)] ${
                  bet.status === 'won' ? 'border-[var(--success)]/30 bg-[var(--success)]/5' :
                  bet.status === 'lost' ? 'border-[var(--danger)]/30 bg-[var(--danger)]/5' :
                  bet.status === 'pushed' ? 'border-[var(--warning)]/30 bg-[var(--warning)]/5' :
                  'border-[var(--border)]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-[var(--text-primary)]">{bet.strategy}</h4>
                      <span className={`text-xs px-2 py-1 rounded font-semibold uppercase ${
                        bet.status === 'won' ? 'bg-[var(--success)] text-black' :
                        bet.status === 'lost' ? 'bg-[var(--danger)] text-white' :
                        bet.status === 'pushed' ? 'bg-[var(--warning)] text-black' :
                        'bg-[var(--accent)] text-white'
                      }`}>
                        {bet.status}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {bet.legs.length} legs • {bet.totalOdds.toFixed(2)}x
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-[var(--text-secondary)]">Stake: </span>
                        <span className="font-semibold text-[var(--warning)]">${bet.stake.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[var(--text-secondary)]">To Win: </span>
                        <span className="font-semibold text-[var(--success)]">${bet.potentialPayout.toFixed(2)}</span>
                      </div>
                      {bet.status !== 'pending' && (
                        <div>
                          <span className="text-[var(--text-secondary)]">Result: </span>
                          <span className={`font-semibold ${bet.profit && bet.profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                            {bet.profit !== undefined ? (bet.profit >= 0 ? '+' : '') + '$' + bet.profit.toFixed(2) : '-'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-[var(--text-secondary)] mt-2">
                      Placed: {bet.placedAt?.toDate ? bet.placedAt.toDate().toLocaleString() : new Date(bet.placedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setSelectedBet(bet)}
                      className="text-xs bg-[var(--card)] border border-[var(--border)] px-3 py-1 hover:border-[var(--accent)] transition-colors"
                    >
                      View
                    </button>
                    {bet.status === 'pending' && (
                      <>
                        <button
                          onClick={() => bet.id && handleSettleBet(bet.id, 'won')}
                          className="text-xs bg-[var(--success)]/10 border border-[var(--success)] px-3 py-1 hover:bg-[var(--success)]/20 transition-colors text-[var(--success)]"
                        >
                          Won
                        </button>
                        <button
                          onClick={() => bet.id && handleSettleBet(bet.id, 'lost')}
                          className="text-xs bg-[var(--danger)]/10 border border-[var(--danger)] px-3 py-1 hover:bg-[var(--danger)]/20 transition-colors text-[var(--danger)]"
                        >
                          Lost
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Bet Details Modal */}
      {selectedBet && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedBet(null)}
        >
          <div
            className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-2xl font-bold mb-1">{selectedBet.strategy}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Placed: {selectedBet.placedAt?.toDate ? selectedBet.placedAt.toDate().toLocaleString() : new Date(selectedBet.placedAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBet(null)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  ✕
                </button>
              </div>

              {/* Legs */}
              <div>
                <h4 className="font-semibold mb-3">Legs ({selectedBet.legs.length})</h4>
                <div className="space-y-2">
                  {selectedBet.legs.map((leg, idx) => (
                    <div key={idx} className="bg-[var(--card)] p-3 rounded border border-[var(--border)]">
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-semibold text-sm">{leg.description}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                          leg.odds >= 0 ? 'text-[var(--success)]' : 'text-[var(--text-primary)]'
                        }`}>
                          {leg.odds > 0 ? '+' : ''}{leg.odds}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{leg.reasoning}</p>
                      {leg.result && leg.result !== 'pending' && (
                        <div className={`text-xs mt-2 font-semibold ${
                          leg.result === 'hit' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                        }`}>
                          {leg.result === 'hit' ? '✓ HIT' : '✗ MISS'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border)]">
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Stake</p>
                  <p className="text-lg font-bold text-[var(--warning)]">${selectedBet.stake.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Potential Win</p>
                  <p className="text-lg font-bold text-[var(--success)]">${selectedBet.potentialPayout.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Total Odds</p>
                  <p className="text-lg font-bold text-[var(--accent)]">{selectedBet.totalOdds.toFixed(2)}x</p>
                </div>
                {selectedBet.status !== 'pending' && (
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Result</p>
                    <p className={`text-lg font-bold ${selectedBet.profit && selectedBet.profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                      {selectedBet.profit !== undefined ? (selectedBet.profit >= 0 ? '+' : '') + '$' + selectedBet.profit.toFixed(2) : '-'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
