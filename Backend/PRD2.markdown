
# PRD: Backend System for ChefWeb (Full-Stack Enablement)

**Document Version:** 1.2  
**Date:** January 21, 2026  
**Project:** POP Habachi Full-Stack Development  
**Scope:** Backend services to support booking, payments, video management, AI chatbot, admin tools, and notifications

---

## 1. Executive Summary

POP Habachi requires a production-grade backend to transform the current static frontend into a fully functional booking platform. This PRD defines the backend architecture, data model, APIs, integrations, security requirements, and operational needs to support:

1. **Owner-managed video hosting** for homepage promotions
2. **AI chatbot** for booking Q&A and booking prefill
3. **Payments** (US market, Stripe) with deposit and full payment options
4. **Booking management** with admin workflows
5. **Notifications** (email/SMS) for customers and staff
6. **Analytics** for conversion and engagement insights

---

## 2. Goals & Success Metrics

### 2.1 Goals
- Provide a secure and scalable backend for bookings, payment processing, and media.
- Enable admin control over content (videos, packages, pricing overrides, service areas).
- Reduce manual coordination by automating notifications and payment status updates.
- Support a conversational AI assistant with domain knowledge and structured responses.

### 2.2 Success Metrics
- Booking completion rate: +25% within 90 days of launch
- Payment success rate: >95%
- Chatbot self-resolution rate: >70%
- Admin time per booking: -50%
- System uptime: 99.9%
- API p95 latency: <300ms for core endpoints

---

## 3. Scope & Non-Goals

### 3.1 In Scope
- REST API for bookings, payments, videos, chatbot, service areas, pricing, add-ons
- Database schema for bookings, customers, payments, videos, chat logs
- Admin authentication & authorization
- Stripe integration (PaymentIntents, webhooks, refunds)
- OpenAI integration for chatbot responses
- File storage for videos and thumbnails (S3-compatible)
- Email/SMS notifications (SendGrid/Twilio)
- Audit logs for admin actions

### 3.2 Out of Scope (Phase 1)
- Full customer accounts/loyalty program
- Mobile apps
- Subscription billing
- Multi-vendor chef marketplace

---

## 4. Architecture Overview

### 4.1 Recommended Tech Stack
- **Backend Runtime**: Node.js (LTS) with Express OR Python FastAPI
- **Database**: PostgreSQL 15+
- **ORM**: Prisma (Node) or SQLAlchemy (Python)
- **Cache**: Redis (session, rate limiting, chatbot context)
- **Storage**: AWS S3 (videos/thumbnails) + CloudFront CDN
- **Payments**: Stripe (US)
- **AI**: OpenAI API (Chat Completions)
- **Email**: SendGrid
- **SMS**: Twilio (optional)
- **Authentication**: JWT + refresh tokens for admins
- **Hosting**: Render/Fly.io/AWS ECS (TBD)
- **Static Frontend**: Served separately (GitHub Pages/Static Hosting)

### 4.2 High-Level System Diagram (Text)

```
Frontend (Static HTML/JS)
	 |  REST API
	 v
Backend API (Express/FastAPI)
	 |-- PostgreSQL (Bookings, Payments, Users)
	 |-- S3 + CDN (Videos)
	 |-- Stripe (Payments + Webhooks)
	 |-- OpenAI (Chatbot)
	 |-- SendGrid/Twilio (Notifications)
```

---

## 5. Core Data Model

### 5.1 Entities

#### 5.1.1 Users (Admin)
```json
{
	"id": "uuid",
	"email": "admin@chefweb.com",
	"passwordHash": "...",
	"role": "admin|staff",
	"createdAt": "timestamp",
	"lastLoginAt": "timestamp"
}
```

#### 5.1.2 Customers
```json
{
	"id": "uuid",
	"name": "John Doe",
	"email": "john@example.com",
	"phone": "+1xxxxxxxxxx",
	"createdAt": "timestamp"
}
```

