/**
 * Email Service - SendGrid Integration
 * Sends transactional emails for bookings, payments, and contact inquiries
 */
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'booking@pophabachi.com';
const EMAIL_ADMIN = process.env.EMAIL_ADMIN || 'admin@pophabachi.com';
const SITE_URL = 'https://jimmy00415.github.io/ChefWeb';

let isConfigured = false;

if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    isConfigured = true;
    console.log('✅ SendGrid email configured');
} else {
    console.warn('⚠️ SENDGRID_API_KEY not set - emails will be logged only');
}

/**
 * Send email using SendGrid or log if not configured
 * @param {object} options - Email options
 * @returns {Promise<object>} Send result
 */
async function sendEmail({ to, subject, html, text }) {
    const msg = {
        to,
        from: EMAIL_FROM,
        subject,
        html,
        text: text || stripHtml(html)
    };

    if (!isConfigured) {
        console.log('📧 [MOCK EMAIL]');
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Body preview: ${(text || '').substring(0, 100)}...`);
        return { success: true, mock: true };
    }

    try {
        await sgMail.send(msg);
        console.log(`📧 Email sent to ${to}: ${subject}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Email send error:', error.response?.body || error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Strip HTML tags for plain text version
 */
function stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD' 
    }).format(amount);
}

/**
 * Format date nicely
 */
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Send booking confirmation to customer
 */
