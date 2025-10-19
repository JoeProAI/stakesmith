import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

export type BetStatus = 'pending' | 'won' | 'lost' | 'pushed';

export type BetLeg = {
  type: 'game' | 'player_prop';
  description: string;
  odds: number;
  line?: number;
  player?: string;
  reasoning: string;
  confidence: number;
  ev: number;
  result?: 'hit' | 'miss' | 'pending';
};

export type ParlayBet = {
  id?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  strategy: string;
  legs: BetLeg[];
  stake: number;
  potentialPayout: number;
  totalOdds: number;
  status: BetStatus;
  placedAt: Timestamp | any;
  settledAt?: Timestamp | any;
  actualPayout?: number;
  profit?: number;
  notes?: string;
  blueprintId?: string;
};

/**
 * Place a new parlay bet and save to Firestore
 */
export async function placeParlayBet(bet: Omit<ParlayBet, 'id' | 'placedAt' | 'status'>): Promise<string> {
  try {
    const betData: Omit<ParlayBet, 'id'> = {
      ...bet,
      status: 'pending',
      placedAt: serverTimestamp(),
      legs: bet.legs.map(leg => ({
        ...leg,
        result: 'pending' as const
      }))
    };

    const docRef = await addDoc(collection(db, 'bets'), betData);
    console.log('✅ Bet placed:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Error placing bet:', error);
    throw error;
  }
}

/**
 * Update individual leg results
 */
export async function updateLegResult(
  betId: string, 
  legIndex: number, 
  result: 'hit' | 'miss'
): Promise<void> {
  try {
    const betRef = doc(db, 'bets', betId);
    
    // Get current bet to update the specific leg
    const betSnap = await getDocs(query(collection(db, 'bets'), where('__name__', '==', betId)));
    if (betSnap.empty) {
      throw new Error('Bet not found');
    }
    
    const betData = betSnap.docs[0].data() as ParlayBet;
    const updatedLegs = [...betData.legs];
    updatedLegs[legIndex] = { ...updatedLegs[legIndex], result };
    
    await updateDoc(betRef, {
      legs: updatedLegs
    });
    
    console.log(`✅ Updated leg ${legIndex} to ${result}`);
  } catch (error) {
    console.error('❌ Error updating leg result:', error);
    throw error;
  }
}

/**
 * Settle a parlay bet (mark as won/lost)
 */
export async function settleParlayBet(
  betId: string,
  status: 'won' | 'lost' | 'pushed',
  actualPayout: number = 0
): Promise<void> {
  try {
    const betRef = doc(db, 'bets', betId);
    
    // Get current bet to calculate profit
    const betSnap = await getDocs(query(collection(db, 'bets'), where('__name__', '==', betId)));
    if (betSnap.empty) {
      throw new Error('Bet not found');
    }
    
    const betData = betSnap.docs[0].data() as ParlayBet;
    const profit = actualPayout - betData.stake;
    
    await updateDoc(betRef, {
      status,
      settledAt: serverTimestamp(),
      actualPayout,
      profit
    });
    
    console.log(`✅ Bet ${betId} settled as ${status}. Profit: $${profit}`);
  } catch (error) {
    console.error('❌ Error settling bet:', error);
    throw error;
  }
}

/**
 * Get all bets for a user
 */
export async function getUserBets(userId: string, limit: number = 50): Promise<ParlayBet[]> {
  try {
    const q = query(
      collection(db, 'bets'),
      where('userId', '==', userId),
      orderBy('placedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const bets: ParlayBet[] = [];
    
    querySnapshot.forEach((doc) => {
      bets.push({ id: doc.id, ...doc.data() } as ParlayBet);
    });
    
    return bets.slice(0, limit);
  } catch (error) {
    console.error('❌ Error fetching user bets:', error);
    throw error;
  }
}

/**
 * Get pending (active) bets for a user
 */
export async function getPendingBets(userId: string): Promise<ParlayBet[]> {
  try {
    const q = query(
      collection(db, 'bets'),
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('placedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const bets: ParlayBet[] = [];
    
    querySnapshot.forEach((doc) => {
      bets.push({ id: doc.id, ...doc.data() } as ParlayBet);
    });
    
    return bets;
  } catch (error) {
    console.error('❌ Error fetching pending bets:', error);
    throw error;
  }
}

/**
 * Get user betting statistics
 */
export async function getUserBetStats(userId: string): Promise<{
  totalBets: number;
  totalWagered: number;
  totalWon: number;
  totalLost: number;
  netProfit: number;
  winRate: number;
  pendingBets: number;
  avgOdds: number;
}> {
  try {
    const bets = await getUserBets(userId, 1000);
    
    const totalBets = bets.length;
    const pendingBets = bets.filter(b => b.status === 'pending').length;
    const wonBets = bets.filter(b => b.status === 'won');
    const lostBets = bets.filter(b => b.status === 'lost');
    
    const totalWagered = bets.reduce((sum, bet) => sum + bet.stake, 0);
    const totalWon = wonBets.reduce((sum, bet) => sum + (bet.actualPayout || 0), 0);
    const totalLost = lostBets.reduce((sum, bet) => sum + bet.stake, 0);
    const netProfit = totalWon - totalWagered;
    
    const settledBets = wonBets.length + lostBets.length;
    const winRate = settledBets > 0 ? (wonBets.length / settledBets) * 100 : 0;
    
    const avgOdds = bets.length > 0 
      ? bets.reduce((sum, bet) => sum + bet.totalOdds, 0) / bets.length 
      : 0;
    
    return {
      totalBets,
      totalWagered,
      totalWon,
      totalLost,
      netProfit,
      winRate,
      pendingBets,
      avgOdds
    };
  } catch (error) {
    console.error('❌ Error calculating bet stats:', error);
    throw error;
  }
}

/**
 * Add notes to a bet
 */
export async function addBetNotes(betId: string, notes: string): Promise<void> {
  try {
    const betRef = doc(db, 'bets', betId);
    await updateDoc(betRef, { notes });
    console.log('✅ Notes added to bet');
  } catch (error) {
    console.error('❌ Error adding notes:', error);
    throw error;
  }
}