#### 5.1.3 Bookings
```json
{
	"id": "uuid",
	"confirmationNumber": "CHEF-2026-0001",
	"customerId": "uuid",
	"serviceState": "CA",
	"city": "San Francisco",
	"serviceArea": "bay_area|extended",
	"partyType": "birthday|friendsgiving|business|other",
	"eventDate": "2026-02-15",
	"eventTime": "18:00",
	"numAdults": 12,
	"numChildren": 3,
	"package": "signature",
	"packagePrice": 75,
	"addons": [{"id": "addon_id", "qty": 2}],
	"addonsTotal": 60,
	"travelFeeStatus": "included|estimated|tbd",
	"travelFeeAmount": 0,
	"address": "string",
	"addressLine2": "string",
	"zipCode": "string",
	"venueType": "home|backyard|community-center|office|rental-venue|other",
	"setupRequirements": ["flat-cooking-surface", "electrical-outlet", "water-access", "seating-arranged"],
	"specialRequests": "string",
	"dietaryRestrictions": "string",
	"hasAllergies": true,
	"allergies": "string",
	"contactName": "string",
	"contactEmail": "string",
	"contactPhone": "string",
	"agreeToTerms": true,
	"marketingConsent": false,
	"paymentOption": "deposit|full|later",
	"subtotal": 1125,
	"tax": 90,
	"total": 1215,
	"status": "pending|confirmed|pending_payment|cancelled|completed",
	"paymentStatus": "unpaid|deposit_paid|paid|refunded",
	"createdAt": "timestamp",
	"updatedAt": "timestamp"
}
```

#### 5.1.4 Payments
```json
{
	"id": "uuid",
	"bookingId": "uuid",
	"stripePaymentIntentId": "pi_xxx",
	"amount": 15000,
	"currency": "usd",
	"status": "requires_payment|succeeded|failed|refunded",
	"type": "deposit|full",
	"receiptUrl": "https://...",
	"createdAt": "timestamp"
}
```

#### 5.1.5 Videos
```json
{
	"id": "uuid",
	"title": "ChefWeb Experience",
	"description": "Homepage promo",
	"videoUrl": "https://cdn.chefweb.com/video.mp4",
	"thumbnailUrl": "https://cdn.chefweb.com/video-thumb.jpg",
	"isHomepage": true,
	"createdAt": "timestamp"
}
```

#### 5.1.6 Chat Logs
```json
{
	"id": "uuid",
	"conversationId": "conv_abc",
	"userSessionId": "session_xyz",
	"messages": [
		{"role": "user", "content": "How much for 15 people?", "ts": "..."},
		{"role": "assistant", "content": "For 15...", "ts": "..."}
	],
	"intent": "pricing_question",
	"createdAt": "timestamp"
}
```

#### 5.1.7 Add-ons
```json
{
	"id": "uuid",
	"name": "Fried Rice Upgrade",
	"price": 10,
	"active": true
}
```

#### 5.1.8 Service Areas
```json
{
	"id": "uuid",
	"region": "bay_area",
	"states": ["CA"],
	"cities": ["San Francisco", "Oakland", "San Jose"],
	"maxRadiusMiles": 300,
	"travelFeePolicy": "included|estimated|tbd",
	"active": true
}
```

---

## 6. API Specification

### 6.1 Auth
- **POST /api/auth/login** → Admin login
- **POST /api/auth/logout**
- **POST /api/auth/refresh**

### 6.2 Bookings
- **POST /api/bookings** → Create booking
- **GET /api/bookings/{id}** → Fetch booking
- **GET /api/bookings** → List bookings (admin)
- **PATCH /api/bookings/{id}** → Update status (admin)

### 6.3 Payments
- **GET /api/config/stripe** → Publishable key
- **POST /api/payments/create-intent**
- **POST /api/payments/webhook** → Stripe webhook
- **POST /api/payments/refund**

### 6.4 Analytics
- **POST /api/analytics/video** → Video engagement events

### 6.5 Video
- **GET /api/videos/homepage**
- **POST /api/videos** (admin)
- **DELETE /api/videos/{id}** (admin)
- **POST /api/videos/presign** (admin, S3 upload)

### 6.6 Chatbot
- **POST /api/chatbot/message**
- **GET /api/chatbot/logs** (admin)

### 6.7 Config & Pricing
- **GET /api/packages**
- **GET /api/addons**
- **GET /api/service-areas**
- **GET /api/menu** → Homepage “$60 per person includes” list
- **PATCH /api/packages** (admin)

---

## 7. Stripe Payment Flow

1. Frontend requests **POST /api/payments/create-intent** with amount.
2. Backend creates Stripe PaymentIntent.
3. Frontend confirms payment with Stripe Elements.
4. Stripe webhook updates booking payment status.

**Backend must validate amount** based on server-side pricing rules (do not trust client totals).

---

## 8. CEO Requirements Alignment

