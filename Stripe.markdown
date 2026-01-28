# Stripe Integration - ChefWeb/POP Habachi

## Production Deployment Guide & Security Checklist

**Stack:** Node.js/Express (Backend on Cloud Run) + Stripe Elements (Frontend on GitHub Pages)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND (GitHub Pages)                                              │
│  https://jimmy00415.github.io/ChefWeb/                               │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  booking.js                                                     │  │
│  │  - Fetches pk_live_... from /api/config/stripe                 │  │
│  │  - Mounts Stripe Elements card form                            │  │
│  │  - Calls /api/payments/create-intent                           │  │
│  │  - Confirms payment with stripe.confirmCardPayment()           │  │
│  └────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                              │ HTTPS
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  BACKEND (Google Cloud Run)                                          │
│  https://chefweb-backend-775848565797.us-central1.run.app            │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  payments.js                                                    │  │
│  │  - GET  /api/config/stripe      → returns publishableKey       │  │
│  │  - POST /api/payments/create-intent → creates PaymentIntent    │  │
│  │  - POST /api/payments/webhook   → handles Stripe webhooks      │  │
│  │  - POST /api/payments/refund    → processes refunds            │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  Environment Variables (Secret Manager):                             │
│  - STRIPE_SECRET_KEY     (sk_live_...)                               │
│  - STRIPE_PUBLISHABLE_KEY (pk_live_...)                              │
│  - STRIPE_WEBHOOK_SECRET (whsec_...)                                 │
└──────────────────────────────────────────────────────────────────────┘
                              │ Webhooks
                              ▼
┌──────────────────────────────────────────────────────────────────────┐
│  STRIPE                                                               │
│  - PaymentIntents API                                                │
│  - Webhooks → /api/payments/webhook                                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Security Risk Matrix

| Risk Level | Risk | Impact | Mitigation |
|------------|------|--------|------------|
| 🔴 **CRITICAL** | Secret key (sk_live_...) leakage | Attacker can charge cards, issue refunds, access customer data | Store in Secret Manager, never in code/logs |
| 🔴 **CRITICAL** | Webhook signature bypass | Fake payment confirmations, order fraud | Verify signatures with raw body |
| 🟠 **HIGH** | Test/Live key mixing | Payments fail in production, broken subscriptions | Separate env configs per environment |
| 🟠 **HIGH** | Double charges on retry | Customer disputes, refunds, reputation damage | Implement idempotency keys |
| 🟡 **MEDIUM** | Missing SCA/3DS handling | EU payments fail, compliance issues | Use Payment Intents API properly |
| 🟡 **MEDIUM** | Trusting frontend payment state | Order marked "paid" without actual payment | Webhook is source of truth |

---

## 3. Environment Configuration

### 3.1 Required Secrets (Google Secret Manager)

```bash
# Create secrets in Google Secret Manager
gcloud secrets create stripe-secret-key --replication-policy="automatic"
gcloud secrets create stripe-webhook-secret --replication-policy="automatic"

# Add secret versions
echo -n "sk_live_YOUR_SECRET_KEY" | gcloud secrets versions add stripe-secret-key --data-file=-
echo -n "whsec_YOUR_WEBHOOK_SECRET" | gcloud secrets versions add stripe-webhook-secret --data-file=-
```

### 3.2 Cloud Run Environment Variables

| Variable | Source | Description |
|----------|--------|-------------|
| `STRIPE_PUBLISHABLE_KEY` | Plain env var | `pk_live_...` (safe for client) |
| `STRIPE_SECRET_KEY` | Secret Manager | `sk_live_...` (server-only) |
| `STRIPE_WEBHOOK_SECRET` | Secret Manager | `whsec_...` (webhook verification) |

### 3.3 Test vs Production Keys

| Environment | Publishable Key | Secret Key | Webhook Endpoint |
|-------------|-----------------|------------|------------------|
| **Development** | `pk_test_...` | `sk_test_...` | `localhost:4000/api/payments/webhook` |
| **Staging** | `pk_test_...` | `sk_test_...` | `staging-backend.run.app/api/payments/webhook` |
| **Production** | `pk_live_...` | `sk_live_...` | `chefweb-backend-xxx.run.app/api/payments/webhook` |

---

## 4. Implementation Requirements

### 4.1 Backend: Real Stripe Integration

**File:** `Backend/src/routes/payments.js`

