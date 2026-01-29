// ============================================
// BUSINESS CONSTANTS
// ============================================

const PACKAGE_PRICING = {
  essential: { price: 65, childPrice: 43 },
  signature: { price: 75, childPrice: 50 },
  premium: { price: 95, childPrice: 63 }
};

// Business rules
const BUSINESS_RULES = {
  MINIMUM_SPEND: 150,           // $150 minimum order
  MIN_ADULTS: 2,                // Minimum 2 adults required
  MAX_ADULTS: 50,               // Maximum 50 adults
  MAX_CHILDREN: 30,             // Maximum 30 children
  MAX_TOTAL_GUESTS: 60,         // Maximum total guests
  MIN_DAYS_ADVANCE: 3,          // Minimum 3 days in advance
  MAX_DAYS_ADVANCE: 365         // Maximum 1 year in advance
};

// Input length limits
const LENGTH_LIMITS = {
  NAME: 100,
  EMAIL: 254,
  PHONE: 20,
  MESSAGE: 2000,
  ADDRESS: 500,
  CITY: 100,
  SPECIAL_REQUESTS: 1000,
  DIETARY_NOTES: 500
};

// Disposable email domains to block
const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'throwaway.com', 'guerrillamail.com', 'mailinator.com',
  '10minutemail.com', 'temp-mail.org', 'fakeinbox.com', 'trashmail.com',
  'yopmail.com', 'sharklasers.com', 'getnada.com', 'maildrop.cc'
];

// ============================================
// SANITIZATION UTILITIES
// ============================================

/**
 * Comprehensive XSS sanitization
 * Removes dangerous HTML/JS patterns while preserving safe text
 */
