# 💰 StakeSmith Weekly Monetization - Implementation Plan

## 🎯 Overview

Two-tier system optimized for NFL's weekly schedule:
- **Free**: 1 generation per week
- **Pro ($9.99/month)**: Unlimited everything

---

## 📋 Implementation Checklist

### **Phase 1: Core Infrastructure** (Priority: HIGH)

#### 1.1 User Subscription Schema
```typescript
// Add to Firestore user document
interface User {
  uid: string;
  email: string;
  displayName: string;
  
  // NEW: Subscription fields
  tier: 'free' | 'pro';
  subscriptionId?: string; // Stripe subscription ID
  subscriptionStatus?: 'active' | 'canceled' | 'past_due';
  
  // NEW: Usage tracking
  weeklyUsage: {
    weekStartDate: string; // ISO date of last Wednesday
    generationsUsed: number;
    lastGeneration: string; // ISO timestamp
  };
  
  createdAt: Date;
}
```

#### 1.2 Usage Tracking Functions
```typescript
// lib/usage-tracking.ts

export function getWeekStartDate(): Date {
  // Get last Wednesday 12:00 AM EST
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysToWednesday = (dayOfWeek + 4) % 7;
  const wednesday = new Date(now);
  wednesday.setDate(now.getDate() - daysToWednesday);
  wednesday.setHours(0, 0, 0, 0);
  return wednesday;
}

export async function checkGenerationLimit(userId: string): Promise<{
  allowed: boolean;
  generationsUsed: number;
  generationsLimit: number;
  resetDate: Date;
}> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  const user = userDoc.data();
  
  // Pro users: unlimited
  if (user.tier === 'pro') {
    return {
      allowed: true,
      generationsUsed: 0,
      generationsLimit: Infinity,
      resetDate: getWeekStartDate()
    };
  }
  
  // Free users: 1 per week
  const weekStart = getWeekStartDate();
  const weekStartStr = weekStart.toISOString();
  
  // Check if user's week has reset
  if (user.weeklyUsage?.weekStartDate !== weekStartStr) {
    // New week! Reset counter
    await updateDoc(doc(db, 'users', userId), {
      'weeklyUsage.weekStartDate': weekStartStr,
      'weeklyUsage.generationsUsed': 0
    });
    
    return {
      allowed: true,
      generationsUsed: 0,
      generationsLimit: 1,
      resetDate: weekStart
    };
  }
  
  // Check current usage
  const used = user.weeklyUsage?.generationsUsed || 0;
  const limit = 1;
  
  return {
    allowed: used < limit,
    generationsUsed: used,
    generationsLimit: limit,
    resetDate: weekStart
  };
}

export async function incrementGenerationCount(userId: string): Promise<void> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  const user = userDoc.data();
  
  if (user.tier === 'pro') return; // Pro users don't count
  
  await updateDoc(doc(db, 'users', userId), {
    'weeklyUsage.generationsUsed': increment(1),
    'weeklyUsage.lastGeneration': new Date().toISOString()
  });
}
```

---

### **Phase 2: UI Updates** (Priority: HIGH)

#### 2.1 Generate Button Logic
```typescript
// components/BlueprintForge.tsx

const generateBlueprints = async () => {
  if (!user) {
    alert('Please sign in to generate strategies');
    return;
  }
  
  // Check usage limit
  const usage = await checkGenerationLimit(user.uid);
  
  if (!usage.allowed) {
    // Show upgrade prompt
    setShowUpgradeModal(true);
    return;
  }
  
  setGenerating(true);
  
  try {
    // ... existing generation logic ...
    
    // Increment counter
    await incrementGenerationCount(user.uid);
    
  } catch (error) {
    // ... error handling ...
  } finally {
    setGenerating(false);
  }
};
```

#### 2.2 Usage Display Component
```tsx
// components/UsageBanner.tsx

export function UsageBanner() {
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  
  useEffect(() => {
    if (user && user.tier === 'free') {
      checkGenerationLimit(user.uid).then(setUsage);
    }
  }, [user]);
  
  if (!usage || user?.tier === 'pro') return null;
  
  return (
    <div className="card p-4 mb-4 border-orange-500/20">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-400">
            {usage.generationsUsed}/{usage.generationsLimit} generations used this week
          </p>
          <p className="text-xs text-neutral-500">
            Resets: {formatDate(usage.resetDate)}
          </p>
        </div>
        {usage.generationsUsed >= usage.generationsLimit && (
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="btn-primary text-sm"
          >
            Upgrade for Unlimited
          </button>
        )}
      </div>
    </div>
  );
}
```