```javascript
import { Router } from 'express';
import Stripe from 'stripe';
import { query, isPostgres, createId } from '../db/index.js';

const router = Router();

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  maxNetworkRetries: 2
});

// Get publishable key for frontend
router.get('/config/stripe', (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

// Create PaymentIntent with idempotency
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency, bookingData, idempotencyKey } = req.body;
    
    // Validate amount
    if (!amount || amount < 50) { // Stripe minimum is 50 cents
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Generate idempotency key if not provided
    const idemKey = idempotencyKey || `booking_${bookingData?.contactEmail}_${Date.now()}`;

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount),
      currency: currency || 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingEmail: bookingData?.contactEmail || '',
        bookingDate: bookingData?.eventDate || '',
        package: bookingData?.package || ''
      }
    }, {
      idempotencyKey: idemKey
    });

    // Store in database
    if (isPostgres()) {
      await query(`
        INSERT INTO payments (payment_intent_id, amount, currency, status, payment_type)
        VALUES ($1, $2, $3, $4, $5)
      `, [paymentIntent.id, amount, currency || 'usd', paymentIntent.status, req.body.paymentType]);
    }

    res.json({ 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('PaymentIntent creation failed:', error.message);
    res.status(500).json({ error: 'Payment initialization failed' });
  }
});

// Webhook handler (MUST use raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

async function handlePaymentSuccess(paymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  if (isPostgres()) {
    // Update payment status
    await query(`
      UPDATE payments SET status = 'succeeded', updated_at = NOW()
      WHERE payment_intent_id = $1
    `, [paymentIntent.id]);
    
    // Update booking status if linked
    await query(`
      UPDATE bookings SET payment_status = 'paid', status = 'confirmed', updated_at = NOW()
      WHERE id = (SELECT booking_id FROM payments WHERE payment_intent_id = $1)
    `, [paymentIntent.id]);
  }
}

async function handlePaymentFailure(paymentIntent) {
  console.log('Payment failed:', paymentIntent.id);
  
  if (isPostgres()) {
    await query(`
      UPDATE payments SET status = 'failed', updated_at = NOW()
      WHERE payment_intent_id = $1
    `, [paymentIntent.id]);
  }
}

// Refund endpoint
router.post('/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;
    
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount // Optional: partial refund in cents
    });

    if (isPostgres()) {
      await query(`
        UPDATE payments SET status = 'refunded', refund_id = $1, updated_at = NOW()
        WHERE payment_intent_id = $2
      `, [refund.id, paymentIntentId]);
    }

    res.json({ refundId: refund.id, status: refund.status });
  } catch (error) {
    console.error('Refund failed:', error.message);
    res.status(500).json({ error: 'Refund failed' });
  }
});

export default router;
```

### 4.2 Webhook Raw Body Middleware

**Important:** The webhook endpoint MUST receive the raw body for signature verification.

**File:** `Backend/src/index.js` (add before json middleware for webhook route)

```javascript
// Webhook needs raw body - must be before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Then apply JSON parsing to all other routes
app.use(express.json({ limit: '2mb' }));
```

---

## 5. Order State Machine

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   CREATED   │────▶│  PAYMENT_PENDING │────▶│    CONFIRMED    │
└─────────────┘     └──────────────────┘     └─────────────────┘
                           │                        │
                           │ payment_failed         │
                           ▼                        ▼
                    ┌──────────────┐         ┌─────────────┐
                    │    FAILED    │         │  FULFILLED  │
                    └──────────────┘         └─────────────┘
                                                    │
                                                    │ refund
                                                    ▼
                                             ┌─────────────┐
                                             │  REFUNDED   │
                                             └─────────────┘
```

### Database Status Values

| Table | Field | Values |
|-------|-------|--------|
| `bookings` | `status` | `pending_payment`, `confirmed`, `fulfilled`, `cancelled` |
| `bookings` | `payment_status` | `unpaid`, `deposit_paid`, `paid`, `refunded`, `failed` |
| `payments` | `status` | `requires_payment`, `processing`, `succeeded`, `failed`, `refunded` |

---

## 6. Deployment Commands

### 6.1 Set Up Stripe Keys on Cloud Run

```bash
# Using plain environment variable for publishable key (safe)
gcloud run services update chefweb-backend \
  --region=us-central1 \
  --update-env-vars="STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY"

# Using Secret Manager for secret key (recommended)
gcloud run services update chefweb-backend \
  --region=us-central1 \
  --update-secrets="STRIPE_SECRET_KEY=stripe-secret-key:latest"

gcloud run services update chefweb-backend \
  --region=us-central1 \
  --update-secrets="STRIPE_WEBHOOK_SECRET=stripe-webhook-secret:latest"
```

### 6.2 Configure Stripe Webhook in Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Endpoint URL: `https://chefweb-backend-775848565797.us-central1.run.app/api/payments/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `charge.dispute.created`
5. Copy the webhook signing secret (`whsec_...`) and store in Secret Manager

### 6.3 Install Stripe SDK

```bash
cd Backend
npm install stripe
```

---

## 7. Production Checklist

### Security
- [ ] `STRIPE_SECRET_KEY` stored in Google Secret Manager (not env var)
- [ ] `STRIPE_WEBHOOK_SECRET` stored in Google Secret Manager
- [ ] Secret key never appears in logs, error messages, or stack traces
- [ ] Webhook signature verification uses raw body
- [ ] CORS configured to allow only production domain

### Idempotency
- [ ] Every `create-intent` call includes `idempotencyKey`
- [ ] Idempotency key derived from booking reference or email+timestamp
- [ ] Webhook handlers are idempotent (check status before updating)

