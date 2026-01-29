import { Router } from 'express';
import { query, isPostgres, getMemoryDb, createId, createConfirmationNumber } from '../db/index.js';
import { validateBookingPayload, calculateTotals } from '../validators.js';
import { 
    sendBookingConfirmation, 
    sendAdminBookingAlert,
    sendBookingModificationConfirmation,
    sendBookingCancellationConfirmation,
    sendAdminCancellationAlert
} from '../services/email.js';
import { bookingLimiter, lookupLimiter, modifyLimiter } from '../middleware/rateLimit.js';

const router = Router();

// ============================================
// CUSTOMER SELF-SERVICE ENDPOINTS
// ============================================

/**
 * Lookup booking by confirmation number and email (for security)
 * GET /api/bookings/lookup?confirmation=CHF-XXX&email=xxx@xxx.com
 */
router.get('/lookup', lookupLimiter, async (req, res) => {
    try {
        const { confirmation, email } = req.query;

        // Validate required parameters
        if (!confirmation || !email) {
            return res.status(400).json({ 
                error: 'Both confirmation number and email are required' 
            });
        }

        // Normalize inputs
        const normalizedConfirmation = confirmation.trim().toUpperCase();
        const normalizedEmail = email.trim().toLowerCase();

        if (isPostgres()) {
            const result = await query(`
                SELECT 
                    id, confirmation_number, status, payment_status,
                    service_state, city, event_date, event_time, venue_type, venue_address,
                    num_adults, num_children, package, dietary_notes, special_requests,
                    contact_name, contact_email, contact_phone,
                    base_amount, addons_total, travel_fee, subtotal, total,
                    payment_option, created_at, updated_at,
                    cancelled_at, cancellation_reason, refund_amount
                FROM bookings 
                WHERE UPPER(confirmation_number) = $1 
                AND LOWER(contact_email) = $2
            `, [normalizedConfirmation, normalizedEmail]);

            if (result.rows.length === 0) {
                return res.status(404).json({ 
                    error: 'Booking not found. Please check your confirmation number and email.' 
                });
            }

            const booking = result.rows[0];
            
            // Calculate modification/cancellation eligibility
            const eventDate = new Date(booking.event_date);
            const now = new Date();
            const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
            
            // Business rules for modification/cancellation
            const canModify = booking.status !== 'cancelled' && 
                              booking.status !== 'fulfilled' && 
                              daysUntilEvent >= 3;
            const canCancel = booking.status !== 'cancelled' && 
                              booking.status !== 'fulfilled' && 
                              daysUntilEvent >= 1;
            
            // Calculate potential refund for cancellation
            let refundPercentage = 0;
            if (daysUntilEvent > 7) refundPercentage = 100;
            else if (daysUntilEvent >= 3) refundPercentage = 50;
            else if (daysUntilEvent >= 1) refundPercentage = 0;

            return res.json({
                booking,
                permissions: {
                    canModify,
                    canCancel,
                    daysUntilEvent,
                    refundPercentage,
                    modifyDeadline: daysUntilEvent >= 3 ? null : 'Modifications require 3+ days notice',
                    cancelDeadline: daysUntilEvent >= 1 ? null : 'Cancellations require 1+ day notice'
                }
            });
        } else {
            // In-memory fallback
            const bookings = Array.from(getMemoryDb().bookings.values());
            const booking = bookings.find(b => 
                b.confirmationNumber?.toUpperCase() === normalizedConfirmation &&
                b.contactEmail?.toLowerCase() === normalizedEmail
            );
            
            if (!booking) {
                return res.status(404).json({ 
                    error: 'Booking not found. Please check your confirmation number and email.' 
                });
            }

            const eventDate = new Date(booking.eventDate);
            const daysUntilEvent = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
            
            return res.json({
                booking,
                permissions: {
                    canModify: booking.status !== 'cancelled' && daysUntilEvent >= 3,
                    canCancel: booking.status !== 'cancelled' && daysUntilEvent >= 1,
                    daysUntilEvent,
                    refundPercentage: daysUntilEvent > 7 ? 100 : daysUntilEvent >= 3 ? 50 : 0
                }
            });
        }
    } catch (error) {
        console.error('Booking lookup error:', error);
        return res.status(500).json({ error: 'Failed to lookup booking' });
    }
});

