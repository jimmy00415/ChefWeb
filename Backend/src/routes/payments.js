import { Router } from 'express';
import { query, isPostgres, getMemoryDb, createId } from '../db/index.js';
import { calculateTotals } from '../validators.js';

const router = Router();

// Get Stripe publishable key
router.get('/config/stripe', (req, res) => {
  return res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

// Create payment intent
router.post('/create-intent', async (req, res) => {
  try {
    const payload = req.body || {};
    const totals = calculateTotals(payload.bookingData || {});
    const requestedAmount = Number(payload.amount || 0);
    const totalCents = Math.round(totals.total * 100);

    if (requestedAmount && requestedAmount > totalCents) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentIntentId = createId('pi');
    const clientSecret = `${paymentIntentId}_secret_mock`;
    const amount = requestedAmount || totalCents;

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
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

// Webhook (stub for Stripe webhooks)
router.post('/webhook', (req, res) => {
  return res.status(200).json({ received: true });
});

// Process refund
router.post('/refund', async (req, res) => {
  try {
    const id = req.body?.paymentIntentId;
    if (!id) {
      return res.status(400).json({ error: 'paymentIntentId required' });
    }

    if (isPostgres()) {
      const refundId = createId('re');
      const result = await query(`
        UPDATE payments SET status = 'refunded', refund_id = $1, updated_at = NOW()
        WHERE payment_intent_id = $2 RETURNING *
      `, [refundId, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      return res.json({ refundId, status: 'succeeded' });
    } else {
      if (!getMemoryDb().payments.has(id)) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      const payment = getMemoryDb().payments.get(id);
      payment.status = 'refunded';
      getMemoryDb().payments.set(id, payment);
      return res.json({ refundId: createId('re'), status: 'succeeded' });
    }
  } catch (error) {
    console.error('Refund error:', error);
    return res.status(500).json({ error: 'Failed to process refund' });
  }
});

export default router;
