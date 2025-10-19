# 💳 Stripe Integration Setup Guide

## ✅ Your Stripe Keys Are Ready

Your live Stripe keys have been securely configured. Follow these steps to activate them in Vercel.

---

## Step 1: Add Environment Variables to Vercel

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your **stakesmith** project
3. Go to **Settings → Environment Variables**
4. Add the following variables:

### Public Variables (Safe to expose):
```
NEXT_PUBLIC_STRIPE_PUBLIC_KEY = pk_live_your_stripe_public_key_here
NEXT_PUBLIC_APP_URL = https://stakesmith.com (or your domain)
```

### Secret Variables (Never expose):
```
STRIPE_SECRET_KEY = sk_live_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET = (see Step 2 below)
```

---

## Step 2: Set Up Webhook

1. Go to **Stripe Dashboard**: https://dashboard.stripe.com/webhooks
2. Click **Add endpoint**
3. Enter endpoint URL:
   ```
   https://stakesmith.com/api/webhooks/stripe
   ```
   (Replace with your actual domain)

4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `charge.refunded`

5. Click **Add endpoint**
6. Click on the endpoint to view details
7. Copy the **Signing secret** (starts with `whsec_`)
8. Add to Vercel as `STRIPE_WEBHOOK_SECRET`

---

## Step 3: Create Subscription Products

1. Go to **Stripe Dashboard**: https://dashboard.stripe.com/products
2. Click **Add product**

### Product 1: Pro Plan
- **Name**: StakeSmith Pro
- **Description**: Advanced Monte Carlo simulations (10,000 iterations)
- **Price**: $9.99/month
- **Billing period**: Monthly
- **Copy the Price ID** (starts with `price_`)

### Product 2: VIP Plan
- **Name**: StakeSmith VIP
- **Description**: Unlimited simulations + exclusive strategies + Discord
- **Price**: $29.99/month
- **Billing period**: Monthly
- **Copy the Price ID** (starts with `price_`)

---

## Step 4: Add Price IDs to Vercel

Add these to Vercel environment variables:

```
STRIPE_PRO_PRICE_ID = price_xxxxxxxxxxxxx
STRIPE_VIP_PRICE_ID = price_xxxxxxxxxxxxx
```

---

## Step 5: Deploy to Vercel

```bash
# 1. Commit your changes
git add .
git commit -m "Add Stripe integration"

# 2. Push to GitHub (if using GitHub integration)
git push origin main

# 3. Or deploy directly
npm run deploy:vercel
```

Vercel will automatically use the environment variables you added.

---

## Step 6: Test the Integration

### Local Testing:
```bash
# 1. Create .env.local with your keys
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_live_...

# 2. Start dev server
npm run dev

# 3. Go to http://localhost:3000/pricing
# 4. Click "Upgrade to Pro" or "Upgrade to VIP"
# 5. Use Stripe test card: 4242 4242 4242 4242
#    Expiry: 12/25, CVC: 123
```

### Production Testing:
1. Deploy to Vercel
2. Go to your domain/pricing
3. Click upgrade button
4. Complete payment with real card (or use test mode)
5. Check Stripe Dashboard for transaction

---

## Step 7: Verify Webhook

1. Go to **Stripe Dashboard → Webhooks**
2. Click your endpoint
3. Scroll to **Recent events**
4. You should see `customer.subscription.created` events
5. Click an event to see the payload

If you don't see events:
- Check your endpoint URL is correct
- Verify `STRIPE_WEBHOOK_SECRET` matches exactly
- Check Vercel logs for errors

---

## 🔐 Security Checklist

- ✅ Stripe keys added to Vercel (not in code)
- ✅ `.env.local` added to `.gitignore`
- ✅ Webhook secret configured
- ✅ HTTPS enabled (Vercel default)
- ✅ Firestore rules updated for subscriptions
- ✅ Rate limiting enabled for checkout endpoint

---

## 📊 Monitoring

### Check Subscription Status:
```bash
# Go to Firestore → Collections → subscriptions
# You should see documents like:
{
  userId: "user123",
  tier: "pro",
  stripeCustomerId: "cus_xxx",
  stripeSubscriptionId: "sub_xxx",
  status: "active",
  currentPeriodStart: Timestamp,
  currentPeriodEnd: Timestamp,
  updatedAt: Timestamp
}
```

### Check Payments:
```bash
# Go to Stripe Dashboard → Payments
# You should see successful charges
```

---

## 🐛 Troubleshooting

### "Checkout failed"
- Check `STRIPE_SECRET_KEY` is correct
- Verify `STRIPE_PRO_PRICE_ID` and `STRIPE_VIP_PRICE_ID` exist
- Check Vercel logs for errors

### "Webhook not working"
- Verify webhook URL is correct (https, not http)
- Check `STRIPE_WEBHOOK_SECRET` matches exactly
- Verify events are selected in webhook settings
- Check Vercel logs for webhook errors

### "Subscription not appearing in Firestore"
- Check webhook is receiving events
- Verify Firebase credentials are correct
- Check Firestore rules allow writes to `subscriptions` collection
- Check browser console for errors

### "Payment succeeded but subscription not updated"
- Wait 30 seconds (webhook processing)
- Refresh page
- Check Firestore for subscription document
- Check Stripe Dashboard for webhook delivery status

---

## 📞 Support

- **Stripe Docs**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Vercel Docs**: https://vercel.com/docs
- **Firebase Docs**: https://firebase.google.com/docs

---

## Next Steps

1. ✅ Add environment variables to Vercel
2. ✅ Create Stripe products and get price IDs
3. ✅ Set up webhook
4. ✅ Deploy to Vercel
5. ✅ Test checkout flow
6. ✅ Monitor in Stripe Dashboard

**Your Stripe integration is ready to go!**
