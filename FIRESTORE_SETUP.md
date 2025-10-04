# 🔥 Firestore Database Setup Guide

## Why You Need This
Firestore is required for:
- 💰 Add/Withdraw funds (bankroll management)
- 💾 Saving betting strategies
- 📊 Transaction history
- 👤 User profiles

---

## Step 1: Enable Firestore

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com
   - Select your project: `stakesmith-793f8`

2. **Click "Firestore Database" in the left menu**

3. **Click "Create Database"**

4. **Choose Production Mode**
   - Select "Start in production mode"
   - Click "Next"

5. **Choose Location**
   - Select closest region (e.g., `us-central1`)
   - Click "Enable"

Wait 1-2 minutes for Firestore to initialize.

---

## Step 2: Set Up Security Rules

1. **Click on the "Rules" tab** in Firestore

2. **Replace the default rules with this:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own transactions
    match /transactions/{transactionId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Users can read/write/update/delete their own blueprints
    match /blueprints/{blueprintId} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
  }
}
```

3. **Click "Publish"**

---

## Step 3: Update Vercel Environment Variables

You need to add the Daytona API key to Vercel:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Select your `stakesmith` project

2. **Go to Settings → Environment Variables**

3. **Add this variable:**
   ```
   Name: DAYTONA_API_KEY
   Value: dtn_420f8063b62966174107e84d48ecf5c1d7f5c680abf8a1cdd48348c020e5eaa9
   ```

4. **Click "Save"**

5. **Redeploy your app**
   - Go to "Deployments" tab
   - Click "..." on latest deployment
   - Click "Redeploy"

---

## Step 4: Test Everything

1. **Start your dev server** (if not running)
   ```bash
   npm run dev
   ```

2. **Sign in with Google**Reg

3. **Try "Add Funds"**
   - Go to Dashboard
   - Click "Add Funds"
   - Enter $500
   - Click "Add"
   - Should see success message

4. **Check Firestore**
   - Go back to Firebase Console → Firestore
   - You should see:
     - `users` collection with your profile
     - `transactions` collection with your transaction

5. **Try saving a blueprint**
   - Generate strategies
   - Click "Save" on any strategy
   - Check Firestore for `blueprints` collection

6. **Try Daytona**
   - Click "Test" button on any strategy
   - Should create a sandbox (once Vercel is updated)

---

## Troubleshooting

### "Permission Denied" Error
- **Problem**: Firestore rules not published
- **Solution**: Go to Rules tab, verify rules are correct, click "Publish"

### "Add Funds" Does Nothing
- **Problem**: Firestore not enabled yet
- **Solution**: Complete Step 1 to enable Firestore database

### Daytona Still Says "Coming Soon"
- **Problem**: Environment variable not on Vercel
- **Solution**: Complete Step 3, then redeploy

### No Data Appears in Firestore
- **Problem**: Not signed in or rules blocking
- **Solution**: 
  1. Sign in with Google first
  2. Check rules are published
  3. Open browser console (F12) for detailed errors

---

## What You'll Have

After setup:
- ✅ Firestore database enabled
- ✅ Security rules protecting user data
- ✅ Add/withdraw funds working
- ✅ Save blueprints working
- ✅ Daytona sandbox testing enabled
- ✅ All features fully functional

---

## Quick Check

Open browser console (F12) and look for these:
```
✓ Firebase initialized
✓ User signed in: [your email]
✓ Firestore ready
```

If you see errors, they'll tell you exactly what's wrong!
