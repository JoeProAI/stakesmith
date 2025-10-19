import { db } from './firebase';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { SUBSCRIPTION_TIERS } from './stripe';

export type SubscriptionTier = 'free' | 'pro' | 'vip';

export interface UserSubscription {
  userId: string;
  tier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  currentPeriodStart?: Timestamp;
  currentPeriodEnd?: Timestamp;
  canceledAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Get user's subscription
 */
export async function getUserSubscription(userId: string): Promise<UserSubscription | null> {
  try {
    const docRef = doc(db, 'subscriptions', userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return docSnap.data() as UserSubscription;
  } catch (error) {
    console.error('Error getting subscription:', error);
    return null;
  }
}

/**
 * Create or update subscription
 */
export async function updateUserSubscription(
  userId: string,
  data: Partial<UserSubscription>
): Promise<void> {
  try {
    const docRef = doc(db, 'subscriptions', userId);
    await setDoc(
      docRef,
      {
        userId,
        ...data,
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
    console.log(`✅ Subscription updated for ${userId}`);
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}

/**
 * Get user's tier
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const subscription = await getUserSubscription(userId);
  return subscription?.tier || 'free';
}

/**
 * Check if user has feature access
 */
export async function hasFeatureAccess(userId: string, feature: 'advanced_simulations' | 'unlimited_strategies' | 'discord_access'): Promise<boolean> {
  const tier = await getUserTier(userId);

  const featureAccess = {
    free: [],
    pro: ['advanced_simulations'],
    vip: ['advanced_simulations', 'unlimited_strategies', 'discord_access']
  };

  return featureAccess[tier].includes(feature);
}

/**
 * Get simulation limit for tier
 */
export function getSimulationLimit(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier.toUpperCase() as keyof typeof SUBSCRIPTION_TIERS]?.simulationLimit || 1000;
}

/**
 * Get strategies per day limit
 */
export function getStrategiesPerDayLimit(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier.toUpperCase() as keyof typeof SUBSCRIPTION_TIERS]?.strategiesPerDay || 5;
}

/**
 * Check if user can generate strategies today
 */
export async function canGenerateStrategies(userId: string): Promise<boolean> {
  try {
    const tier = await getUserTier(userId);
    const limit = getStrategiesPerDayLimit(tier);

    if (limit === 999) return true; // Unlimited

    // Check how many strategies generated today
    const today = new Date().toDateString();
    const docRef = doc(db, 'usage', `${userId}-${today}`);
    const docSnap = await getDoc(docRef);

    const count = docSnap.data()?.count || 0;
    return count < limit;
  } catch (error) {
    console.error('Error checking strategy limit:', error);
    return true; // Allow on error
  }
}

/**
 * Increment strategy generation count
 */
export async function incrementStrategyCount(userId: string): Promise<void> {
  try {
    const today = new Date().toDateString();
    const docRef = doc(db, 'usage', `${userId}-${today}`);

    await updateDoc(docRef, {
      count: (await getDoc(docRef)).data()?.count || 0 + 1,
      updatedAt: serverTimestamp()
    }).catch(() => {
      // Document doesn't exist, create it
      return setDoc(docRef, {
        userId,
        date: today,
        count: 1,
        createdAt: serverTimestamp()
      });
    });
  } catch (error) {
    console.error('Error incrementing strategy count:', error);
  }
}

/**
 * Get tier features
 */
export function getTierFeatures(tier: SubscriptionTier): string[] {
  return SUBSCRIPTION_TIERS[tier.toUpperCase() as keyof typeof SUBSCRIPTION_TIERS]?.features || [];
}

/**
 * Format tier name
 */
export function formatTierName(tier: SubscriptionTier): string {
  return SUBSCRIPTION_TIERS[tier.toUpperCase() as keyof typeof SUBSCRIPTION_TIERS]?.name || 'Free';
}

/**
 * Get tier price (in cents)
 */
export function getTierPrice(tier: SubscriptionTier): number {
  return SUBSCRIPTION_TIERS[tier.toUpperCase() as keyof typeof SUBSCRIPTION_TIERS]?.price || 0;
}
