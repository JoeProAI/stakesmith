# 🚀 Deployment Checklist

Complete these steps in order to launch StakeSmith with Stripe payments.

---

## Phase 1: Local Setup (5 minutes)

- [ ] Run `npm install` to install Stripe dependency
- [ ] Create `.env.local` file (copy from `.env.local.example`)
- [ ] Add your Stripe keys to `.env.local`
- [ ] Run `npm run dev` and verify no errors
- [ ] Test locally at `http://localhost:3000`

---

## Phase 2: Stripe Configuration (10 minutes)

### Create Products:
- [ ] Go to https://dashboard.stripe.com/products
- [ ] Create "StakeSmith Pro" ($9.99/month)
  - Copy Price ID: `price_xxxxx`
- [ ] Create "StakeSmith VIP" ($29.99/month)
  - Copy Price ID: `price_xxxxx`

### Set Up Webhook:
- [ ] Go to https://dashboard.stripe.com/webhooks
- [ ] Click "Add endpoint"
- [ ] Enter: `https://stakesmith.com/api/webhooks/stripe`
  - (Replace with your actual domain)
- [ ] Select events:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `charge.refunded`
- [ ] Copy Signing Secret: `whsec_xxxxx`

---

## Phase 3: Vercel Configuration (10 minutes)

### Add Environment Variables:
1. Go to https://vercel.com/dashboard
2. Select **stakesmith** project
3. Go to **Settings → Environment Variables**
4. Add each variable below (copy-paste exactly):

**Public Variables:**
```
NEXT_PUBLIC_STRIPE_PUBLIC_KEY
Value: pk_live_your_stripe_public_key_here
```

```
NEXT_PUBLIC_APP_URL
Value: https://stakesmith.com (or your domain)
```

**Secret Variables:**
```
STRIPE_PUBLIC_KEY
Value: pk_live_your_stripe_public_key_here
```

```
STRIPE_SECRET_KEY
Value: sk_live_your_stripe_secret_key_here
```

```
STRIPE_WEBHOOK_SECRET
Value: whsec_xxxxx (from webhook setup above)
```

```
STRIPE_PRO_PRICE_ID
Value: price_xxxxx (from product creation above)
```

```
STRIPE_VIP_PRICE_ID
Value: price_xxxxx (from product creation above)
```

- [ ] Verify all variables are added
- [ ] Do NOT commit these to git

---

## Phase 4: Firestore Setup (5 minutes)

### Update Security Rules:
1. Go to https://console.firebase.google.com
2. Select **stakesmith-793f8** project
3. Go to **Firestore Database → Rules**
4. Replace with rules from `FIRESTORE_SETUP.md` (lines 40-71)
5. Click **Publish**

- [ ] Firestore rules published with `bets` collection
- [ ] Verify no errors

---

## Phase 5: Deploy to Vercel (5 minutes)

### Option A: GitHub Integration (Recommended)
```bash
git add .
git commit -m "Add Stripe integration with subscription tiers"
git push origin main
```
- [ ] Wait for Vercel to auto-deploy
- [ ] Check deployment status at https://vercel.com/dashboard

### Option B: Direct Deploy
```bash
npm run deploy:vercel
```
- [ ] Verify deployment succeeded
- [ ] Check logs for errors

---

## Phase 6: Testing (10 minutes)

### Local Test:
- [ ] `npm run dev`
- [ ] Go to `http://localhost:3000/pricing`
- [ ] Click "Upgrade to Pro"
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Expiry: `12/25`, CVC: `123`
- [ ] Verify checkout works

### Production Test:
- [ ] Go to `https://stakesmith.com/pricing`
- [ ] Click "Upgrade to Pro"
- [ ] Complete payment
- [ ] Check Stripe Dashboard for transaction
- [ ] Check Firestore for subscription document

### Webhook Test:
- [ ] Go to Stripe Dashboard → Webhooks
- [ ] Click your endpoint
- [ ] Scroll to "Recent events"
- [ ] Verify `customer.subscription.created` event
- [ ] Click event to see payload

