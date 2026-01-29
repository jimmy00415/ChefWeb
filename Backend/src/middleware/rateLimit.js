/**
 * Rate Limiting Middleware Configuration
 * Protects API endpoints from abuse, brute force attacks, and spam
 * 
 * Strategy:
 * - Global: Prevents general API abuse
 * - Booking: Limits booking creation to prevent spam
 * - Contact: Limits contact form submissions
 * - Admin Login: Prevents brute force attacks on admin panel
 * - Chatbot: Prevents chatbot abuse while allowing reasonable usage
 */

import rateLimit from 'express-rate-limit';

/**
 * Custom key generator for rate limiting
 * Uses X-Forwarded-For header in production (behind Cloud Run proxy)
 * Falls back to req.ip for local development
 */
const getClientIp = (req) => {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs; the first is the client
    return forwardedFor.split(',')[0].trim();
  }
  return req.ip;
};

/**
 * Standard rate limit response handler
 * Returns consistent JSON error format with retry information
 */
const standardHandler = (req, res, next, options) => {
  res.status(429).json({
    error: 'Too many requests',
    message: options.message || 'Please wait before making more requests.',
    retryAfter: Math.ceil(options.windowMs / 1000 / 60), // minutes
    limit: options.max,
    endpoint: req.path
  });
};

/**
 * Skip rate limiting for specific conditions
 * - Health checks should never be rate limited
 * - OPTIONS preflight requests should be allowed
 */
const shouldSkip = (req) => {
  return req.path === '/health' || req.method === 'OPTIONS';
};

// =============================================================================
// Rate Limit Configurations
// =============================================================================

/**
 * Global Rate Limiter
 * Applied to all API requests
 * 100 requests per 15 minutes per IP
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP. Please try again in a few minutes.',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,  // Disable X-RateLimit-* headers
  keyGenerator: getClientIp,
  handler: standardHandler,
  skip: shouldSkip
});

/**
 * Booking Rate Limiter
 * Applied to POST /api/bookings (new booking creation)
 * 10 booking attempts per hour per IP
 * Prevents spam bookings while allowing legitimate users
 */
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'You have made too many booking attempts. Please try again in an hour.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: standardHandler
});

/**
 * Contact Form Rate Limiter
 * Applied to POST /api/contact
 * 5 contact submissions per hour per IP
 * Prevents contact form spam
 */
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'You have submitted too many contact requests. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: standardHandler
});

/**
 * Admin Login Rate Limiter
 * Applied to POST /api/admin/login
 * 5 login attempts per 15 minutes per IP
 * Prevents brute force attacks on admin credentials
 */
export const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: standardHandler
});

/**
 * Chatbot Rate Limiter
 * Applied to POST /api/chatbot/message
 * 30 messages per 15 minutes per IP
 * Allows reasonable chatbot usage while preventing abuse
 */
export const chatbotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: 'Slow down! Please wait a moment before sending more messages.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: standardHandler
});

/**
 * Booking Lookup Rate Limiter
 * Applied to GET /api/bookings/lookup
 * 20 lookups per 15 minutes per IP
 * Prevents enumeration attacks while allowing legitimate lookups
 */
export const lookupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: 'Too many lookup attempts. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: standardHandler
});

/**
 * Booking Modification/Cancellation Rate Limiter
 * Applied to PATCH /api/bookings/:id/modify and POST /api/bookings/:id/cancel
 * 10 actions per hour per IP
 * Prevents abuse of modification endpoints
 */
export const modifyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many booking changes. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  handler: standardHandler
});

// Export all limiters as a convenience object
export default {
  global: globalLimiter,
  booking: bookingLimiter,
  contact: contactLimiter,
  adminLogin: adminLoginLimiter,
  chatbot: chatbotLimiter,
  lookup: lookupLimiter,
  modify: modifyLimiter
};