export function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  
  let sanitized = input
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove other dangerous tags
    .replace(/<(iframe|object|embed|link|style|meta|base|form|input|button|textarea|select)[^>]*>.*?<\/\1>/gi, '')
    .replace(/<(iframe|object|embed|link|style|meta|base|form|input|button|textarea|select)[^>]*\/?>/gi, '')
    // Remove event handlers
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: and data: protocols
    .replace(/javascript\s*:/gi, '')
    .replace(/data\s*:\s*text\/html/gi, '')
    .replace(/vbscript\s*:/gi, '')
    // Remove expression() for CSS injection
    .replace(/expression\s*\(/gi, '')
    // Encode remaining angle brackets
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Trim whitespace
    .trim();
  
  // Enforce length limit
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Sanitize and validate name (letters, spaces, hyphens, apostrophes only)
 */
export function sanitizeName(name) {
  if (typeof name !== 'string') return '';
  // Allow letters, spaces, hyphens, apostrophes, periods
  return name.replace(/[^a-zA-Z\s\-'.]/g, '').trim().substring(0, LENGTH_LIMITS.NAME);
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate email format and domain
 * Returns { valid: boolean, error?: string }
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmedEmail = email.trim().toLowerCase();
  
  // Check length
  if (trimmedEmail.length > LENGTH_LIMITS.EMAIL) {
    return { valid: false, error: 'Email is too long' };
  }

  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  
  if (!emailRegex.test(trimmedEmail)) {
    return { valid: false, error: 'Invalid email format' };
  }

  // Check for disposable email domains
  const domain = trimmedEmail.split('@')[1];
  if (DISPOSABLE_EMAIL_DOMAINS.includes(domain)) {
    return { valid: false, error: 'Please use a permanent email address' };
  }

  return { valid: true };
}

/**
 * Validate phone number format
 * Accepts various formats: (555) 123-4567, 555-123-4567, 5551234567, +1-555-123-4567
 * Returns { valid: boolean, normalized?: string, error?: string }
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  // Remove all non-digit characters except leading +
  const hasPlus = phone.trim().startsWith('+');
  const digits = phone.replace(/\D/g, '');
  
  // Check length (US numbers: 10 digits, international: 10-15)
  if (digits.length < 10) {
    return { valid: false, error: 'Phone number must have at least 10 digits' };
  }
  
  if (digits.length > 15) {
    return { valid: false, error: 'Phone number is too long' };
  }

  // Normalize to standard format
  let normalized;
  if (digits.length === 10) {
    // US format: (555) 123-4567
    normalized = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // US with country code: +1 (555) 123-4567
    normalized = `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else {
    // International format
    normalized = hasPlus ? `+${digits}` : digits;
  }

  return { valid: true, normalized };
}

/**
 * Validate event date is in acceptable range
 * Returns { valid: boolean, error?: string, daysUntil?: number }
 */
export function validateEventDate(dateString) {
  if (!dateString) {
    return { valid: false, error: 'Event date is required' };
  }

  const eventDate = new Date(dateString);
  if (isNaN(eventDate.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntil < BUSINESS_RULES.MIN_DAYS_ADVANCE) {
    return { 
      valid: false, 
      error: `Events must be booked at least ${BUSINESS_RULES.MIN_DAYS_ADVANCE} days in advance`,
      daysUntil
    };
  }

  if (daysUntil > BUSINESS_RULES.MAX_DAYS_ADVANCE) {
    return { 
      valid: false, 
      error: `Events can only be booked up to ${BUSINESS_RULES.MAX_DAYS_ADVANCE} days in advance`,
      daysUntil
    };
  }

  return { valid: true, daysUntil };
}

/**
 * Validate guest counts
 * Returns { valid: boolean, errors: string[] }
 */
export function validateGuestCount(numAdults, numChildren) {
  const errors = [];
  const adults = Number(numAdults) || 0;
  const children = Number(numChildren) || 0;
  const total = adults + children;

  if (adults < BUSINESS_RULES.MIN_ADULTS) {
    errors.push(`Minimum ${BUSINESS_RULES.MIN_ADULTS} adults required`);
  }

  if (adults > BUSINESS_RULES.MAX_ADULTS) {
    errors.push(`Maximum ${BUSINESS_RULES.MAX_ADULTS} adults allowed`);
  }

  if (children > BUSINESS_RULES.MAX_CHILDREN) {
    errors.push(`Maximum ${BUSINESS_RULES.MAX_CHILDREN} children allowed`);
  }

  if (total > BUSINESS_RULES.MAX_TOTAL_GUESTS) {
    errors.push(`Maximum ${BUSINESS_RULES.MAX_TOTAL_GUESTS} total guests allowed`);
  }

  return { valid: errors.length === 0, errors };
}

// ============================================
// MAIN BOOKING VALIDATION
// ============================================

export function validateBookingPayload(payload = {}) {
  const errors = [];
  const data = payload;

  // Required field checks
  if (!data.serviceState) errors.push('serviceState is required');
  if (!data.city) errors.push('city is required');
  if (!data.eventDate) errors.push('eventDate is required');
  if (!data.eventTime) errors.push('eventTime is required');
  if (!data.contactName) errors.push('contactName is required');
  if (!data.contactEmail) errors.push('contactEmail is required');
  if (!data.contactPhone) errors.push('contactPhone is required');
  if (!data.agreeToTerms) errors.push('agreeToTerms must be true');

  // Package validation
  const packageKey = data.package || 'signature';
  if (!PACKAGE_PRICING[packageKey]) errors.push('package is invalid');

  // Email validation
  if (data.contactEmail) {
    const emailResult = validateEmail(data.contactEmail);
    if (!emailResult.valid) {
      errors.push(emailResult.error);
    }
  }

  // Phone validation
  if (data.contactPhone) {
    const phoneResult = validatePhone(data.contactPhone);
    if (!phoneResult.valid) {
      errors.push(phoneResult.error);
    }
  }

  // Event date validation
  if (data.eventDate) {
    const dateResult = validateEventDate(data.eventDate);
    if (!dateResult.valid) {
      errors.push(dateResult.error);
    }
  }

  // Guest count validation
  const guestResult = validateGuestCount(data.numAdults, data.numChildren);
  if (!guestResult.valid) {
    errors.push(...guestResult.errors);
  }

  // Length validations
  if (data.contactName && data.contactName.length > LENGTH_LIMITS.NAME) {
    errors.push(`Contact name must be ${LENGTH_LIMITS.NAME} characters or less`);
  }

  if (data.city && data.city.length > LENGTH_LIMITS.CITY) {
    errors.push(`City must be ${LENGTH_LIMITS.CITY} characters or less`);
  }

  if (data.venueAddress && data.venueAddress.length > LENGTH_LIMITS.ADDRESS) {
    errors.push(`Address must be ${LENGTH_LIMITS.ADDRESS} characters or less`);
  }

  if (data.specialRequests && data.specialRequests.length > LENGTH_LIMITS.SPECIAL_REQUESTS) {
    errors.push(`Special requests must be ${LENGTH_LIMITS.SPECIAL_REQUESTS} characters or less`);
  }

  if (data.dietaryNotes && data.dietaryNotes.length > LENGTH_LIMITS.DIETARY_NOTES) {
    errors.push(`Dietary notes must be ${LENGTH_LIMITS.DIETARY_NOTES} characters or less`);
  }

  // Calculate totals and validate minimum spend
  if (errors.length === 0) {
    const totals = calculateTotals(data);
    if (totals.subtotal < BUSINESS_RULES.MINIMUM_SPEND) {
      errors.push(`Minimum order is $${BUSINESS_RULES.MINIMUM_SPEND}. Current subtotal: $${totals.subtotal}`);
    }
  }

  return errors;
}

// ============================================
// CONTACT FORM VALIDATION
// ============================================

export function validateContactPayload(payload = {}) {
  const errors = [];
  const { name, email, phone, message } = payload;

  // Required fields
  if (!name || !name.trim()) {
    errors.push('Name is required');
  } else if (name.length > LENGTH_LIMITS.NAME) {
    errors.push(`Name must be ${LENGTH_LIMITS.NAME} characters or less`);
  }

  if (!email) {
    errors.push('Email is required');
  } else {
    const emailResult = validateEmail(email);
    if (!emailResult.valid) {
      errors.push(emailResult.error);
    }
  }

  if (!message || !message.trim()) {
    errors.push('Message is required');
  } else if (message.length > LENGTH_LIMITS.MESSAGE) {
    errors.push(`Message must be ${LENGTH_LIMITS.MESSAGE} characters or less`);
  }

  // Optional phone validation
  if (phone) {
    const phoneResult = validatePhone(phone);
    if (!phoneResult.valid) {
      errors.push(phoneResult.error);
    }
  }

  return errors;
}

// ============================================
// TOTALS CALCULATION
// ============================================

export function calculateTotals(payload = {}) {
  const packageKey = payload.package || 'signature';
  const pricing = PACKAGE_PRICING[packageKey] || PACKAGE_PRICING.signature;
  const adults = Number(payload.numAdults || 0);
  const children = Number(payload.numChildren || 0);
  const base = adults * pricing.price + children * pricing.childPrice;
  const addonsTotal = Number(payload.addonsTotal || 0);
  const travelFeeAmount = payload.travelFeeStatus === 'included' ? 0 : Number(payload.travelFeeAmount || 0);
  const subtotal = base + addonsTotal;
  const total = payload.travelFeeStatus === 'tbd' ? subtotal : subtotal + travelFeeAmount;

  return { base, addonsTotal, subtotal, total };
}

// Export constants for use in other modules
export { PACKAGE_PRICING, BUSINESS_RULES, LENGTH_LIMITS };