---

## Phase 7: Verification (5 minutes)

### Check Stripe Dashboard:
- [ ] https://dashboard.stripe.com/payments - See transaction
- [ ] https://dashboard.stripe.com/customers - See customer
- [ ] https://dashboard.stripe.com/webhooks - See event delivery

### Check Firestore:
- [ ] Collections → subscriptions
- [ ] Verify document with:
  ```
  userId: "your-user-id"
  tier: "pro"
  status: "active"
  ```

### Check Vercel Logs:
- [ ] Deployments → Select latest
- [ ] Logs → Verify no errors
- [ ] Check for webhook processing logs

---

## Phase 8: Go Live (5 minutes)

### Update Domain:
- [ ] Ensure your domain points to Vercel
- [ ] Update webhook URL if needed
- [ ] Update `NEXT_PUBLIC_APP_URL` if domain changed

### Announce Launch:
- [ ] Tweet about launch
- [ ] Post on Reddit (r/sportsbooks, r/nfl)
- [ ] Email your list
- [ ] Share on Discord

### Monitor:
- [ ] Watch Stripe Dashboard for transactions
- [ ] Monitor Vercel logs for errors
- [ ] Check Firestore for subscriptions
- [ ] Respond to support emails

---

## Troubleshooting

### "Build failed"
```
Solution: Check Vercel logs for errors
- npm run build locally to test
- Fix any TypeScript errors
- Redeploy
```

### "Checkout not working"
```
Solution: Check environment variables
- Verify STRIPE_SECRET_KEY is correct
- Verify STRIPE_PRO_PRICE_ID exists
- Check Vercel logs
```

### "Webhook not firing"
```
Solution: Check webhook configuration
- Verify webhook URL is correct (https)
- Verify signing secret matches
- Check Stripe Dashboard for delivery status
```

### "Subscription not in Firestore"
```
Solution: Check webhook processing
- Wait 30 seconds (webhook delay)
- Refresh page
- Check Stripe Dashboard for webhook delivery
- Check Vercel logs for webhook errors
```

---

## Success Criteria

✅ All of these should be true:

- [ ] App builds without errors
- [ ] Checkout page loads
- [ ] Stripe checkout opens when clicking upgrade
- [ ] Payment processes successfully
- [ ] Subscription appears in Firestore within 30 seconds
- [ ] User sees Pro/VIP features after payment
- [ ] Webhook events appear in Stripe Dashboard
- [ ] No errors in Vercel logs

---

## Post-Launch Tasks

### Week 1:
- [ ] Monitor for bugs/issues
- [ ] Respond to support emails
- [ ] Check conversion rates
- [ ] Verify webhook reliability

### Week 2:
- [ ] Analyze payment data
- [ ] Optimize checkout flow
- [ ] A/B test pricing (optional)
- [ ] Plan marketing campaign

### Ongoing:
- [ ] Monitor Stripe Dashboard daily
- [ ] Check Firestore for issues
- [ ] Update documentation
- [ ] Gather user feedback

---

## Revenue Tracking

### Daily:
- Check Stripe Dashboard → Payments
- Note: New subscriptions, cancellations, failed payments

### Weekly:
- Calculate MRR (Monthly Recurring Revenue)
- Track conversion rate
- Monitor churn rate

### Monthly:
- Generate revenue report
- Analyze customer acquisition cost
- Plan next month's marketing

---

## Support Resources

- **Stripe Docs**: https://stripe.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## Final Checklist

Before launching, verify:

- [ ] All environment variables added to Vercel
- [ ] Stripe products created with correct prices
- [ ] Webhook configured and verified
- [ ] Firestore rules published
- [ ] App deployed to Vercel
- [ ] Local testing passed
- [ ] Production testing passed
- [ ] Webhook testing passed
- [ ] Domain configured
- [ ] Monitoring set up

---

## 🎉 Ready to Launch!

Once all items are checked, you're ready to go live.

**Estimated time to complete: 1 hour**

Good luck! 🚀