export async function sendBookingConfirmation(booking) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #d4af37, #c9a227); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .confirmation-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .confirmation-number { font-size: 28px; font-weight: bold; color: #d4af37; letter-spacing: 2px; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { color: #666; }
        .detail-value { font-weight: bold; }
        .total-row { font-size: 18px; margin-top: 15px; padding-top: 15px; border-top: 2px solid #d4af37; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .button { display: inline-block; background: #d4af37; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍽️ POP Habachi</h1>
            <p>Booking Confirmation</p>
        </div>
        <div class="content">
            <p>Dear ${booking.contact_name || booking.contactName},</p>
            <p>Thank you for booking with POP Habachi! Your hibachi experience is confirmed.</p>
            
            <div class="confirmation-box">
                <p style="margin: 0; color: #666;">Confirmation Number</p>
                <p class="confirmation-number">${booking.confirmation_number || booking.confirmationNumber}</p>
            </div>
            
            <div class="confirmation-box">
                <h3 style="margin-top: 0;">Event Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${formatDate(booking.event_date || booking.eventDate)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time</span>
                    <span class="detail-value">${booking.event_time || booking.eventTime}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Location</span>
                    <span class="detail-value">${booking.city}, ${booking.service_state || booking.serviceState}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Package</span>
                    <span class="detail-value">${(booking.package || 'signature').charAt(0).toUpperCase() + (booking.package || 'signature').slice(1)}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Guests</span>
                    <span class="detail-value">${booking.num_adults || booking.numAdults} Adults, ${booking.num_children || booking.numChildren || 0} Children</span>
                </div>
                <div class="detail-row total-row">
                    <span class="detail-label">Total</span>
                    <span class="detail-value">${formatCurrency(booking.total)}</span>
                </div>
            </div>
            
            ${booking.status === 'pending_payment' ? `
            <div class="confirmation-box" style="background: #fff3cd;">
                <h3 style="margin-top: 0; color: #856404;">⚠️ Payment Required</h3>
                <p>Your booking will be confirmed once payment is received.</p>
                <a href="${SITE_URL}/pages/confirmation.html?id=${booking.id}" class="button">Complete Payment</a>
            </div>
            ` : ''}
            
            <p><strong>What's Next?</strong></p>
            <ul>
                <li>Our chef will contact you 48 hours before your event</li>
                <li>Ensure your cooking area is clean and accessible</li>
                <li>Have any last-minute dietary requirements? Reply to this email</li>
            </ul>
            
            <p>Questions? Contact us at <a href="mailto:${EMAIL_FROM}">${EMAIL_FROM}</a></p>
        </div>
        <div class="footer">
            <p>POP Habachi - Premium At-Home Hibachi Experience</p>
            <p><a href="${SITE_URL}">pophabachi.com</a></p>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({
        to: booking.contact_email || booking.contactEmail,
        subject: `Booking Confirmed: ${booking.confirmation_number || booking.confirmationNumber} - POP Habachi`,
        html
    });
}

/**
 * Send new booking alert to admin
 */
export async function sendAdminBookingAlert(booking) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .badge { display: inline-block; padding: 5px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .badge-new { background: #27ae60; color: white; }
        .badge-pending { background: #f39c12; color: white; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        td:first-child { font-weight: bold; width: 40%; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>📋 New Booking Received</h2>
            <span class="badge ${booking.status === 'pending_payment' ? 'badge-pending' : 'badge-new'}">
                ${booking.status === 'pending_payment' ? 'PENDING PAYMENT' : 'CONFIRMED'}
            </span>
        </div>
        <div class="content">
            <h3>Confirmation: ${booking.confirmation_number || booking.confirmationNumber}</h3>
            
            <table>
                <tr><td>Customer</td><td>${booking.contact_name || booking.contactName}</td></tr>
                <tr><td>Email</td><td>${booking.contact_email || booking.contactEmail}</td></tr>
                <tr><td>Phone</td><td>${booking.contact_phone || booking.contactPhone}</td></tr>
                <tr><td>Date</td><td>${formatDate(booking.event_date || booking.eventDate)} at ${booking.event_time || booking.eventTime}</td></tr>
                <tr><td>Location</td><td>${booking.city}, ${booking.service_state || booking.serviceState}</td></tr>
                <tr><td>Package</td><td>${booking.package}</td></tr>
                <tr><td>Guests</td><td>${booking.num_adults || booking.numAdults} Adults, ${booking.num_children || booking.numChildren || 0} Children</td></tr>
                <tr><td>Total</td><td><strong>${formatCurrency(booking.total)}</strong></td></tr>
                ${(booking.dietary_notes || booking.dietaryNotes) ? `<tr><td>Dietary Notes</td><td>${booking.dietary_notes || booking.dietaryNotes}</td></tr>` : ''}
                ${(booking.special_requests || booking.specialRequests) ? `<tr><td>Special Requests</td><td>${booking.special_requests || booking.specialRequests}</td></tr>` : ''}
            </table>
            
            <p><a href="${SITE_URL}/pages/admin/dashboard.html">View in Admin Dashboard →</a></p>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({
        to: EMAIL_ADMIN,
        subject: `🔔 New Booking: ${booking.confirmation_number || booking.confirmationNumber} - ${formatCurrency(booking.total)}`,
        html
    });
}

/**
 * Send payment receipt to customer
 */
export async function sendPaymentReceipt(booking, payment) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #27ae60, #2ecc71); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .receipt-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .amount { font-size: 32px; font-weight: bold; color: #27ae60; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Payment Received</h1>
            <p>Thank you for your payment!</p>
        </div>
        <div class="content">
            <p>Dear ${booking.contact_name || booking.contactName},</p>
            <p>We've received your payment for your upcoming hibachi experience.</p>
            
            <div class="receipt-box">
                <p style="color: #666; margin: 0;">Amount Paid</p>
                <p class="amount">${formatCurrency(payment.amount / 100)}</p>
                <div class="detail-row">
                    <span>Payment ID</span>
                    <span>${payment.payment_intent_id || payment.paymentIntentId}</span>
                </div>
                <div class="detail-row">
                    <span>Date</span>
                    <span>${new Date().toLocaleDateString('en-US')}</span>
                </div>
                <div class="detail-row">
                    <span>Booking</span>
                    <span>${booking.confirmation_number || booking.confirmationNumber}</span>
                </div>
            </div>
            
            <p>Your booking is now fully confirmed. We look forward to serving you!</p>
            <p>Questions? Reply to this email or call us anytime.</p>
        </div>
        <div class="footer">
            <p>POP Habachi - Premium At-Home Hibachi Experience</p>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({
        to: booking.contact_email || booking.contactEmail,
        subject: `Payment Receipt - ${booking.confirmation_number || booking.confirmationNumber} - POP Habachi`,
        html
    });
}

/**
 * Send contact inquiry notification to admin
 */
export async function sendContactInquiryAlert(inquiry) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3498db; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        td { padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; }
        td:first-child { font-weight: bold; width: 30%; color: #666; }
        .message-box { background: #f9f9f9; padding: 15px; border-left: 4px solid #3498db; margin: 20px 0; }
        .reply-button { display: inline-block; background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>📩 New Contact Inquiry</h2>
        </div>
        <div class="content">
            <table>
                <tr><td>From</td><td>${inquiry.name}</td></tr>
                <tr><td>Email</td><td><a href="mailto:${inquiry.email}">${inquiry.email}</a></td></tr>
                <tr><td>Phone</td><td>${inquiry.phone || 'Not provided'}</td></tr>
                <tr><td>Reason</td><td>${inquiry.reason || 'General inquiry'}</td></tr>
                <tr><td>Subject</td><td>${inquiry.subject || 'No subject'}</td></tr>
            </table>
            
            <div class="message-box">
                <strong>Message:</strong>
                <p>${inquiry.message}</p>
            </div>
            
            <p>
                <a href="mailto:${inquiry.email}?subject=Re: ${encodeURIComponent(inquiry.subject || 'Your inquiry to POP Habachi')}" class="reply-button">
                    Reply to Customer
                </a>
            </p>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({
        to: EMAIL_ADMIN,
        subject: `📩 Contact Form: ${inquiry.subject || inquiry.reason || 'General Inquiry'} - from ${inquiry.name}`,
        html
    });
}

/**
 * Send auto-reply to customer who submitted contact form
 */
export async function sendContactAutoReply(inquiry) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #d4af37, #c9a227); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🍽️ POP Habachi</h1>
            <p>We've Received Your Message</p>
        </div>
        <div class="content">
            <p>Hi ${inquiry.name},</p>
            <p>Thank you for reaching out to POP Habachi! We've received your message and will respond within <strong>2 hours</strong> during business hours.</p>
            
            <p><strong>Your inquiry:</strong></p>
            <blockquote style="background: white; padding: 15px; border-left: 4px solid #d4af37; margin: 20px 0;">
                ${inquiry.message.substring(0, 200)}${inquiry.message.length > 200 ? '...' : ''}
            </blockquote>
            
            <p><strong>Need immediate assistance?</strong></p>
            <ul>
                <li>📞 Call: (555) 123-4567</li>
                <li>💬 SMS: (555) 123-4567</li>
            </ul>
            
            <p>Best regards,<br>The POP Habachi Team</p>
        </div>
        <div class="footer">
            <p><a href="${SITE_URL}">pophabachi.com</a></p>
        </div>
    </div>
</body>
</html>
    `;

    return sendEmail({
        to: inquiry.email,
        subject: `We've Received Your Message - POP Habachi`,
        html
    });
}

// Export configuration status
export const isEmailConfigured = () => isConfigured;
