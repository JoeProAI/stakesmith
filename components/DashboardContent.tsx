'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';
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
  const [blueprints, setBlueprints] = useState<SavedBlueprint[]>([]);
  const [bankroll, setBankroll] = useState(0);
  const [profit, setProfit] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFundsModal, setShowFundsModal] = useState<'add' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        try {
          await loadUserData(user.uid);
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      }
      setLoading(false);
    });

    // Failsafe: Stop loading after 5 seconds
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const loadUserData = async (userId: string) => {
    try {
      // Fetch user blueprints from Firestore
      const blueprintsRef = collection(db, 'blueprints');
      const q = query(
        blueprintsRef,
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const userBlueprints = (snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as SavedBlueprint[])
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setBlueprints(userBlueprints);

      // Fetch user profile for bankroll using doc id = uid
      const userRef = doc(db, 'users', userId);
      const profileSnap = await getDoc(userRef);
      if (profileSnap.exists()) {
        const userData = profileSnap.data() as any;
        setBankroll(userData.bankroll ?? 1000);
        setProfit(userData.totalProfit ?? 0);
      } else {
        // Initialize defaults
        setBankroll(1000);
        setProfit(0);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // Set default values if error
      setBankroll(1000);
      setProfit(0);
    }
  };

  const handleFundsTransaction = async () => {
    if (!user || !amount || isNaN(Number(amount))) {
      alert('Please enter a valid amount');
      return;
    }

    const transactionAmount = Number(amount);
    if (transactionAmount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    if (showFundsModal === 'withdraw' && transactionAmount > bankroll) {
      alert('Insufficient funds');
      return;
    }

    try {
      const newBankroll = showFundsModal === 'add' 
        ? bankroll + transactionAmount 
        : bankroll - transactionAmount;

      // Save transaction to Firestore
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: showFundsModal,
        amount: transactionAmount,
        previousBankroll: bankroll,
        newBankroll: newBankroll,
        timestamp: new Date(),
        date: new Date().toISOString()
      });

      // Upsert user bankroll profile
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          bankroll: newBankroll,
          totalProfit: profit || 0,
          updatedAt: new Date()
        },
        { merge: true }
      );

      // Update local state
      setBankroll(newBankroll);
      setAmount('');
      setShowFundsModal(null);
      
      alert(`Successfully ${showFundsModal === 'add' ? 'added' : 'withdrew'} $${transactionAmount}`);
    } catch (error) {
      console.error('Transaction error:', error);
      alert('Failed to process transaction');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full mx-auto"></div>
        <p className="text-neutral-400 mt-4">Loading your data...</p>
      </div>
    );
  }

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

        {blueprints.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-[var(--accent)]/10 border border-[var(--accent)]/30 flex items-center justify-center">
              <span className="text-2xl text-[var(--accent)] font-mono">[ ]</span>
            </div>
            <h4 className="text-lg font-semibold mb-2 text-[var(--text-primary)]">No Saved Strategies</h4>
            <p className="text-[var(--text-secondary)] text-sm mb-4">
              Generate your first strategy in the Factory
            </p>
            <a
              href="/forge"
              className="inline-block bg-[var(--accent)] text-white px-6 py-2 hover:bg-[var(--accent)]/90 transition-all"
            >
              Go to Factory
            </a>
          </div>
        ) : (
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
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h4 className="font-semibold mb-3 text-[var(--text-primary)] text-sm uppercase tracking-wide">Bankroll Manager</h4>
          <div className="space-y-2">
            <button
              onClick={() => setShowFundsModal('add')}
              className="w-full text-left p-3 bg-[var(--success)]/10 hover:bg-[var(--success)]/20 transition-colors border border-[var(--success)] text-[var(--success)] text-sm font-medium"
            >
              Add Funds
            </button>
            <button
              onClick={() => setShowFundsModal('withdraw')}
              className="w-full text-left p-3 bg-[var(--danger)]/10 hover:bg-[var(--danger)]/20 transition-colors border border-[var(--danger)] text-[var(--danger)] text-sm font-medium"
            >
              Withdraw
            </button>
            <a
              href="/history"
              className="block w-full text-left p-3 bg-[var(--card)] hover:bg-[var(--card)]/60 transition-colors border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium"
            >
              Transaction History
            </a>
          </div>
        </div>

        <div className="card p-6">
          <h4 className="font-semibold mb-3 text-[var(--text-primary)] text-sm uppercase tracking-wide">Quick Stats</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Win Rate:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {blueprints.length > 0
                  ? `${((blueprints.filter(b => b.status === 'won').length / blueprints.filter(b => b.status !== 'pending').length) * 100 || 0).toFixed(1)}%`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Avg. Payout:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {blueprints.length > 0
                  ? `${(blueprints.reduce((sum, b) => sum + b.payout, 0) / blueprints.length).toFixed(1)}x`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Active Bets:</span>
              <span className="font-semibold text-[var(--text-primary)]">{blueprints.filter(b => b.status === 'pending').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Total Bets:</span>
              <span className="font-semibold text-[var(--text-primary)]">{blueprints.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Funds Transaction Modal */}
      {showFundsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4" onClick={() => setShowFundsModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {showFundsModal === 'add' ? 'Add Funds' : 'Withdraw Funds'}
              </h3>
              <button onClick={() => setShowFundsModal(null)} className="text-2xl hover:text-red-400">×</button>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-neutral-400 mb-2">Amount ($)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-black/40 border border-neutral-700 rounded-lg px-4 py-3 text-white focus:border-[var(--accent)] focus:outline-none"
                min="0"
                step="0.01"
              />
            </div>

            <div className="mb-4 p-3 bg-black/40 rounded-lg">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-400">Current Bankroll:</span>
                <span className="font-semibold">${bankroll.toLocaleString()}</span>
              </div>
              {amount && !isNaN(Number(amount)) && Number(amount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-400">New Bankroll:</span>
                  <span className={`font-semibold ${showFundsModal === 'add' ? 'text-green-400' : 'text-red-400'}`}>
                    ${(showFundsModal === 'add' ? bankroll + Number(amount) : bankroll - Number(amount)).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFundsModal(null)}
                className="flex-1 bg-neutral-700 py-3 rounded-lg hover:bg-neutral-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFundsTransaction}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  showFundsModal === 'add' 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {showFundsModal === 'add' ? 'Add' : 'Withdraw'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
