# ChefWeb Development Plan - Business Functions

## Executive Summary

This document outlines the development plan for completing ChefWeb's business-critical features. Each feature requires **both backend API and frontend UI** implementation.

**Current State:** Booking flow works, payments integrated (pending keys), analytics ready  
**Target State:** Full business operation capability with email, admin, and self-service

---

## Priority Matrix

| Phase | Features | Time | Business Value |
|-------|----------|------|----------------|
| **Phase 1** | Email + Contact + Admin | 8-12 hrs | 🔴 Can't operate without |
| **Phase 2** | Booking Lookup + Modify | 4-6 hrs | 🟠 Customer self-service |
| **Phase 3** | Rate Limit + Chatbot | 4-6 hrs | 🟡 Security & UX |
| **Phase 4** | Calendar + Logging | 3-4 hrs | 🟢 Nice to have |

---

## Phase 1: Launch Critical (MUST HAVE)

### 1.1 📧 Email Notifications (SendGrid)

**Why Critical:** Customer receives nothing after booking. Admin has no alerts.

#### Backend Development

| File | Task | Details |
|------|------|---------|
| `package.json` | Add dependency | `npm install @sendgrid/mail` |
| `src/services/email.js` | **NEW FILE** | Email service wrapper |
| `src/templates/` | **NEW FOLDER** | HTML email templates |
| `src/routes/bookings.js` | Modify | Call email service after booking creation |
| `src/routes/payments.js` | Modify | Send receipt after payment success |

**Email Types Needed:**
```
1. booking-confirmation.html    → Customer: "Booking received!"
2. booking-admin-alert.html     → Admin: "New booking CHF-XXXX"
3. payment-receipt.html         → Customer: "Payment confirmed"
4. booking-reminder.html        → Customer: 24h before event
5. contact-inquiry.html         → Admin: "New contact form submission"
```

**API Endpoints:**
```
POST /api/email/send           → Internal: Send templated email
POST /api/email/test           → Dev: Test email delivery
```

**Environment Variables:**
```
SENDGRID_API_KEY=SG.xxxx
EMAIL_FROM=book@pophabachi.com
EMAIL_ADMIN=admin@pophabachi.com
```

#### Frontend Development

| File | Task | Details |
|------|------|---------|
| None | N/A | Email is backend-only (transparent to user) |

**Effort:** Backend 3h, Frontend 0h = **3 hours**

---

### 1.2 📬 Contact Form Handler

**Why Critical:** Contact form currently logs to console. Inquiries are lost.

#### Backend Development

| File | Task | Details |
|------|------|---------|
| `src/routes/contact.js` | **NEW FILE** | Contact form API |
| `src/db/schema.sql` | Modify | Add `contact_inquiries` table |
| `src/index.js` | Modify | Register contact router |

