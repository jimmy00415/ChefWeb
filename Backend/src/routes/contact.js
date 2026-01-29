/**
 * Contact Form API Routes
 * Handles contact form submissions and admin management
 */
import { Router } from 'express';
import { query, isPostgres, getMemoryDb, createId } from '../db/index.js';
import { sendContactInquiryAlert, sendContactAutoReply } from '../services/email.js';
import { contactLimiter } from '../middleware/rateLimit.js';
import logger from '../services/logger.js';
import { validateContactPayload, sanitizeInput, sanitizeName, validatePhone, LENGTH_LIMITS } from '../validators.js';

const router = Router();

/**
 * POST /api/contact - Submit a contact form
 * Rate limited to 5 submissions per hour per IP
 */
router.post('/', contactLimiter, async (req, res) => {
    try {
        const { name, email, phone, reason, subject, message } = req.body || {};

        // Comprehensive validation
        const validationErrors = validateContactPayload({ name, email, phone, message });
        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                error: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: validationErrors
            });
        }

        // Sanitize all inputs
        const sanitizedName = sanitizeName(name);
        const sanitizedEmail = email.trim().toLowerCase();
        const sanitizedMessage = sanitizeInput(message, LENGTH_LIMITS.MESSAGE);
        const sanitizedSubject = subject ? sanitizeInput(subject, 200) : null;
        const sanitizedReason = reason ? sanitizeInput(reason, 100) : null;
        
        // Normalize phone if provided
        let normalizedPhone = null;
        if (phone) {
            const phoneResult = validatePhone(phone);
            if (phoneResult.valid) {
                normalizedPhone = phoneResult.normalized;
            }
        }

        let inquiryId;

        if (isPostgres()) {
            const result = await query(`
                INSERT INTO contact_inquiries (name, email, phone, reason, subject, message)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, created_at
            `, [sanitizedName, sanitizedEmail, normalizedPhone, sanitizedReason, sanitizedSubject, sanitizedMessage]);

            inquiryId = result.rows[0].id;
        } else {
            // In-memory fallback
            inquiryId = createId('contact');
            const inquiry = {
                id: inquiryId,
                name: sanitizedName,
                email: sanitizedEmail,
                phone: normalizedPhone,
                reason: sanitizedReason,
                subject: sanitizedSubject,
                message: sanitizedMessage,
                status: 'new',
                createdAt: new Date().toISOString()
            };
            
            if (!getMemoryDb().contacts) {
                getMemoryDb().contacts = new Map();
            }
            getMemoryDb().contacts.set(inquiryId, inquiry);
        }

        // Send emails (don't await - fire and forget for speed)
        const inquiry = { 
            name: sanitizedName, 
            email: sanitizedEmail, 
            phone: normalizedPhone, 
            reason: sanitizedReason, 
            subject: sanitizedSubject, 
            message: sanitizedMessage 
        };
        
        Promise.all([
            sendContactInquiryAlert(inquiry),
            sendContactAutoReply(inquiry)
        ]).catch(err => logger.logEmail('send_error', { type: 'contact_inquiry', error: err.message }));

        logger.logInfo('Contact form submitted', { inquiryId, reason: sanitizedReason });
        
        return res.status(201).json({ 
            success: true, 
            message: 'Thank you for contacting us! We will respond within 2 hours during business hours.',
            inquiryId 
        });
    } catch (error) {
        logger.logError(error, { context: 'Contact form submission' });
        return res.status(500).json({ 
            error: 'Failed to submit contact form',
            code: 'SERVER_ERROR'
        });
    }
});

/**
 * GET /api/contact - List all contact inquiries (Admin only)
 * Query params: status, limit, offset
 */
router.get('/', async (req, res) => {
    try {
        // Note: Auth middleware will protect this in production
        const { status, limit = 50, offset = 0 } = req.query;

        if (isPostgres()) {
            let sql = `
                SELECT id, name, email, phone, reason, subject, 
                       LEFT(message, 200) as message_preview, 
                       status, created_at, replied_at
                FROM contact_inquiries
            `;
            const params = [];
            
            if (status) {
                sql += ' WHERE status = $1';
                params.push(status);
            }
            
            sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            params.push(parseInt(limit), parseInt(offset));

            const result = await query(sql, params);
            
            // Get total count
            const countSql = status 
                ? 'SELECT COUNT(*) FROM contact_inquiries WHERE status = $1'
                : 'SELECT COUNT(*) FROM contact_inquiries';
            const countResult = await query(countSql, status ? [status] : []);
            
            return res.json({ 
                inquiries: result.rows,
                total: parseInt(countResult.rows[0].count),
                limit: parseInt(limit),
                offset: parseInt(offset)
            });
        } else {
            const contacts = getMemoryDb().contacts || new Map();
            return res.json({ 
                inquiries: Array.from(contacts.values()),
                total: contacts.size
            });
        }
    } catch (error) {
        logger.logError(error, { context: 'List contacts' });
        return res.status(500).json({ error: 'Failed to list contact inquiries' });
    }
});

/**
 * GET /api/contact/:id - Get single contact inquiry (Admin only)
 */
router.get('/:id', async (req, res) => {
    try {
        if (isPostgres()) {
            const result = await query(
                'SELECT * FROM contact_inquiries WHERE id = $1',
                [req.params.id]
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Inquiry not found' });
            }
            
            return res.json(result.rows[0]);
        } else {
            const contacts = getMemoryDb().contacts || new Map();
            const inquiry = contacts.get(req.params.id);
            if (!inquiry) {
                return res.status(404).json({ error: 'Inquiry not found' });
            }
            return res.json(inquiry);
        }
    } catch (error) {
        logger.logError(error, { context: 'Get contact', contactId: req.params.id });
        return res.status(500).json({ error: 'Failed to get contact inquiry' });
    }
});

/**
 * PATCH /api/contact/:id - Update contact inquiry status (Admin only)
 */
router.patch('/:id', async (req, res) => {
    try {
        const { status, admin_notes } = req.body;
        const validStatuses = ['new', 'in_progress', 'replied', 'closed'];
        
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status', 
                validStatuses 
            });
        }

        if (isPostgres()) {
            const updates = [];
            const params = [];
            let paramIndex = 1;

            if (status) {
                updates.push(`status = $${paramIndex++}`);
                params.push(status);
                
                if (status === 'replied') {
                    updates.push(`replied_at = NOW()`);
                }
            }
            
            if (admin_notes !== undefined) {
                updates.push(`admin_notes = $${paramIndex++}`);
                params.push(admin_notes);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No fields to update' });
            }

            params.push(req.params.id);
            const result = await query(
                `UPDATE contact_inquiries SET ${updates.join(', ')}, updated_at = NOW() 
                 WHERE id = $${paramIndex} RETURNING *`,
                params
            );
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Inquiry not found' });
            }
            
            return res.json(result.rows[0]);
        } else {
            const contacts = getMemoryDb().contacts || new Map();
            const inquiry = contacts.get(req.params.id);
            if (!inquiry) {
                return res.status(404).json({ error: 'Inquiry not found' });
            }
            
            if (status) inquiry.status = status;
            if (admin_notes !== undefined) inquiry.adminNotes = admin_notes;
            inquiry.updatedAt = new Date().toISOString();
            
            contacts.set(req.params.id, inquiry);
            return res.json(inquiry);
        }
    } catch (error) {
        logger.logError(error, { context: 'Update contact', contactId: req.params.id });
        return res.status(500).json({ error: 'Failed to update contact inquiry' });
    }
});

export default router;