#### 2.3 Upgrade Modal
```tsx
// components/UpgradeModal.tsx

export function UpgradeModal({ isOpen, onClose, reason }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">
          {reason === 'generation_limit' && '🔒 Weekly Limit Reached'}
          {reason === 'save_blueprint' && '💾 Save Blueprints'}
          {reason === 'track_bets' && '📊 Track Your Bets'}
        </h2>
        
        <div className="space-y-4 mb-6">
          <p className="text-neutral-400">
            {reason === 'generation_limit' && 
              "You've used your free generation this week. Upgrade to Pro for unlimited regenerations!"}
            {reason === 'save_blueprint' && 
              "Save blueprints to your dashboard and track performance over time."}
            {reason === 'track_bets' && 
              "Track all your bets, settle outcomes, and analyze your performance."}
          </p>
          
          <div className="card p-4 bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
            <h3 className="font-bold mb-3">StakeSmith Pro - $9.99/month</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Unlimited strategy regenerations</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Full bet tracking & settlement</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Performance analytics dashboard</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Monte Carlo simulations</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>AI insights & analysis</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Bankroll management tools</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => {/* Navigate to Stripe checkout */}}
            className="btn-primary flex-1"
          >
            Upgrade to Pro
          </button>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

---

### **Phase 3: Feature Gating** (Priority: MEDIUM)

#### 3.1 Save Blueprint
```typescript
const saveBlueprint = async (blueprint: Blueprint) => {
  if (!user) {
    alert('Please sign in');
    return;
  }
  
  if (user.tier === 'free') {
    setUpgradeReason('save_blueprint');
    setShowUpgradeModal(true);
    return;
  }
  
  // ... existing save logic ...
};
```

#### 3.2 Place Bet (Track)
```typescript
const placeBet = async (blueprint: Blueprint) => {
  if (!user) {
    alert('Please sign in');
    return;
  }
  
  if (user.tier === 'free') {
    setUpgradeReason('track_bets');
    setShowUpgradeModal(true);
    return;
  }
  
  // ... existing place bet logic ...
};
```

#### 3.3 Regenerate
```typescript
const regenerateBlueprint = async (blueprintId: string) => {
  if (!user) {
    alert('Please sign in');
    return;
  }
  
  // Free users can't regenerate at all
  if (user.tier === 'free') {
    setUpgradeReason('generation_limit');
    setShowUpgradeModal(true);
    return;
  }
  
  // ... existing regenerate logic ...
};
```

---

### **Phase 4: Stripe Integration** (Priority: HIGH)

#### 4.1 Stripe Setup
```bash
npm install @stripe/stripe-js stripe
```

#### 4.2 Checkout Endpoint
```typescript
// app/api/create-checkout/route.ts

export async function POST(req: NextRequest) {
  const { userId, userEmail } = await req.json();
  
  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID, // Pro tier price ID
        quantity: 1,
      },
    ],
    metadata: {
      userId,
    },
    success_url: `${process.env.NEXT_PUBLIC_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/forge`,
  });
  
  return NextResponse.json({ sessionId: session.id });
}
```

#### 4.3 Webhook Handler
```typescript
// app/api/stripe-webhook/route.ts

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();
  
  const event = stripe.webhooks.constructEvent(
    body,
    signature!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      const userId = session.metadata.userId;
      
      // Upgrade user to Pro
      await updateDoc(doc(db, 'users', userId), {
        tier: 'pro',
        subscriptionId: session.subscription,
        subscriptionStatus: 'active'
      });
      break;
      
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      // Downgrade user
      // ... find user by subscriptionId and set tier to 'free'
      break;
  }
  
  return NextResponse.json({ received: true });
}
```

---

### **Phase 5: Pricing Page** (Priority: MEDIUM)

#### 5.1 Create Pricing Page
```tsx
// app/(app)/pricing/page.tsx

