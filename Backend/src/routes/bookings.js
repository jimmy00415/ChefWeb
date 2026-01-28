import { Router } from 'express';
import { query, isPostgres, getMemoryDb, createId, createConfirmationNumber } from '../db/index.js';
import { validateBookingPayload, calculateTotals } from '../validators.js';

const router = Router();

// Create booking
router.post('/', async (req, res) => {
  try {
    const payload = req.body || {};
    const errors = validateBookingPayload(payload);

    if (errors.length) {
      return res.status(400).json({ errors });
    }

    const confirmationNumber = createConfirmationNumber();
    const totals = calculateTotals(payload);
    const status = payload.paymentOption === 'later' ? 'pending_payment' : 'confirmed';
    const paymentStatus = payload.paymentOption === 'full' ? 'paid' : 
                          payload.paymentOption === 'deposit' ? 'deposit_paid' : 'unpaid';

    if (isPostgres()) {
      const result = await query(`
        INSERT INTO bookings (
          confirmation_number, status, payment_status,
          service_state, city, event_date, event_time, venue_type, venue_address,
          num_adults, num_children, package, dietary_notes, special_requests,
          contact_name, contact_email, contact_phone,
          base_amount, addons_total, travel_fee, subtotal, total,
          payment_option, agree_to_terms
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING id, confirmation_number, status
      `, [
        confirmationNumber, status, paymentStatus,
        payload.serviceState, payload.city, payload.eventDate, payload.eventTime,
        payload.venueType || null, payload.venueAddress || null,
        payload.numAdults || 0, payload.numChildren || 0, payload.package || 'signature',
        payload.dietaryNotes || null, payload.specialRequests || null,
        payload.contactName, payload.contactEmail, payload.contactPhone,
        totals.base, totals.addonsTotal, payload.travelFeeAmount || 0, totals.subtotal, totals.total,
        payload.paymentOption || 'later', payload.agreeToTerms
      ]);

      const booking = result.rows[0];
      return res.status(201).json({ 
        bookingId: booking.id, 
        confirmationNumber: booking.confirmation_number, 
        status: booking.status 
      });
    } else {
      // In-memory fallback
      const id = createId('booking');
      const booking = {
        id,
        confirmationNumber,
        status,
        paymentStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...payload,
        ...totals
      };
      getMemoryDb().bookings.set(id, booking);
      return res.status(201).json({ bookingId: id, confirmationNumber, status });
    }
  } catch (error) {
    console.error('Booking creation error:', error);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    if (isPostgres()) {
      const result = await query('SELECT * FROM bookings WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.json(result.rows[0]);
    } else {
      const booking = getMemoryDb().bookings.get(req.params.id);
      if (!booking) return res.status(404).json({ error: 'Not found' });
      return res.json(booking);
    }
  } catch (error) {
    console.error('Get booking error:', error);
    return res.status(500).json({ error: 'Failed to retrieve booking' });
  }
});

// List all bookings
router.get('/', async (req, res) => {
  try {
    if (isPostgres()) {
      const result = await query('SELECT * FROM bookings ORDER BY created_at DESC LIMIT 100');
      return res.json({ bookings: result.rows });
    } else {
      return res.json({ bookings: Array.from(getMemoryDb().bookings.values()) });
    }
  } catch (error) {
    console.error('List bookings error:', error);
    return res.status(500).json({ error: 'Failed to list bookings' });
  }
});

// Update booking
router.patch('/:id', async (req, res) => {
  try {
    if (isPostgres()) {
      const updates = req.body;
      const fields = Object.keys(updates);
      if (fields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      // Convert camelCase to snake_case for DB
      const snakeCaseFields = fields.map(f => f.replace(/[A-Z]/g, m => '_' + m.toLowerCase()));
      const setClause = snakeCaseFields.map((f, i) => `${f} = $${i + 1}`).join(', ');
      const values = [...Object.values(updates), req.params.id];
      
      const result = await query(
        `UPDATE bookings SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found' });
      }
      return res.json(result.rows[0]);
    } else {
      const booking = getMemoryDb().bookings.get(req.params.id);
      if (!booking) return res.status(404).json({ error: 'Not found' });
      const updated = { ...booking, ...req.body, updatedAt: new Date().toISOString() };
      getMemoryDb().bookings.set(req.params.id, updated);
      return res.json(updated);
    }
  } catch (error) {
    console.error('Update booking error:', error);
    return res.status(500).json({ error: 'Failed to update booking' });
  }
});

export default router;
