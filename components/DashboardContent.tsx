'use client';
import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, doc, setDoc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
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
  const [editingStake, setEditingStake] = useState<string | null>(null);
  const [newStake, setNewStake] = useState<string>('');

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
    console.log('=== FUNDS TRANSACTION STARTED ===');
    console.log('User:', user?.uid);
    console.log('Amount input:', amount);
    console.log('Current bankroll:', bankroll);
    console.log('Modal type:', showFundsModal);

    if (!user) {
      alert('❌ Error: You must be signed in to manage funds');
      return;
    }

    if (!amount || isNaN(Number(amount))) {
      alert('❌ Error: Please enter a valid amount');
      return;
    }

    const transactionAmount = Number(amount);
    if (transactionAmount <= 0) {
      alert('❌ Error: Amount must be greater than 0');
      return;
    }

    if (showFundsModal === 'withdraw' && transactionAmount > bankroll) {
      alert('❌ Error: Insufficient funds');
      return;
    }

    const transactionType = showFundsModal;

    try {
      console.log('✓ Validation passed');
      console.log('Transaction details:', { 
        type: transactionType, 
        amount: transactionAmount, 
        currentBankroll: bankroll 
      });

      const newBankroll = transactionType === 'add' 
        ? bankroll + transactionAmount 
        : bankroll - transactionAmount;

      console.log('Calculated new bankroll:', newBankroll);

      // Save transaction to Firestore
      console.log('Saving transaction to Firestore...');
      const transactionRef = await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        type: transactionType,
        amount: transactionAmount,
        previousBankroll: bankroll,
        newBankroll: newBankroll,
        timestamp: new Date(),
        date: new Date().toISOString()
      });
      console.log('✓ Transaction saved with ID:', transactionRef.id);

      // Upsert user bankroll profile
      console.log('Updating user profile...');
      const userRef = doc(db, 'users', user.uid);
      await setDoc(
        userRef,
        {
          uid: user.uid,
          bankroll: newBankroll,
          totalProfit: profit || 0,
          updatedAt: new Date()
        },
        { merge: true }
      );
      console.log('✓ User profile updated');

      // Update local state immediately
      console.log('Updating local state...');
      setBankroll(newBankroll);
      setAmount('');
      setShowFundsModal(null);
      
      console.log('=== TRANSACTION COMPLETE ===');
      alert(`✓ Success!\n\n${transactionType === 'add' ? 'Added' : 'Withdrew'} $${transactionAmount}\n\nNew Bankroll: $${newBankroll.toLocaleString()}`);
    } catch (error: any) {
      console.error('❌ TRANSACTION ERROR:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      let errorMessage = 'Unknown error occurred';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Check Firestore security rules.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`❌ Transaction Failed\n\n${errorMessage}\n\nCheck the browser console for details.`);
    }
  };

  const deleteBlueprint = async (blueprintId: string, blueprintName: string) => {
    if (!confirm(`Delete "${blueprintName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      console.log('Deleting blueprint:', blueprintId);
      await deleteDoc(doc(db, 'blueprints', blueprintId));
      
      // Update local state
      setBlueprints(prev => prev.filter(bp => bp.id !== blueprintId));
      console.log('✓ Blueprint deleted');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete blueprint');
    }
  };

  const updateBlueprintStake = async (blueprintId: string, stake: number, payout: number) => {
    try {
      console.log('Updating stake for:', blueprintId, 'to', stake);
      
      const potentialWin = stake * payout;
      
      await updateDoc(doc(db, 'blueprints', blueprintId), {
        stake: stake,
        bankroll: stake,
        potentialWin: potentialWin
      });
      
      // Update local state
      setBlueprints(prev => prev.map(bp => 
        bp.id === blueprintId ? { ...bp, bankroll: stake } : bp
      ));
      
      setEditingStake(null);
      setNewStake('');
      console.log('✓ Stake updated');
    } catch (error) {
      console.error('Update stake error:', error);
      alert('Failed to update stake');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="relative w-20 h-20 mx-auto mb-4">
          {/* Chip stacking animation */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-[var(--accent)] chip-stack-anim" style={{ animationDelay: '0s' }}></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-[var(--accent)]/80 chip-stack-anim" style={{ animationDelay: '0.3s' }}></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-[var(--accent)]/60 chip-stack-anim" style={{ animationDelay: '0.6s' }}></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-[var(--accent)]/40 chip-stack-anim" style={{ animationDelay: '0.9s' }}></div>
        </div>
        <p className="text-[var(--text-secondary)] mt-4">Loading your data...</p>
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
          className="card p-6 border-[var(--accent)]/30 hover:border-[var(--accent)] transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent)]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Current Bankroll</div>
            <div className="text-3xl font-bold text-[var(--accent)] mt-2 group-hover:text-[var(--accent-glow)] transition-colors">
              ${bankroll.toLocaleString()}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`card p-6 transition-all relative overflow-hidden group ${profit >= 0 ? 'border-[var(--success)]/30 hover:border-[var(--success)]' : 'border-[var(--danger)]/30 hover:border-[var(--danger)]'}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity ${profit >= 0 ? 'from-[var(--success)]/10' : 'from-[var(--danger)]/10'} to-transparent`}></div>
          <div className="relative z-10">
            <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Total Profit/Loss</div>
            <div className={`text-3xl font-bold mt-2 ${profit >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {profit >= 0 ? '+' : ''}${profit.toLocaleString()}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6 border-purple-500/30 hover:border-purple-500 transition-all relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="relative z-10">
            <div className="text-sm text-[var(--text-secondary)] uppercase tracking-wide">Active Strategies</div>
            <div className="text-3xl font-bold mt-2 text-purple-400 group-hover:text-purple-300 transition-colors">
              {blueprints.filter(b => b.status === 'pending').length}
            </div>
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
              <div className="flex items-center gap-4 flex-1">
                <div
                  className={`w-3 h-3 ${
                    bp.status === 'pending'
                      ? 'bg-[var(--warning)]'
                      : bp.status === 'won'
                      ? 'bg-[var(--success)]'
                      : 'bg-[var(--danger)]'
                  }`}
                />
                <div className="flex-1">
                  <div className="font-semibold text-[var(--text-primary)]">{bp.name}</div>
                  <div className="text-xs text-[var(--text-secondary)] flex items-center gap-2">
                    {bp.legs} legs • 
                    {editingStake === bp.id ? (
                      <div className="flex items-center gap-1">
                        $<input 
                          type="number" 
                          value={newStake}
                          onChange={(e) => setNewStake(e.target.value)}
                          className="w-20 px-1 py-0.5 bg-[var(--card)] border border-[var(--accent)] text-xs"
                          autoFocus
                        />
                        <button 
                          onClick={() => updateBlueprintStake(bp.id, Number(newStake), bp.payout)}
                          className="text-[var(--success)] hover:text-[var(--success)]/80 text-xs px-1"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={() => { setEditingStake(null); setNewStake(''); }}
                          className="text-[var(--danger)] hover:text-[var(--danger)]/80 text-xs px-1"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => { setEditingStake(bp.id); setNewStake(bp.bankroll.toString()); }}
                        className="hover:text-[var(--accent)] cursor-pointer"
                      >
                        ${bp.bankroll} stake
                      </button>
                    )}
                    • {new Date(bp.date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-bold text-[var(--accent)]">{bp.payout}x</div>
                  <div className="text-xs text-[var(--text-secondary)]">${(bp.bankroll * bp.payout).toFixed(0)} to win</div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteBlueprint(bp.id, bp.name); }}
                  className="px-3 py-1 text-sm border border-[var(--danger)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-all"
                >
                  Delete
                </button>
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