**Database Schema:**
```sql
CREATE TABLE contact_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    reason VARCHAR(50),
    subject VARCHAR(200),
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'new',  -- new, replied, closed
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**API Endpoints:**
```
POST /api/contact              → Submit contact form
GET  /api/contact              → Admin: List all inquiries
PATCH /api/contact/:id/status  → Admin: Update status
```

#### Frontend Development

| File | Task | Details |
|------|------|---------|
| `docs/js/contact.js` | Modify | Call API instead of console.log |

**Current Code (line 57):**
```javascript
console.log('Contact form submission:', formData);
```

**New Code:**
```javascript
const response = await apiRequest('/api/contact', {
    method: 'POST',
    body: JSON.stringify(formData)
});
```

**Effort:** Backend 1.5h, Frontend 0.5h = **2 hours**

---

### 1.3 👤 Admin Dashboard

**Why Critical:** No way to view/manage bookings without database access.

#### Backend Development

| File | Task | Details |
|------|------|---------|
| `src/routes/admin.js` | **NEW FILE** | Admin API endpoints |
| `src/middleware/auth.js` | **NEW FILE** | Simple API key auth |
| `src/index.js` | Modify | Register admin router |

**Authentication Strategy (Simple):**
- Single admin API key in environment variable
- No user management needed for MVP
- Frontend stores key in localStorage after login

**API Endpoints:**
```
POST /api/admin/login          → Validate API key, return session token
GET  /api/admin/bookings       → List all bookings with filters
GET  /api/admin/bookings/:id   → Get booking details
PATCH /api/admin/bookings/:id  → Update booking status
GET  /api/admin/payments       → List all payments
GET  /api/admin/contacts       → List contact inquiries
GET  /api/admin/stats          → Dashboard summary stats
```

**Environment Variables:**
```
ADMIN_API_KEY=your-secure-random-key
```

#### Frontend Development

| File | Task | Details |
|------|------|---------|
| `docs/pages/admin/` | **NEW FOLDER** | Admin pages |
| `docs/pages/admin/login.html` | **NEW FILE** | Login page |
| `docs/pages/admin/dashboard.html` | **NEW FILE** | Main dashboard |
| `docs/pages/admin/bookings.html` | **NEW FILE** | Bookings list |
| `docs/pages/admin/booking-detail.html` | **NEW FILE** | Single booking view |
| `docs/js/admin.js` | **NEW FILE** | Admin JavaScript |
| `docs/css/admin.css` | **NEW FILE** | Admin styles |

**Dashboard Features:**
```
┌─────────────────────────────────────────────────────────────┐
│  ADMIN DASHBOARD                              [Logout]      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Today's  │  │ Pending  │  │ This     │  │ Contact  │    │
│  │ Events   │  │ Payments │  │ Month $  │  │ Inquiries│    │
│  │    3     │  │    5     │  │  $4,250  │  │    2     │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
├─────────────────────────────────────────────────────────────┤
│  RECENT BOOKINGS                           [View All →]     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CHF-ABC123 │ John Doe │ Jan 30 │ Confirmed │ $750   │   │
│  │ CHF-XYZ789 │ Jane Doe │ Feb 1  │ Pending   │ $500   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Effort:** Backend 3h, Frontend 5h = **8 hours**

---

## Phase 2: Customer Self-Service

### 2.1 🔍 Booking Lookup by Confirmation Number

**Why Important:** Customer wants to check their booking status.

#### Backend Development

| File | Task | Details |
|------|------|---------|
| `src/routes/bookings.js` | Modify | Add lookup endpoint |

**API Endpoint:**
```
GET /api/bookings/lookup?confirmation=CHF-ABC123&email=john@example.com
```

**Security:** Requires both confirmation number AND email to prevent enumeration.

#### Frontend Development

| File | Task | Details |
|------|------|---------|
| `docs/pages/booking-lookup.html` | **NEW FILE** | Lookup page |
| `docs/js/booking-lookup.js` | **NEW FILE** | Lookup logic |

**UI Flow:**
```
┌─────────────────────────────────────────┐
│  Check Your Booking Status              │
│                                         │
│  Confirmation #: [CHF-______]           │
│  Email:          [__________]           │
│                                         │
│  [Find My Booking]                      │
└─────────────────────────────────────────┘
         ↓ (after lookup)
┌─────────────────────────────────────────┐
│  Booking CHF-ABC123                     │
│  ────────────────────                   │
│  Status: ✅ Confirmed                   │
│  Date: January 30, 2026 at 6:00 PM      │
│  Package: Signature                     │
│  Guests: 10 Adults, 2 Children          │
│  Total: $900                            │
│                                         │
│  [Modify Booking] [Cancel Booking]      │
└─────────────────────────────────────────┘
```

**Effort:** Backend 0.5h, Frontend 2h = **2.5 hours**

---

### 2.2 ❌ Cancel/Modify Booking

**Why Important:** Customer needs to change date or cancel without calling.

#### Backend Development

| File | Task | Details |
|------|------|---------|
| `src/routes/bookings.js` | Modify | Add modify/cancel endpoints |

**API Endpoints:**
```
PATCH /api/bookings/:id/modify   → Update allowed fields
POST  /api/bookings/:id/cancel   → Cancel with reason
```