export default function Pricing() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold text-center mb-4">
        Simple, Transparent Pricing
      </h1>
      <p className="text-center text-neutral-400 mb-12">
        Get the most out of your NFL betting with StakeSmith Pro
      </p>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Tier */}
        <div className="card p-6">
          <h3 className="text-2xl font-bold mb-2">Free</h3>
          <p className="text-3xl font-bold mb-4">
            $0<span className="text-lg text-neutral-500">/forever</span>
          </p>
          
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-sm">1 generation per week</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-sm">View all 15 strategies</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-600 mt-1">✗</span>
              <span className="text-sm text-neutral-500">No regenerations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-600 mt-1">✗</span>
              <span className="text-sm text-neutral-500">No bet tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-neutral-600 mt-1">✗</span>
              <span className="text-sm text-neutral-500">No analytics</span>
            </li>
          </ul>
          
          <button className="btn-secondary w-full" disabled>
            Current Plan
          </button>
        </div>
        
        {/* Pro Tier */}
        <div className="card p-6 border-orange-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs px-3 py-1">
            RECOMMENDED
          </div>
          
          <h3 className="text-2xl font-bold mb-2">Pro</h3>
          <p className="text-3xl font-bold mb-4">
            $9.99<span className="text-lg text-neutral-500">/month</span>
          </p>
          
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-sm font-semibold">Unlimited regenerations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-sm">Full bet tracking & settlement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-sm">Performance analytics</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-sm">Monte Carlo simulations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-sm">AI insights & analysis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-sm">Bankroll management</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-400 mt-1">✓</span>
              <span className="text-sm">Export bet history</span>
            </li>
          </ul>
          
          <button className="btn-primary w-full">
            Upgrade to Pro
          </button>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <h3 className="text-xl font-bold mb-4">Why Upgrade?</h3>
        <div className="grid md:grid-cols-3 gap-6 text-left">
          <div>
            <h4 className="font-bold mb-2">📈 Line Shopping</h4>
            <p className="text-sm text-neutral-400">
              Lines move 10+ times per week. Regenerate to capture the best value.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-2">📊 Track Performance</h4>
            <p className="text-sm text-neutral-400">
              Know which strategies actually work. Learn and improve over time.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-2">💰 Bankroll Control</h4>
            <p className="text-sm text-neutral-400">
              Automatic tracking of wins, losses, and overall profit/loss.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🎯 Rollout Plan

### **Week 1: Core Infrastructure**
- [ ] Add subscription fields to User schema
- [ ] Implement usage tracking functions
- [ ] Test week reset logic thoroughly

### **Week 2: UI & Gating**
- [ ] Add usage banner
- [ ] Gate features (save, track, regenerate)
- [ ] Build upgrade modal
- [ ] Test user flows

### **Week 3: Stripe Integration**
- [ ] Set up Stripe account
- [ ] Create Pro product/price
- [ ] Implement checkout
- [ ] Set up webhook
- [ ] Test subscription flow

### **Week 4: Polish & Launch**
- [ ] Create pricing page
- [ ] Update navigation
- [ ] Add upgrade CTAs
- [ ] Write announcement
- [ ] Soft launch to users

---

## 📊 Success Metrics

### **Track These:**
1. **Free → Pro conversion rate**
   - Target: 5-10% within 4 weeks
2. **Weekly regenerations (Pro users)**
   - Shows feature value
3. **Churn rate**
   - Target: <15% monthly
4. **Average bets tracked per Pro user**
   - Shows engagement

---

## 🚨 Edge Cases

### **Handle These:**
1. **User downgrades mid-week**
   - Let them finish week with current limits
2. **Stripe webhook fails**
   - Implement retry logic + manual check
3. **User cancels but subscription still active**
   - Keep Pro until period ends
4. **Multiple devices/browsers**
   - Track by userId, not local storage

---

## 💡 Future Enhancements

### **Post-Launch Ideas:**
1. **Annual plan** ($99/year = 2 months free)
2. **Referral program** (Give 1 month free for referrals)
3. **Group plans** (5 users for $39.99/mo)
4. **Lifetime deal** ($299 one-time - launch special)

---

**Next Step:** Implement Phase 1 (Core Infrastructure) and test thoroughly before moving to UI.
