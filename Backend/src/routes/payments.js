import { Router } from 'express';
import { db, createId } from '../storage.js';
import { calculateTotals } from '../validators.js';

const router = Router();

router.get('/config/stripe', (req, res) => {
  return res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '' });
});

router.post('/create-intent', (req, res) => {
  const payload = req.body || {};
  const totals = calculateTotals(payload.bookingData || {});
  const requestedAmount = Number(payload.amount || 0);
  const totalCents = Math.round(totals.total * 100);

  if (requestedAmount && requestedAmount > totalCents) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const paymentIntentId = createId('pi');
  const clientSecret = `${paymentIntentId}_secret_mock`;

  db.payments.set(paymentIntentId, {
    id: paymentIntentId,
    amount: requestedAmount || totalCents,
    status: 'requires_payment'
  });

  return res.json({ clientSecret, client_secret: clientSecret, paymentIntentId });
});

router.post('/webhook', (req, res) => {
  return res.status(200).json({ received: true });
});

router.post('/refund', (req, res) => {
  const id = req.body?.paymentIntentId;
  if (!id || !db.payments.has(id)) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  const payment = db.payments.get(id);
  payment.status = 'refunded';
  db.payments.set(id, payment);
  return res.json({ refundId: createId('re'), status: 'succeeded' });
});

export default router;