**Cancellation Policy Logic:**
```javascript
// > 7 days: Full refund
// 3-7 days: 50% refund
// < 3 days: No refund
function calculateRefund(eventDate, totalPaid) {
    const daysUntil = daysBetween(new Date(), eventDate);
    if (daysUntil > 7) return totalPaid;
    if (daysUntil >= 3) return totalPaid * 0.5;
    return 0;
}
```

#### Frontend Development

| File | Task | Details |
|------|------|---------|
| `docs/pages/booking-modify.html` | **NEW FILE** | Modify form |
| `docs/pages/booking-cancel.html` | **NEW FILE** | Cancel confirmation |
| `docs/js/booking-manage.js` | **NEW FILE** | Manage logic |

**Effort:** Backend 1.5h, Frontend 2h = **3.5 hours**

---

## Phase 3: Security & UX Enhancement

### 3.1 🛡️ Rate Limiting

**Why Important:** Prevent API abuse, brute force, spam submissions.

#### Backend Development

| File | Task | Details |
|------|------|---------|
| `package.json` | Add dependency | `npm install express-rate-limit` |
| `src/middleware/rateLimit.js` | **NEW FILE** | Rate limit config |
| `src/index.js` | Modify | Apply rate limiting |

**Rate Limit Rules:**
```javascript
const limits = {
    global: { windowMs: 15 * 60 * 1000, max: 100 },     // 100 req/15min
    booking: { windowMs: 60 * 60 * 1000, max: 10 },     // 10 bookings/hour
    contact: { windowMs: 60 * 60 * 1000, max: 5 },      // 5 contacts/hour
    adminLogin: { windowMs: 15 * 60 * 1000, max: 5 }    // 5 login attempts
};
```

#### Frontend Development

| File | Task | Details |
|------|------|---------|
| Various | Modify | Handle 429 (Too Many Requests) gracefully |

**Effort:** Backend 1h, Frontend 0.5h = **1.5 hours**

---

### 3.2 🤖 AI Chatbot Enhancement

**Why Important:** Current chatbot only has 3 canned responses.

#### Backend Development

| File | Task | Details |
|------|------|---------|
| `src/routes/chatbot.js` | Modify | Expand intent matching |
| `src/services/chatbot.js` | **NEW FILE** | Intent classification |
| `src/data/chatbot-responses.json` | **NEW FILE** | Response templates |

**Intent Categories:**
```
- pricing_inquiry     → Package prices, minimum spend
- availability        → Service areas, dates
- booking_help        → How to book, payment options
- dietary_questions   → Allergies, special diets
- cancellation        → Policy, how to cancel
- contact_human       → Connect to support
- general_greeting    → Hello, thanks, etc.
```

**Optional: OpenAI Integration**
```javascript
// For complex questions, fallback to GPT-4
if (confidence < 0.5) {
    return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: userMessage }],
        max_tokens: 150
    });
}
```

#### Frontend Development

| File | Task | Details |
|------|------|---------|
| `docs/js/chatbot.js` | **NEW FILE** | Chat widget |
| `docs/css/chatbot.css` | **NEW FILE** | Chat styles |
| All pages | Modify | Include chat widget |

**Chat Widget UI:**
```
┌─────────────────────────────────┐
│ 💬 POP Habachi Assistant        │
├─────────────────────────────────┤
│                                 │
│ Hi! How can I help you today?   │
│                                 │
│         What are your prices? ──┤
│                                 │
│ Our packages start at $65/person│
│ for Essential...                │
│                                 │
├─────────────────────────────────┤
│ [Type a message...]    [Send]   │
└─────────────────────────────────┘
```

**Effort:** Backend 3h, Frontend 2h = **5 hours**

---

## Phase 4: Nice to Have

### 4.1 📅 Calendar Integration

**Why Useful:** Customer can add event to their calendar.

#### Backend Development

| File | Task | Details |
|------|------|---------|
| `src/routes/bookings.js` | Modify | Add iCal generation |

**API Endpoint:**
```
GET /api/bookings/:id/calendar.ics → Download iCal file
```