### State Management
- [ ] Payment state comes from webhooks, not frontend
- [ ] Database has proper `status` and `payment_status` fields
- [ ] Booking status updates only after webhook confirmation

### SCA/3DS Compliance
- [ ] Using `confirmCardPayment()` which handles 3DS automatically
- [ ] Error handling for `authentication_required` status
- [ ] Dunning flow for failed recurring payments (if applicable)

### Monitoring
- [ ] Logging for payment events (without sensitive data)
- [ ] Alerting for webhook failures
- [ ] Dashboard access for support team

### Testing
- [ ] Test mode payments working end-to-end
- [ ] 3DS test cards verified (4000002500003155)
- [ ] Refund flow tested
- [ ] Webhook retry behavior tested

---

## 8. Incident Response

### If Secret Key is Compromised

1. **Immediately** rotate key in Stripe Dashboard
2. Update Secret Manager with new key
3. Redeploy Cloud Run service
4. Review Stripe logs for unauthorized activity
5. Contact Stripe support if fraudulent charges detected

```bash
# Quick key rotation
echo -n "sk_live_NEW_KEY" | gcloud secrets versions add stripe-secret-key --data-file=-
gcloud run services update chefweb-backend --region=us-central1 --update-secrets="STRIPE_SECRET_KEY=stripe-secret-key:latest"
```

### Webhook Failure Debugging

```bash
# Check Cloud Run logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=chefweb-backend" --limit=50

# Check Stripe webhook attempts
# Go to Stripe Dashboard → Developers → Webhooks → Select endpoint → Event attempts
```

---

## 9. Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend Stripe Elements | ✅ Implemented | Uses `stripe.confirmCardPayment()` |
| `/api/config/stripe` | ✅ Implemented | Returns publishable key |
| `/api/payments/create-intent` | ⚠️ Mock | Returns mock clientSecret - needs real Stripe SDK |
| `/api/payments/webhook` | ⚠️ Stub | Returns `{received: true}` - needs signature verification |
| `/api/payments/refund` | ⚠️ Mock | Updates DB only - needs real Stripe SDK |
| Secret Manager integration | ❌ Not done | Keys currently in plain env vars |
| Idempotency keys | ❌ Not done | Need to add to create-intent |
| Webhook signature verification | ❌ Not done | Need raw body middleware |

---

## 10. Next Steps to Production-Ready Payments

### Step 1: Install Stripe SDK
```bash
cd Backend
npm install stripe
```

### Step 2: Create Secrets in Google Secret Manager
```bash
# Create secrets
gcloud secrets create stripe-secret-key --replication-policy="automatic" --project=smiling-mark-476404-h0
gcloud secrets create stripe-webhook-secret --replication-policy="automatic" --project=smiling-mark-476404-h0

# Add your keys (replace with actual keys)
echo -n "sk_test_YOUR_KEY" | gcloud secrets versions add stripe-secret-key --data-file=- --project=smiling-mark-476404-h0
```

### Step 3: Update payments.js with Real Stripe SDK
Replace the mock implementation with the code in Section 4.1

### Step 4: Add Raw Body Middleware for Webhooks
Update index.js as shown in Section 4.2

### Step 5: Configure Webhook in Stripe Dashboard
Follow instructions in Section 6.2

### Step 6: Deploy and Test with Test Keys
```bash
cd Backend
gcloud run deploy chefweb-backend --source=. --region=us-central1 --project=smiling-mark-476404-h0 --allow-unauthenticated
```

### Step 7: Switch to Live Keys After Testing
Update secrets with `sk_live_...` and `pk_live_...` keys

---

## Appendix A: Test Card Numbers

| Scenario | Card Number | CVC | Expiry |
|----------|-------------|-----|--------|
| Success | 4242 4242 4242 4242 | Any 3 digits | Any future |
| Requires 3DS | 4000 0025 0000 3155 | Any 3 digits | Any future |
| Declined | 4000 0000 0000 0002 | Any 3 digits | Any future |
| Insufficient funds | 4000 0000 0000 9995 | Any 3 digits | Any future |

---

## Appendix B: Common Error Codes

| Error Code | Meaning | Action |
|------------|---------|--------|
| `card_declined` | Card was declined | Ask customer to use different card |
| `expired_card` | Card has expired | Ask customer to update card |
| `incorrect_cvc` | CVC is incorrect | Ask customer to re-enter CVC |
| `processing_error` | Stripe processing issue | Retry with idempotency key |
| `authentication_required` | 3DS required | Frontend handles automatically |

---

## Appendix C: Webhook Event Reference

| Event | When | Action |
|-------|------|--------|
| `payment_intent.created` | PaymentIntent created | Optional: log for debugging |
| `payment_intent.succeeded` | Payment successful | Update booking to "confirmed", send confirmation email |
| `payment_intent.payment_failed` | Payment failed | Update booking status, notify customer |
| `charge.refunded` | Refund processed | Update payment status, send refund confirmation |
| `charge.dispute.created` | Chargeback initiated | Alert support team, gather evidence |

---

*Last updated: January 28, 2026*
