/**
 * Structured Logging Service
 * 
 * Uses Winston for comprehensive logging with:
 * - Console output with colors (development)
 * - JSON format (production, for Cloud Logging)
 * - Log levels: error, warn, info, http, debug
 * - Request metadata capture
 * - Error stack traces
 */

import winston from 'winston';

const { format, createLogger, transports } = winston;

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

// Custom format for development (human-readable)
const devFormat = format.combine(
    format.timestamp({ format: 'HH:mm:ss' }),
    format.colorize({ all: true }),
    format.printf(({ timestamp, level, message, ...meta }) => {
        let metaStr = '';
        if (Object.keys(meta).length > 0) {
            metaStr = ' ' + JSON.stringify(meta, null, 0);
        }
        return `[${timestamp}] ${level}: ${message}${metaStr}`;
    })
);

// Custom format for production (JSON for Cloud Logging)
const prodFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
);

// Create logger instance
const logger = createLogger({
    level: isProduction ? 'info' : 'debug',
    format: isProduction ? prodFormat : devFormat,
    defaultMeta: { service: 'chefweb-backend' },
    transports: [
        new transports.Console()
    ],
    // Don't exit on error
    exitOnError: false
});

// =============================================================================
// HELPER METHODS
// =============================================================================

/**
 * Log an error with optional context
 * @param {string} message - Error message
 * @param {object} context - Additional context (error object, request info, etc.)
 */
logger.logError = (message, context = {}) => {
    // Extract error details if an Error object is passed
    if (context.error instanceof Error) {
        context = {
            ...context,
            errorMessage: context.error.message,
            errorStack: context.error.stack,
            errorName: context.error.name
        };
        delete context.error;
    }
    logger.error(message, context);
};

/**
 * Log a warning with context
 * @param {string} message - Warning message
 * @param {object} context - Additional context
 */
logger.logWarn = (message, context = {}) => {
    logger.warn(message, context);
};

/**
 * Log info with context
 * @param {string} message - Info message
 * @param {object} context - Additional context
 */
logger.logInfo = (message, context = {}) => {
    logger.info(message, context);
};

/**
 * Log HTTP request (for morgan replacement)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {number} duration - Request duration in ms
 */
logger.logRequest = (req, res, duration) => {
    logger.http('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.headers['x-forwarded-for'],
        userAgent: req.headers['user-agent']
    });
};

/**
 * Log booking-related events
 * @param {string} action - Action performed (created, modified, cancelled, etc.)
 * @param {object} booking - Booking data
 */
logger.logBooking = (action, booking = {}) => {
    logger.info(`Booking ${action}`, {
        action,
        confirmationNumber: booking.confirmation_number || booking.confirmationNumber,
        bookingId: booking.id,
        email: booking.contact_email || booking.contactEmail,
        eventDate: booking.event_date || booking.eventDate
    });
};

/**
 * Log payment-related events
 * @param {string} action - Action performed (initiated, completed, failed, etc.)
 * @param {object} payment - Payment data
 */
logger.logPayment = (action, payment = {}) => {
    logger.info(`Payment ${action}`, {
        action,
        paymentIntentId: payment.paymentIntentId,
        amount: payment.amount,
        status: payment.status,
        bookingId: payment.bookingId
    });
};

/**
 * Log email-related events
 * @param {string} type - Email type (confirmation, cancellation, etc.)
 * @param {string} recipient - Email recipient
 * @param {boolean} success - Whether email was sent successfully
 */
logger.logEmail = (type, recipient, success = true) => {
    const level = success ? 'info' : 'warn';
    logger[level](`Email ${success ? 'sent' : 'failed'}`, {
        type,
        recipient,
        success
    });
};

/**
 * Log admin actions
 * @param {string} action - Admin action performed
 * @param {object} context - Additional context
 */
logger.logAdmin = (action, context = {}) => {
    logger.info(`Admin action: ${action}`, {
        action,
        ...context
    });
};

/**
 * Log chatbot interactions
 * @param {string} message - User message
 * @param {string} intent - Detected intent
 * @param {number} confidence - Confidence score
 */
logger.logChatbot = (message, intent, confidence) => {
    logger.debug('Chatbot interaction', {
        messagePreview: message.substring(0, 50),
        intent,
        confidence
    });
};

/**
 * Log rate limit hits
 * @param {string} endpoint - Rate limited endpoint
 * @param {string} ip - Client IP
 */
logger.logRateLimit = (endpoint, ip) => {
    logger.warn('Rate limit exceeded', {
        endpoint,
        ip
    });
};

// =============================================================================
// MORGAN STREAM (for HTTP logging)
// =============================================================================

logger.stream = {
    write: (message) => {
        // Remove trailing newline from morgan
        logger.http(message.trim());
    }
};

export default logger;