#### Frontend Development

| File | Task | Details |
|------|------|---------|
| `docs/pages/confirmation.html` | Modify | Add calendar buttons |

**Calendar Buttons:**
```html
<a href="/api/bookings/{id}/calendar.ics">📅 Add to Calendar</a>
<a href="https://calendar.google.com/calendar/render?...">Google Calendar</a>
```

**Effort:** Backend 1h, Frontend 0.5h = **1.5 hours**

---

### 4.2 📊 Error Logging (Cloud Logging)

**Why Useful:** Debug production issues faster.

#### Backend Development

| File | Task | Details |
|------|------|---------|
| `package.json` | Add dependency | `npm install winston` |
| `src/services/logger.js` | **NEW FILE** | Structured logging |
| All routes | Modify | Replace console.log with logger |

**Log Levels:**
```javascript
logger.error('Payment failed', { paymentIntentId, error });
logger.warn('Stale booking detected', { bookingId });
logger.info('Booking created', { confirmationNumber });
logger.debug('Request received', { endpoint, method });
```

#### Frontend Development

| File | Task | Details |
|------|------|---------|
| None | N/A | Backend-only feature |

**Effort:** Backend 2h, Frontend 0h = **2 hours**

---

## Implementation Order

```
Week 1: Phase 1 (Launch Critical)
├── Day 1-2: Email Notifications (3h) ✓
├── Day 2: Contact Form Handler (2h) ✓
└── Day 3-5: Admin Dashboard (8h) ✓

Week 2: Phase 2 (Self-Service)
├── Day 1: Booking Lookup (2.5h) ✓
└── Day 2: Cancel/Modify (3.5h) ✓

Week 3: Phase 3 (Security & UX)
├── Day 1: Rate Limiting (1.5h) ✓
└── Day 2-3: Chatbot Enhancement (5h) ✓

Week 4: Phase 4 (Polish)
├── Day 1: Calendar Integration (1.5h) ✓
└── Day 2: Error Logging (2h) ✓
```

---

## File Creation Summary

### New Backend Files (9 files)
```
Backend/src/
├── services/
│   ├── email.js           → SendGrid wrapper
│   ├── chatbot.js         → Intent classification
│   └── logger.js          → Structured logging
├── middleware/
│   ├── auth.js            → Admin authentication
│   └── rateLimit.js       → Rate limiting config
├── routes/
│   ├── contact.js         → Contact form API
│   └── admin.js           → Admin API
├── templates/
│   ├── booking-confirmation.html
│   ├── payment-receipt.html
│   └── contact-inquiry.html
└── data/
    └── chatbot-responses.json
```

### New Frontend Files (12 files)
```
docs/
├── pages/
│   ├── booking-lookup.html
│   ├── booking-modify.html
│   ├── booking-cancel.html
│   └── admin/
│       ├── login.html
│       ├── dashboard.html
│       ├── bookings.html
│       └── booking-detail.html
├── js/
│   ├── booking-lookup.js
│   ├── booking-manage.js
│   ├── admin.js
│   └── chatbot.js
└── css/
    ├── admin.css
    └── chatbot.css
```

### Modified Files (8 files)
```
Backend/src/
├── index.js               → Register new routes
├── routes/bookings.js     → Lookup, modify, cancel, calendar
├── routes/payments.js     → Email on payment success
├── routes/chatbot.js      → Enhanced responses
└── db/schema.sql          → Add contact_inquiries table

docs/
├── js/contact.js          → Call API
├── pages/confirmation.html → Calendar buttons
└── Various pages          → Chat widget, rate limit handling
```

---

## Total Effort Estimate

| Phase | Backend | Frontend | Total |
|-------|---------|----------|-------|
| Phase 1 | 7.5h | 5.5h | **13h** |
| Phase 2 | 2h | 4h | **6h** |
| Phase 3 | 4h | 2.5h | **6.5h** |
| Phase 4 | 3h | 0.5h | **3.5h** |
| **TOTAL** | **16.5h** | **12.5h** | **29h** |

---

*Created: January 29, 2026*
