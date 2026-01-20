import { Router } from 'express';
import { db, createId, createConfirmationNumber } from '../storage.js';
import { validateBookingPayload, calculateTotals } from '../validators.js';

const router = Router();

router.post('/', (req, res) => {
  const payload = req.body || {};
  const errors = validateBookingPayload(payload);

  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const id = createId('booking');
  const confirmationNumber = createConfirmationNumber();
  const totals = calculateTotals(payload);

  const booking = {
    id,
    confirmationNumber,
    status: payload.paymentOption === 'later' ? 'pending_payment' : 'confirmed',
    paymentStatus: payload.paymentOption === 'full' ? 'paid' : payload.paymentOption === 'deposit' ? 'deposit_paid' : 'unpaid',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...payload,
    ...totals
  };

  db.bookings.set(id, booking);

  return res.status(201).json({ bookingId: id, confirmationNumber, status: booking.status });
});

router.get('/:id', (req, res) => {
  const booking = db.bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Not found' });
  return res.json(booking);
});

router.get('/', (req, res) => {
  return res.json({ bookings: Array.from(db.bookings.values()) });
});

router.patch('/:id', (req, res) => {
  const booking = db.bookings.get(req.params.id);
  if (!booking) return res.status(404).json({ error: 'Not found' });
  const updated = { ...booking, ...req.body, updatedAt: new Date().toISOString() };
  db.bookings.set(req.params.id, updated);
  return res.json(updated);
});

export default router;
