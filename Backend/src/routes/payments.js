import { Router } from 'express';
import Stripe from 'stripe';
import { query, isPostgres, getMemoryDb, createId } from '../db/index.js';
import { calculateTotals } from '../validators.js';
import { sendPaymentReceipt } from '../services/email.js';

const router = Router();

// Initialize Stripe with secret key (will be undefined if not set - handled gracefully)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      maxNetworkRetries: 2
    })
  : null;

// Check if Stripe is configured
const isStripeConfigured = () => !!stripe;

// Get Stripe publishable key
router.get('/config/stripe', (req, res) => {
  return res.json({ 
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    configured: isStripeConfigured()
  });
});

// Create payment intent
router.post('/create-intent', async (req, res) => {
  try {
    const payload = req.body || {};
    const totals = calculateTotals(payload.bookingData || {});
    const requestedAmount = Number(payload.amount || 0);
    const totalCents = Math.round(totals.total * 100);

    // Validate amount
    const amount = requestedAmount || totalCents;
    if (amount < 50) { // Stripe minimum is 50 cents
      return res.status(400).json({ error: 'Amount must be at least $0.50' });
    }

    if (requestedAmount && requestedAmount > totalCents) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Generate idempotency key to prevent double charges
    const idempotencyKey = payload.idempotencyKey || 
      `booking_${payload.bookingData?.contactEmail || 'guest'}_${Date.now()}`;

    // If Stripe is configured, use real PaymentIntent
    if (isStripeConfigured()) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: payload.currency || 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: {
          bookingEmail: payload.bookingData?.contactEmail || '',
          eventDate: payload.bookingData?.eventDate || '',
          package: payload.bookingData?.package || '',
          paymentType: payload.paymentType || 'deposit'
        }
      }, {
        idempotencyKey: idempotencyKey
      });

      // Store in database
      if (isPostgres()) {
        await query(`
          INSERT INTO payments (payment_intent_id, amount, currency, status, payment_type)
          VALUES ($1, $2, $3, $4, $5)
        `, [paymentIntent.id, amount, payload.currency || 'usd', paymentIntent.status, payload.paymentType || 'deposit']);
      } else {
        getMemoryDb().payments.set(paymentIntent.id, {
          id: paymentIntent.id,
          amount,
          status: paymentIntent.status
        });
      }

      return res.json({ 
        clientSecret: paymentIntent.client_secret, 
        client_secret: paymentIntent.client_secret, // backward compatibility
        paymentIntentId: paymentIntent.id 
      });
    }

    // Fallback to mock mode if Stripe not configured (for development)
    console.warn('⚠️ Stripe not configured - using mock mode');
    const paymentIntentId = createId('pi');
    const clientSecret = `${paymentIntentId}_secret_mock`;

    if (isPostgres()) {
      await query(`
        INSERT INTO payments (payment_intent_id, amount, currency, status, payment_type)
        VALUES ($1, $2, $3, $4, $5)
      `, [paymentIntentId, amount, 'usd', 'requires_payment', payload.paymentType || 'deposit']);
    } else {
      getMemoryDb().payments.set(paymentIntentId, {
        id: paymentIntentId,
        amount,
        status: 'requires_payment'
      });
    }

    return res.json({ clientSecret, client_secret: clientSecret, paymentIntentId });
  } catch (error) {
    console.error('Create intent error:', error);
    // Don't expose internal error details to client
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Webhook handler - signature verification for security
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  // If Stripe not configured, return stub response
  if (!isStripeConfigured()) {
    console.warn('⚠️ Webhook received but Stripe not configured');
    return res.status(200).json({ received: true, mode: 'mock' });
  }

  // Verify webhook signature
  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;
      case 'charge.refunded':
        console.log('Refund processed:', event.data.object.id);
        break;
      case 'charge.dispute.created':
        console.error('⚠️ DISPUTE CREATED:', event.data.object.id);
        // TODO: Alert support team
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (handlerError) {
    console.error('Webhook handler error:', handlerError);
    // Still return 200 to acknowledge receipt - Stripe will retry on 4xx/5xx
  }

  return res.status(200).json({ received: true });
});

// Handle successful payment
async function handlePaymentSuccess(paymentIntent) {
  console.log('✅ Payment succeeded:', paymentIntent.id);
  
  if (isPostgres()) {
    // Update payment status
    await query(`
      UPDATE payments SET status = 'succeeded', updated_at = NOW()
      WHERE payment_intent_id = $1
    `, [paymentIntent.id]);
    
    // Update booking status if linked and get booking for email
    const bookingResult = await query(`
      UPDATE bookings SET payment_status = 'paid', status = 'confirmed', updated_at = NOW()
      WHERE id = (SELECT booking_id FROM payments WHERE payment_intent_id = $1)
      RETURNING *
    `, [paymentIntent.id]);
    
    // Send payment receipt email
    if (bookingResult.rows.length > 0) {
      const booking = bookingResult.rows[0];
      const payment = { 
        payment_intent_id: paymentIntent.id, 
        amount: paymentIntent.amount 
      };
      sendPaymentReceipt(booking, payment)
        .catch(err => console.error('Payment receipt email error:', err));
    }
  } else {
    const payment = getMemoryDb().payments.get(paymentIntent.id);
    if (payment) {
      payment.status = 'succeeded';
      getMemoryDb().payments.set(paymentIntent.id, payment);
    }
  }
}

// Handle failed payment
async function handlePaymentFailure(paymentIntent) {
  console.log('❌ Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message);
  
  if (isPostgres()) {
    await query(`
      UPDATE payments SET status = 'failed', updated_at = NOW()
      WHERE payment_intent_id = $1
    `, [paymentIntent.id]);
  } else {
    const payment = getMemoryDb().payments.get(paymentIntent.id);
    if (payment) {
      payment.status = 'failed';
      getMemoryDb().payments.set(paymentIntent.id, payment);
    }
  }
}

// Process refund
router.post('/refund', async (req, res) => {
  try {
    const { paymentIntentId, amount } = req.body;
    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId required' });
    }

    // If Stripe is configured, use real refund
    if (isStripeConfigured()) {
      const refundParams = { payment_intent: paymentIntentId };
      if (amount) {
        refundParams.amount = amount; // Partial refund in cents
      }

      const refund = await stripe.refunds.create(refundParams);

      if (isPostgres()) {
        await query(`
          UPDATE payments SET status = 'refunded', refund_id = $1, updated_at = NOW()
          WHERE payment_intent_id = $2
        `, [refund.id, paymentIntentId]);
      }

      return res.json({ refundId: refund.id, status: refund.status });
    }

    // Fallback to mock mode
    console.warn('⚠️ Stripe not configured - mock refund');
    if (isPostgres()) {
      const refundId = createId('re');
      const result = await query(`
        UPDATE payments SET status = 'refunded', refund_id = $1, updated_at = NOW()
        WHERE payment_intent_id = $2 RETURNING *
      `, [refundId, paymentIntentId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      return res.json({ refundId, status: 'succeeded' });
    } else {
      if (!getMemoryDb().payments.has(paymentIntentId)) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      const payment = getMemoryDb().payments.get(paymentIntentId);
      payment.status = 'refunded';
      getMemoryDb().payments.set(paymentIntentId, payment);
      return res.json({ refundId: createId('re'), status: 'succeeded' });
    }
  } catch (error) {
    console.error('Refund error:', error);
    return res.status(500).json({ error: 'Failed to process refund' });
  }
});

export default router;
