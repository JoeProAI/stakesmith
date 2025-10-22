'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, setDoc, getDoc, deleteDoc, updateDoc, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

type BetStatus = 'pending' | 'won' | 'lost' | 'pushed';

type SavedBet = {
  id: string;
  strategyName: string;
  date: string;
  legs: number;
  odds: number; // Total parlay odds
  stakeAmount: number; // Actual amount wagered
  potentialWin: number;
  status: BetStatus;
  settledDate?: string;
  actualReturn?: number; // Actual profit/loss when settled
  bets: Array<{
    description: string;
    odds: number;
    pick?: string;
    result?: 'won' | 'lost' | 'pushed'; // Individual leg results
  }>;
  aiReasoning?: string;
};

type PerformanceMetrics = {
  totalBets: number;
  activeBets: number;
  settledBets: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  totalWagered: number;
  totalReturns: number;
  netProfit: number;
  roi: number;
  avgOdds: number;
  biggestWin: number;
  biggestLoss: number;
  currentStreak: { type: 'win' | 'loss' | 'none'; count: number };
};

export default function DashboardV2() {
  const [user, setUser] = useState(auth.currentUser);
  const [bets, setBets] = useState<SavedBet[]>([]);
  const [bankroll, setBankroll] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [settlingBet, setSettlingBet] = useState<string | null>(null);
  const [settlementAmount, setSettlementAmount] = useState('');
  const [expandedBet, setExpandedBet] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [insights, setInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        await loadUserData(user.uid);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Load bets
      const betsRef = collection(db, 'blueprints');
      const q = query(
        betsRef,
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );
      const snapshot = await getDocs(q);
      const userBets = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedBet[];

      setBets(userBets);

      // Load bankroll
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setBankroll(userSnap.data().bankroll || 1000);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const calculateMetrics = (): PerformanceMetrics => {
    const settled = bets.filter(b => b.status !== 'pending');
    const wins = bets.filter(b => b.status === 'won');
    const losses = bets.filter(b => b.status === 'lost');
    const pushes = bets.filter(b => b.status === 'pushed');

    const totalWagered = settled.reduce((sum, b) => sum + b.stakeAmount, 0);
    const totalReturns = settled.reduce((sum, b) => sum + (b.actualReturn || 0), 0);
    const netProfit = totalReturns - totalWagered;

    // Calculate streak
    let currentStreak = { type: 'none' as 'win' | 'loss' | 'none', count: 0 };
    const sortedSettled = [...settled].sort((a, b) => 
      new Date(b.settledDate || b.date).getTime() - new Date(a.settledDate || a.date).getTime()
    );
    
    if (sortedSettled.length > 0) {
      const lastStatus = sortedSettled[0].status;
      currentStreak.type = lastStatus === 'won' ? 'win' : lastStatus === 'lost' ? 'loss' : 'none';
      currentStreak.count = 1;
      
      for (let i = 1; i < sortedSettled.length; i++) {
        if (sortedSettled[i].status === lastStatus) {
          currentStreak.count++;
        } else {
          break;
        }
      }
    }

    return {
      totalBets: bets.length,
      activeBets: bets.filter(b => b.status === 'pending').length,
      settledBets: settled.length,
      wins: wins.length,
      losses: losses.length,
      pushes: pushes.length,
      winRate: settled.length > 0 ? (wins.length / settled.length) * 100 : 0,
      totalWagered,
      totalReturns,
      netProfit,
      roi: totalWagered > 0 ? (netProfit / totalWagered) * 100 : 0,
      avgOdds: bets.length > 0 ? bets.reduce((sum, b) => sum + b.odds, 0) / bets.length : 0,
      biggestWin: Math.max(...wins.map(b => b.actualReturn || 0), 0),
      biggestLoss: Math.min(...losses.map(b => b.actualReturn || 0), 0),
      currentStreak
    };
  };

  const settleBet = async (betId: string, result: BetStatus, actualStake?: number) => {
    if (!user) return;

    try {
      const bet = bets.find(b => b.id === betId);
      if (!bet) return;

      const stake = actualStake || bet.stakeAmount;
      let actualReturn = 0;

      if (result === 'won') {
        actualReturn = stake * bet.odds; // Total return (stake + profit)
      } else if (result === 'pushed') {
        actualReturn = stake; // Get stake back
      }
      // lost = 0

      const profit = actualReturn - stake;

      // Update bet in Firestore
      await updateDoc(doc(db, 'blueprints', betId), {
        status: result,
        settledDate: new Date().toISOString(),
        actualReturn,
        stakeAmount: stake
      });

      // Update bankroll
      const newBankroll = bankroll + profit;
      await updateDoc(doc(db, 'users', user.uid), {
        bankroll: newBankroll,
        totalProfit: (await getDoc(doc(db, 'users', user.uid))).data()?.totalProfit || 0 + profit,
        updatedAt: new Date()
      });

      // Log transaction
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: result === 'won' ? 'win' : result === 'lost' ? 'loss' : 'push',
        amount: profit,
        betId: betId,
        previousBankroll: bankroll,
        newBankroll: newBankroll,
        timestamp: new Date(),
        date: new Date().toISOString()
      });

      // Update local state
      setBankroll(newBankroll);
      setBets(prev => prev.map(b => 
        b.id === betId 
          ? { ...b, status: result, settledDate: new Date().toISOString(), actualReturn, stakeAmount: stake }
          : b
      ));

      setSettlingBet(null);
      setSettlementAmount('');

      alert(`✓ Bet Settled: ${result.toUpperCase()}\n\nProfit/Loss: ${profit >= 0 ? '+' : ''}$${profit.toFixed(2)}\nNew Bankroll: $${newBankroll.toFixed(2)}`);
    } catch (error) {
      console.error('Settlement error:', error);
      alert('Failed to settle bet. Check console.');
    }
  };

  const generateInsights = async () => {
    if (!user) return;
    
    setLoadingInsights(true);
    setShowInsights(true);

    try {
      const metrics = calculateMetrics();
      
      const res = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.uid,
          metrics,
          recentBets: bets.slice(0, 10)
        })
      });

      const data = await res.json();
      setInsights(data.insights || 'Unable to generate insights at this time.');
    } catch (error) {
      console.error('Insights error:', error);
      setInsights('Error generating insights. Try again later.');
    } finally {
      setLoadingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 heat-glow"></div>
        <p className="text-[var(--text-secondary)]">Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="card inline-block p-8">
          <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
          <p className="text-neutral-400">Sign in to track your bets and manage bankroll</p>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-[var(--text-primary)]">Betting Dashboard</h2>
        <button
          onClick={generateInsights}
          disabled={loadingInsights}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded hover:from-purple-700 hover:to-blue-700 transition-all font-semibold disabled:opacity-50"
        >
          {loadingInsights ? '🔄 Analyzing...' : '🤖 AI Insights'}
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div className="card p-6 border-[var(--accent)]/30">
          <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Bankroll</div>
          <div className="text-3xl font-bold text-[var(--accent)] mt-2">${bankroll.toFixed(2)}</div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            {metrics.activeBets} active bet{metrics.activeBets !== 1 ? 's' : ''}
          </div>
        </motion.div>

        <motion.div className={`card p-6 ${metrics.netProfit >= 0 ? 'border-[var(--success)]/30' : 'border-[var(--danger)]/30'}`}>
          <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Net Profit</div>
          <div className={`text-3xl font-bold mt-2 ${metrics.netProfit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {metrics.netProfit >= 0 ? '+' : ''}${metrics.netProfit.toFixed(2)}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            {metrics.roi.toFixed(1)}% ROI
          </div>
        </motion.div>

        <motion.div className="card p-6 border-[var(--border)]">
          <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Win Rate</div>
          <div className="text-3xl font-bold text-[var(--text-primary)] mt-2">
            {metrics.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            {metrics.wins}W - {metrics.losses}L - {metrics.pushes}P
          </div>
        </motion.div>

        <motion.div className="card p-6 border-[var(--border)]">
          <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Current Streak</div>
          <div className={`text-3xl font-bold mt-2 ${metrics.currentStreak.type === 'win' ? 'text-[var(--success)]' : metrics.currentStreak.type === 'loss' ? 'text-[var(--danger)]' : 'text-[var(--text-primary)]'}`}>
            {metrics.currentStreak.count > 0 ? `${metrics.currentStreak.count}${metrics.currentStreak.type === 'win' ? 'W' : 'L'}` : '-'}
          </div>
          <div className="text-xs text-[var(--text-secondary)] mt-1">
            {metrics.currentStreak.type === 'win' ? '🔥 Hot' : metrics.currentStreak.type === 'loss' ? '❄️ Cold' : 'Start fresh'}
          </div>
        </motion.div>
      </div>

      {/* AI Insights Modal */}
      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4"
            onClick={() => setShowInsights(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  🤖 AI Performance Insights
                </h3>
                <button onClick={() => setShowInsights(false)} className="text-2xl hover:text-red-400">×</button>
              </div>
              
              {loadingInsights ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto mb-4 heat-glow"></div>
                  <p className="text-[var(--text-secondary)]">Analyzing your betting patterns...</p>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-[var(--text-secondary)] leading-relaxed">
                    {insights}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="text-xs text-[var(--text-secondary)] uppercase mb-2">Total Wagered</div>
          <div className="text-xl font-bold text-[var(--text-primary)]">${metrics.totalWagered.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-[var(--text-secondary)] uppercase mb-2">Biggest Win</div>
          <div className="text-xl font-bold text-[var(--success)]">+${metrics.biggestWin.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-[var(--text-secondary)] uppercase mb-2">Biggest Loss</div>
          <div className="text-xl font-bold text-[var(--danger)]">${metrics.biggestLoss.toFixed(2)}</div>
        </div>
      </div>

      {/* Active Bets */}
      {bets.filter(b => b.status === 'pending').length > 0 && (
        <div className="card p-6">
          <h3 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
            Active Bets ({bets.filter(b => b.status === 'pending').length})
          </h3>
          <div className="space-y-3">
            {bets.filter(b => b.status === 'pending').map((bet, idx) => (
              <BetCard 
                key={bet.id} 
                bet={bet} 
                idx={idx}
                expanded={expandedBet === bet.id}
                onToggle={() => setExpandedBet(expandedBet === bet.id ? null : bet.id)}
                onSettle={() => setSettlingBet(bet.id)}
                isSettling={settlingBet === bet.id}
                settlementAmount={settlementAmount}
                onSettlementAmountChange={setSettlementAmount}
                onConfirmSettle={settleBet}
                onCancelSettle={() => { setSettlingBet(null); setSettlementAmount(''); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Settled Bets History */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">
          Bet History ({bets.filter(b => b.status !== 'pending').length})
        </h3>
        {bets.filter(b => b.status !== 'pending').length === 0 ? (
          <div className="text-center py-8 text-[var(--text-secondary)]">
            No settled bets yet. Place some bets and track your performance!
          </div>
        ) : (
          <div className="space-y-3">
            {bets.filter(b => b.status !== 'pending').slice(0, 10).map((bet, idx) => (
              <BetCard 
                key={bet.id} 
                bet={bet} 
                idx={idx}
                expanded={expandedBet === bet.id}
                onToggle={() => setExpandedBet(expandedBet === bet.id ? null : bet.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Separate BetCard component for cleaner code
function BetCard({ 
  bet, 
  idx, 
  expanded, 
  onToggle, 
  onSettle, 
  isSettling, 
  settlementAmount, 
  onSettlementAmountChange, 
  onConfirmSettle, 
  onCancelSettle 
}: { 
  bet: SavedBet; 
  idx: number; 
  expanded: boolean; 
  onToggle: () => void;
  onSettle?: () => void;
  isSettling?: boolean;
  settlementAmount?: string;
  onSettlementAmountChange?: (val: string) => void;
  onConfirmSettle?: (id: string, status: BetStatus, amount?: number) => void;
  onCancelSettle?: () => void;
}) {
  const statusColor = 
    bet.status === 'won' ? 'bg-[var(--success)]' :
    bet.status === 'lost' ? 'bg-[var(--danger)]' :
    bet.status === 'pushed' ? 'bg-[var(--warning)]' :
    'bg-[var(--warning)]';

  const profit = bet.actualReturn ? bet.actualReturn - bet.stakeAmount : bet.potentialWin - bet.stakeAmount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="border border-neutral-700 rounded bg-black/30 hover:border-[var(--accent)] transition-colors"
    >
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className={`w-3 h-3 ${statusColor}`} />
          <div className="flex-1">
            <div className="font-semibold text-[var(--text-primary)]">{bet.strategyName}</div>
            <div className="text-xs text-[var(--text-secondary)]">
              {bet.legs} legs • ${bet.stakeAmount.toFixed(2)} • {bet.odds.toFixed(2)}x • {new Date(bet.date).toLocaleDateString()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {bet.status !== 'pending' && (
            <div className="text-right">
              <div className={`font-bold ${bet.status === 'won' ? 'text-[var(--success)]' : bet.status === 'lost' ? 'text-[var(--danger)]' : 'text-[var(--warning)]'}`}>
                {bet.status === 'won' ? '+' : bet.status === 'lost' ? '-' : ''}${Math.abs(profit).toFixed(2)}
              </div>
              <div className="text-xs text-[var(--text-secondary)]">{bet.status.toUpperCase()}</div>
            </div>
          )}
          {bet.status === 'pending' && onSettle && (
            <button
              onClick={(e) => { e.stopPropagation(); onSettle(); }}
              className="px-3 py-1 text-sm bg-[var(--accent)] text-white rounded hover:bg-[var(--accent)]/80"
            >
              Settle
            </button>
          )}
          <div className="text-neutral-500">{expanded ? '▼' : '▶'}</div>
        </div>
      </div>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="border-t border-neutral-700 bg-black/50 p-4"
        >
          {/* Settlement Interface */}
          {isSettling && onConfirmSettle && onSettlementAmountChange && onCancelSettle && (
            <div className="mb-4 p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/30 rounded">
              <h4 className="font-semibold mb-3 text-[var(--text-primary)]">Settle Bet</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    Actual Amount Wagered
                  </label>
                  <input
                    type="number"
                    value={settlementAmount}
                    onChange={(e) => onSettlementAmountChange(e.target.value)}
                    placeholder={bet.stakeAmount.toString()}
                    className="w-full bg-black/40 border border-neutral-700 px-3 py-2 text-white rounded"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onConfirmSettle(bet.id, 'won', settlementAmount ? Number(settlementAmount) : bet.stakeAmount)}
                    className="bg-[var(--success)] text-white py-2 rounded hover:bg-[var(--success)]/80 font-semibold"
                  >
                    ✓ Won
                  </button>
                  <button
                    onClick={() => onConfirmSettle(bet.id, 'lost', settlementAmount ? Number(settlementAmount) : bet.stakeAmount)}
                    className="bg-[var(--danger)] text-white py-2 rounded hover:bg-[var(--danger)]/80 font-semibold"
                  >
                    ✗ Lost
                  </button>
                  <button
                    onClick={() => onConfirmSettle(bet.id, 'pushed', settlementAmount ? Number(settlementAmount) : bet.stakeAmount)}
                    className="bg-[var(--warning)] text-white py-2 rounded hover:bg-[var(--warning)]/80 font-semibold"
                  >
                    ⟳ Push
                  </button>
                </div>
                <button
                  onClick={onCancelSettle}
                  className="w-full bg-neutral-700 text-white py-2 rounded hover:bg-neutral-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Bet Details */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-neutral-400 uppercase">Legs ({bet.bets.length})</div>
            {bet.bets.map((leg, i) => (
              <div key={i} className="flex items-start justify-between p-2 bg-neutral-800/50 rounded text-sm">
                <div className="flex-1 text-neutral-300">{leg.description || leg.pick}</div>
                <div className="text-right ml-3">
                  <div className="font-semibold text-[var(--accent)]">
                    {leg.odds > 0 ? '+' : ''}{leg.odds}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {bet.aiReasoning && (
            <div className="mt-4 p-3 bg-neutral-800/50 rounded">
              <div className="text-xs font-semibold text-neutral-400 uppercase mb-1">AI Strategy</div>
              <div className="text-sm text-neutral-300">{bet.aiReasoning}</div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