// Create booking (rate limited to prevent spam)
router.post('/', bookingLimiter, async (req, res) => {
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
      
      // Send confirmation emails (fire and forget - don't block response)
      const bookingForEmail = {
        ...booking,
        ...payload,
        total: totals.total
      };
      Promise.all([
        sendBookingConfirmation(bookingForEmail),
        sendAdminBookingAlert(bookingForEmail)
      ]).catch(err => console.error('Email send error:', err));
      
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
      
      // Send confirmation emails for in-memory mode too
      Promise.all([
        sendBookingConfirmation(booking),
        sendAdminBookingAlert(booking)
      ]).catch(err => console.error('Email send error:', err));
      
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

// ============================================
// CUSTOMER SELF-SERVICE: MODIFY BOOKING
// ============================================

/**
 * Modify booking (customer-facing)
 * PATCH /api/bookings/:id/modify
 * Requires email verification in body
 */
router.patch('/:id/modify', modifyLimiter, async (req, res) => {
    try {
        const { email, eventDate, eventTime, numAdults, numChildren, dietaryNotes, specialRequests } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required for verification' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (isPostgres()) {
            // First verify the booking exists and email matches
            const checkResult = await query(`
                SELECT * FROM bookings WHERE id = $1 AND LOWER(contact_email) = $2
            `, [req.params.id, normalizedEmail]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ error: 'Booking not found or email does not match' });
            }

            const booking = checkResult.rows[0];

            // Check if booking can be modified
            if (booking.status === 'cancelled') {
                return res.status(400).json({ error: 'Cannot modify a cancelled booking' });
            }
            if (booking.status === 'fulfilled') {
                return res.status(400).json({ error: 'Cannot modify a completed booking' });
            }

            // Check days until event (must be >= 3 days)
            const eventDateObj = new Date(booking.event_date);
            const daysUntilEvent = Math.ceil((eventDateObj - new Date()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilEvent < 3) {
                return res.status(400).json({ 
                    error: 'Modifications must be made at least 3 days before the event. Please contact us directly.' 
                });
            }

            // Build update object with only allowed fields
            const updates = {};
            const oldValues = {};
            
            if (eventDate && eventDate !== booking.event_date) {
                // Validate new date is in the future and >= 3 days away
                const newDate = new Date(eventDate);
                const newDaysAway = Math.ceil((newDate - new Date()) / (1000 * 60 * 60 * 24));
                if (newDaysAway < 3) {
                    return res.status(400).json({ error: 'New event date must be at least 3 days in the future' });
                }
                updates.event_date = eventDate;
                oldValues.event_date = booking.event_date;
            }
            if (eventTime && eventTime !== booking.event_time) {
                updates.event_time = eventTime;
                oldValues.event_time = booking.event_time;
            }
            if (numAdults !== undefined && numAdults !== booking.num_adults) {
                if (numAdults < 6) {
                    return res.status(400).json({ error: 'Minimum 6 adults required' });
                }
                updates.num_adults = numAdults;
                oldValues.num_adults = booking.num_adults;
            }
            if (numChildren !== undefined && numChildren !== booking.num_children) {
                updates.num_children = numChildren;
                oldValues.num_children = booking.num_children;
            }
            if (dietaryNotes !== undefined) {
                updates.dietary_notes = dietaryNotes;
                oldValues.dietary_notes = booking.dietary_notes;
            }
            if (specialRequests !== undefined) {
                updates.special_requests = specialRequests;
                oldValues.special_requests = booking.special_requests;
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ error: 'No changes provided' });
            }

            // Recalculate totals if guest count changed
            if (updates.num_adults || updates.num_children !== undefined) {
                const newAdults = updates.num_adults || booking.num_adults;
                const newChildren = updates.num_children !== undefined ? updates.num_children : booking.num_children;
                
                // Get package price
                const packagePrices = { signature: 75, premium: 95, deluxe: 125 };
                const packagePrice = packagePrices[booking.package] || 75;
                
                const base = newAdults * packagePrice;
                const childrenTotal = newChildren * (packagePrice * 0.5);
                const newSubtotal = base + childrenTotal + (parseFloat(booking.addons_total) || 0);
                const newTotal = newSubtotal + (parseFloat(booking.travel_fee) || 0);
                
                updates.base_amount = base;
                updates.subtotal = newSubtotal;
                updates.total = newTotal;
            }

            // Perform update
            const fields = Object.keys(updates);
            const setClause = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
            const values = [...Object.values(updates), req.params.id];

            const result = await query(
                `UPDATE bookings SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
                values
            );

            const updatedBooking = result.rows[0];

            // Send modification confirmation email
            sendBookingModificationConfirmation(updatedBooking, oldValues, updates)
                .catch(err => console.error('Modification email error:', err));

            return res.json({
                success: true,
                message: 'Booking modified successfully',
                booking: updatedBooking,
                changes: updates
            });
        } else {
            // In-memory fallback
            const booking = getMemoryDb().bookings.get(req.params.id);
            if (!booking || booking.contactEmail?.toLowerCase() !== normalizedEmail) {
                return res.status(404).json({ error: 'Booking not found or email does not match' });
            }
            
            const updates = { eventDate, eventTime, numAdults, numChildren, dietaryNotes, specialRequests };
            const updated = { ...booking, ...updates, updatedAt: new Date().toISOString() };
            getMemoryDb().bookings.set(req.params.id, updated);
            
            return res.json({ success: true, booking: updated });
        }
    } catch (error) {
        console.error('Modify booking error:', error);
        return res.status(500).json({ error: 'Failed to modify booking' });
    }
});

// ============================================
// CUSTOMER SELF-SERVICE: CANCEL BOOKING
// ============================================

/**
 * Cancel booking (customer-facing)
 * POST /api/bookings/:id/cancel
 * Requires email verification in body
 */
router.post('/:id/cancel', modifyLimiter, async (req, res) => {
    try {
        const { email, reason } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required for verification' });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (isPostgres()) {
            // Verify booking exists and email matches
            const checkResult = await query(`
                SELECT * FROM bookings WHERE id = $1 AND LOWER(contact_email) = $2
            `, [req.params.id, normalizedEmail]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ error: 'Booking not found or email does not match' });
            }

            const booking = checkResult.rows[0];

            // Check if already cancelled
            if (booking.status === 'cancelled') {
                return res.status(400).json({ error: 'Booking is already cancelled' });
            }
            if (booking.status === 'fulfilled') {
                return res.status(400).json({ error: 'Cannot cancel a completed booking' });
            }

            // Calculate days until event
            const eventDate = new Date(booking.event_date);
            const now = new Date();
            const daysUntilEvent = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

            if (daysUntilEvent < 1) {
                return res.status(400).json({ 
                    error: 'Cannot cancel within 24 hours of the event. Please contact us directly.' 
                });
            }

            // Calculate refund based on cancellation policy
            // > 7 days: 100% refund
            // 3-7 days: 50% refund
            // 1-3 days: No refund (but can still cancel)
            let refundPercentage = 0;
            if (daysUntilEvent > 7) refundPercentage = 100;
            else if (daysUntilEvent >= 3) refundPercentage = 50;

            // Get amount paid from payments table
            const paymentsResult = await query(`
                SELECT SUM(amount) as total_paid FROM payments 
                WHERE booking_id = $1 AND status = 'succeeded'
            `, [req.params.id]);

            const totalPaidCents = parseInt(paymentsResult.rows[0]?.total_paid) || 0;
            const refundAmountCents = Math.round(totalPaidCents * (refundPercentage / 100));
            const refundAmount = refundAmountCents / 100;

            // Update booking to cancelled status
            const result = await query(`
                UPDATE bookings SET 
                    status = 'cancelled',
                    payment_status = CASE 
                        WHEN $1 > 0 THEN 'pending_refund'
                        ELSE payment_status
                    END,
                    cancelled_at = NOW(),
                    cancellation_reason = $2,
                    refund_amount = $1,
                    updated_at = NOW()
                WHERE id = $3
                RETURNING *
            `, [refundAmount, reason || 'Customer requested cancellation', req.params.id]);

            const cancelledBooking = result.rows[0];

            // Send cancellation emails
            Promise.all([
                sendBookingCancellationConfirmation(cancelledBooking, {
                    daysUntilEvent,
                    refundPercentage,
                    refundAmount,
                    totalPaid: totalPaidCents / 100
                }),
                sendAdminCancellationAlert(cancelledBooking, {
                    daysUntilEvent,
                    refundPercentage,
                    refundAmount,
                    totalPaid: totalPaidCents / 100,
                    reason: reason || 'Not specified'
                })
            ]).catch(err => console.error('Cancellation email error:', err));

            return res.json({
                success: true,
                message: 'Booking cancelled successfully',
                booking: cancelledBooking,
                refund: {
                    eligible: refundPercentage > 0,
                    percentage: refundPercentage,
                    amount: refundAmount,
                    note: refundPercentage === 100 
                        ? 'Full refund will be processed within 5-10 business days'
                        : refundPercentage === 50
                            ? '50% refund will be processed within 5-10 business days'
                            : 'No refund eligible for cancellations within 3 days of event'
                }
            });
        } else {
            // In-memory fallback
            const booking = getMemoryDb().bookings.get(req.params.id);
            if (!booking || booking.contactEmail?.toLowerCase() !== normalizedEmail) {
                return res.status(404).json({ error: 'Booking not found or email does not match' });
            }
            
            booking.status = 'cancelled';
            booking.cancelledAt = new Date().toISOString();
            booking.cancellationReason = reason || 'Customer requested';
            getMemoryDb().bookings.set(req.params.id, booking);
            
            return res.json({ success: true, booking });
        }
    } catch (error) {
        console.error('Cancel booking error:', error);
        return res.status(500).json({ error: 'Failed to cancel booking' });
    }
});

export default router;