### 8.1 Service Area Rules
- Primary region: **San Francisco Bay Area**
- Accept bookings up to **300 miles** outside Bay Area
- Travel fee applies outside Bay Area (estimated by distance tier)

### 8.2 Party Type
- Store `partyType` in booking record
- Used for analytics and future personalization

### 8.3 Allergy Emphasis
- Backend must accept allergy details and mark high priority in booking payload
- Admin view should highlight allergy fields

**Webhook Events to handle:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `charge.refunded`

---

## 8. AI Chatbot Integration

### 8.1 System Prompt (Backend)
The backend will maintain a system prompt with domain knowledge:
- Pricing tiers
- Minimum spend rules
- Service areas
- Booking policies
- Dietary accommodations

### 8.2 Output Schema
```json
{
	"response": "string",
	"intent": "booking_inquiry|pricing_question|service_area_check|package_comparison|dietary_restrictions",
	"confidence": 0.0-1.0,
	"actions": [
		{"type": "prefill_booking", "data": {"numAdults": 15}}
	],
	"quickReplies": ["Book now", "See packages"]
}
```

### 8.3 Safety & Filtering
- Block profanity and harmful content
- Prevent leakage of internal pricing rules outside allowed scope
- Limit response length to 200 tokens

---

## 9. Frontend Integration Contracts (Current Implementation)

### 9.1 Required API Paths (as used by Frontend)
- **/api/videos/homepage** (homepage video)
- **/api/analytics/video** (video events)
- **/api/chatbot/message** (chatbot requests)
- **/api/config/stripe** (Stripe publishable key)
- **/api/payments/create-intent** (Stripe PaymentIntent)

### 9.2 Session Storage Keys Used by Frontend
- `bookingState`
- `bookingReference`
- `bookingComplete`
- `paymentIntentId`
- `quickBookingData`

### 9.3 Payment Options
- `deposit` (25% of total, client-calculated; server must re-calc)
- `full`
- `later`

### 9.4 Travel Fee States
- `included` | `estimated` | `tbd`

### 9.5 Booking Flow Steps
1. Location & Date
2. Party Details (includes party type)
3. Package & Add-ons
4. Contact + Allergies + Payment

---

## 10. Notifications

### 9.1 Email (SendGrid)
- Booking confirmation
- Payment receipt
- Cancellation + refund confirmation
- Admin booking alert

### 9.2 SMS (Twilio)
- Optional: Booking confirmation
- Optional: Payment reminders

---

## 11. Security Requirements

- HTTPS enforced
- JWT authentication for admin endpoints
- Role-based access control
- Rate limiting (chatbot + auth)
- Input validation and sanitization
- Webhook signature verification (Stripe)
- Audit logs for admin actions

---

## 12. Performance & Reliability

- p95 latency < 300ms for read APIs
- p95 latency < 500ms for payment/chat APIs
- Retry mechanism for email/SMS sending
- Automatic retries for failed webhook events
- Daily backups for PostgreSQL

---

## 13. Admin Portal Requirements (Backend APIs)

### Core Functions
- View and filter bookings
- Update booking status
- Upload/manage videos
- Configure packages/add-ons
- View payment status and refunds
- View chatbot logs and flagged conversations

---

## 14. Testing Requirements

### 13.1 Unit Tests
- Booking price calculations
- Payment webhook handlers
- Chatbot response parser

### 13.2 Integration Tests
- Full booking + payment workflow
- Stripe webhook updates
- Video upload + retrieval

### 13.3 Load Tests
- 500 concurrent chat requests
- 200 concurrent booking creations

---

## 15. Deployment Plan

### Phase 1 (Week 1-2)
- Core booking APIs
- Database schema migration

### Phase 2 (Week 3-4)
- Stripe integration + webhooks
- Email notifications

### Phase 3 (Week 5-6)
- Video management
- Chatbot integration

### Phase 4 (Week 7-8)
- Admin dashboard APIs
- Monitoring & analytics

---

## 16. Risks & Mitigations

- **Payment fraud** → Stripe Radar + manual review
- **Chatbot hallucinations** → Strict system prompt + output schema
- **Video bandwidth costs** → CDN + caching
- **Data privacy** → Encrypt PII at rest

---

## 17. Open Questions

- Deposit amount final ($100, $150, or $200?)
- Refund policy confirmation
- Admin UI scope (standalone vs embedded)
- Hosting platform preference

---

**End of Backend PRD**
