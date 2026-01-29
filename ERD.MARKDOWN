# ChefWeb Database Design (ERD)

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    BOOKINGS                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ PK  id                    UUID           DEFAULT uuid_generate_v4()                 │
│     confirmation_number   VARCHAR(20)    UNIQUE NOT NULL                            │
│     status               VARCHAR(30)     DEFAULT 'pending_payment'                  │
│     payment_status       VARCHAR(30)     DEFAULT 'unpaid'                           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ EVENT DETAILS                                                                        │
│     service_state        VARCHAR(5)      NOT NULL                                   │
│     city                 VARCHAR(100)    NOT NULL                                   │
│     event_date           DATE            NOT NULL                                   │
│     event_time           TIME            NOT NULL                                   │
│     venue_type           VARCHAR(50)                                                │
│     venue_address        TEXT                                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ GUEST DETAILS                                                                        │
│     num_adults           INTEGER         DEFAULT 0                                  │
│     num_children         INTEGER         DEFAULT 0                                  │
│     package              VARCHAR(20)     DEFAULT 'signature'                        │
│     dietary_notes        TEXT                                                       │
│     special_requests     TEXT                                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ CONTACT                                                                              │
│     contact_name         VARCHAR(100)    NOT NULL                                   │
│     contact_email        VARCHAR(255)    NOT NULL                                   │
│     contact_phone        VARCHAR(30)     NOT NULL                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ PRICING                                                                              │
│     base_amount          DECIMAL(10,2)   DEFAULT 0                                  │
│     addons_total         DECIMAL(10,2)   DEFAULT 0                                  │
│     travel_fee           DECIMAL(10,2)   DEFAULT 0                                  │
│     subtotal             DECIMAL(10,2)   DEFAULT 0                                  │
│     total                DECIMAL(10,2)   DEFAULT 0                                  │
│     payment_option       VARCHAR(20)     DEFAULT 'later'                            │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ METADATA                                                                             │
│     agree_to_terms       BOOLEAN         DEFAULT FALSE                              │
│     created_at           TIMESTAMPTZ     DEFAULT NOW()                              │
│     updated_at           TIMESTAMPTZ     DEFAULT NOW()                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                                           │ 1:N
                                           ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    PAYMENTS                                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ PK  id                    UUID           DEFAULT uuid_generate_v4()                 │
│     payment_intent_id     VARCHAR(100)   UNIQUE NOT NULL                            │
│ FK  booking_id            UUID           REFERENCES bookings(id) ON DELETE SET NULL │
│     amount                INTEGER        NOT NULL (in cents)                        │
│     currency              VARCHAR(3)     DEFAULT 'usd'                              │
│     status                VARCHAR(30)    DEFAULT 'requires_payment'                 │
│     payment_type          VARCHAR(20)    (full, deposit)                            │
│     stripe_customer_id    VARCHAR(100)                                              │
│     refund_id             VARCHAR(100)                                              │
│     created_at            TIMESTAMPTZ    DEFAULT NOW()                              │
│     updated_at            TIMESTAMPTZ    DEFAULT NOW()                              │
└─────────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               ANALYTICS_EVENTS                                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ PK  id                    UUID           DEFAULT uuid_generate_v4()                 │
│     event_type            VARCHAR(50)    NOT NULL                                   │
│     video_id              VARCHAR(100)                                              │
│     page                  VARCHAR(255)                                              │
│     user_agent            TEXT                                                      │
│     ip_address            VARCHAR(45)                                               │
│     metadata              JSONB                                                     │
│     created_at            TIMESTAMPTZ    DEFAULT NOW()                              │
└─────────────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                CHAT_MESSAGES                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ PK  id                    UUID           DEFAULT uuid_generate_v4()                 │
│     session_id            VARCHAR(100)   NOT NULL                                   │
│     role                  VARCHAR(20)    NOT NULL (user, assistant)                 │
│     message               TEXT           NOT NULL                                   │
│     intent                VARCHAR(50)                                               │
│     confidence            DECIMAL(3,2)                                              │
│     created_at            TIMESTAMPTZ    DEFAULT NOW()                              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Relationships

```
┌──────────────┐         1:N         ┌──────────────┐
│   BOOKINGS   │ ◄───────────────────│   PAYMENTS   │
│              │                     │              │
│ id (PK)      │                     │ booking_id   │───► FK to bookings.id
│              │                     │ (FK)         │     ON DELETE SET NULL
└──────────────┘                     └──────────────┘

┌──────────────────┐                 ┌──────────────────┐
│ ANALYTICS_EVENTS │                 │  CHAT_MESSAGES   │
│                  │                 │                  │
│ (Standalone -    │                 │ (Session-based - │
│  no FK)          │                 │  no FK)          │
└──────────────────┘                 └──────────────────┘
```

---

## Table Descriptions

### 1. BOOKINGS
**Purpose:** Core business entity - stores all hibachi catering booking requests.

| Column Group | Description |
|--------------|-------------|
| **Identity** | UUID primary key + human-readable confirmation number (e.g., `CHF-ABC123`) |
| **Status** | Booking lifecycle status + payment status (separate concerns) |
| **Event Details** | When, where, and what type of venue |
| **Guest Details** | Party size, package selection, dietary requirements |
| **Contact** | Customer contact information |
| **Pricing** | Itemized pricing breakdown (base + addons + travel = total) |
| **Metadata** | Terms agreement, timestamps |

**Status Values:**
- `status`: `pending_payment`, `confirmed`, `fulfilled`, `cancelled`
- `payment_status`: `unpaid`, `deposit_paid`, `paid`, `refunded`, `failed`

### 2. PAYMENTS
**Purpose:** Stripe payment tracking - links PaymentIntents to bookings.

| Column | Description |
|--------|-------------|
| `payment_intent_id` | Stripe PaymentIntent ID (e.g., `pi_xxx`) |
| `booking_id` | Optional FK - null for orphaned payments |
| `amount` | Amount in cents (Stripe standard) |
| `status` | Mirrors Stripe status: `requires_payment`, `processing`, `succeeded`, `failed`, `refunded` |
| `payment_type` | `full` or `deposit` |
| `refund_id` | Stripe Refund ID if refunded |

### 3. ANALYTICS_EVENTS
**Purpose:** Track user behavior for business insights.

| Event Types | Description |
|-------------|-------------|
| `page_view` | User visited a page |
| `video_play` | User started playing a video |
| `video_complete` | User finished watching a video |
| `booking_start` | User began booking flow |
| `booking_complete` | User completed booking |
| `chat_interaction` | User engaged with chatbot |

### 4. CHAT_MESSAGES
**Purpose:** AI chatbot conversation history for context continuity.

| Column | Description |
|--------|-------------|
| `session_id` | Groups messages in a conversation |
| `role` | `user` or `assistant` |
| `intent` | Detected user intent (e.g., `pricing_inquiry`, `booking_help`) |
| `confidence` | AI confidence score (0.00 - 1.00) |

---

## Indexes

| Index Name | Table | Column(s) | Purpose |
|------------|-------|-----------|---------|
| `idx_bookings_email` | bookings | contact_email | Customer lookup |
| `idx_bookings_confirmation` | bookings | confirmation_number | Quick booking retrieval |
| `idx_bookings_date` | bookings | event_date | Date-based scheduling queries |
| `idx_bookings_status` | bookings | status | Filter by booking status |
| `idx_payments_booking` | payments | booking_id | Join payments to bookings |
| `idx_payments_intent` | payments | payment_intent_id | Stripe webhook lookup |
| `idx_analytics_event_type` | analytics_events | event_type | Filter by event type |
| `idx_analytics_created` | analytics_events | created_at | Time-series analytics |
| `idx_chat_session` | chat_messages | session_id | Retrieve conversation history |

---

## Constraints & Rules

### Primary Keys
- All tables use `UUID` primary keys with `uuid_generate_v4()` for distributed-safe ID generation

### Foreign Keys
- `payments.booking_id` → `bookings.id` with `ON DELETE SET NULL` (preserve payment records if booking deleted)

### Unique Constraints
- `bookings.confirmation_number` - Human-readable booking reference
- `payments.payment_intent_id` - Stripe PaymentIntent ID

### Triggers
- `update_bookings_updated_at` - Auto-updates `updated_at` on row modification
- `update_payments_updated_at` - Auto-updates `updated_at` on row modification

---

## Data Types Reference

| PostgreSQL Type | Usage |
|-----------------|-------|
| `UUID` | Primary keys - globally unique, no collisions |
| `VARCHAR(n)` | Fixed-length strings (emails, names, IDs) |
| `TEXT` | Variable-length strings (addresses, notes) |
| `INTEGER` | Whole numbers (amounts in cents, counts) |
| `DECIMAL(10,2)` | Currency amounts in dollars |
| `DATE` | Event dates |
| `TIME` | Event times |
| `BOOLEAN` | True/false flags |
| `TIMESTAMPTZ` | Timestamps with timezone (UTC) |
| `JSONB` | Flexible metadata storage |

---

## Package Pricing Reference

| Package | Adult Price | Child Price |
|---------|-------------|-------------|
| Essential | $65 | $43 |
| Signature | $75 | $50 |
| Premium | $95 | $63 |

---

## State Machine: Booking Lifecycle

```
                    ┌─────────────────┐
                    │ pending_payment │ ◄── Initial state on creation
                    └────────┬────────┘
                             │
              payment_intent.succeeded (webhook)
                             │
                             ▼
                    ┌─────────────────┐
                    │    confirmed    │ ◄── Payment received
                    └────────┬────────┘
                             │
                    Event completed
                             │
                             ▼
                    ┌─────────────────┐
                    │    fulfilled    │ ◄── Service delivered
                    └─────────────────┘

    At any point:
    ┌─────────────────┐
    │    cancelled    │ ◄── Customer/admin cancellation
    └─────────────────┘
```

---

## State Machine: Payment Lifecycle

```
┌───────────────────┐
│ requires_payment  │ ◄── PaymentIntent created
└─────────┬─────────┘
          │
    Card submitted
          │
          ▼
┌───────────────────┐     3DS/Auth     ┌───────────────────┐
│    processing     │ ───────────────► │  requires_action  │
└─────────┬─────────┘                  └─────────┬─────────┘
          │                                      │
    Payment confirmed                    Auth completed
          │                                      │
          ▼                                      ▼
┌───────────────────┐                  ┌───────────────────┐
│    succeeded      │ ◄────────────────│                   │
└─────────┬─────────┘                  └───────────────────┘
          │
    Refund requested
          │
          ▼
┌───────────────────┐
│     refunded      │
└───────────────────┘

On error at any step:
┌───────────────────┐
│      failed       │
└───────────────────┘
```

---

## Cloud Infrastructure

| Component | Service | Connection |
|-----------|---------|------------|
| **Database** | Cloud SQL (PostgreSQL) | `smiling-mark-476404-h0:us-west1:guangloindependent` |
| **Database Name** | `chefweb` | |
| **Backend** | Cloud Run | `chefweb-backend-775848565797.us-central1.run.app` |
| **Frontend** | GitHub Pages | `jimmy00415.github.io/ChefWeb/` |

---

## SQL Schema Location

Full schema file: [`Backend/src/db/schema.sql`](Backend/src/db/schema.sql)

Initialize with:
```bash
psql -d chefweb -f Backend/src/db/schema.sql
```

Or via API:
```bash
curl -X POST https://chefweb-backend-xxx.run.app/api/setup/init-db
```

---

*Last updated: January 29, 2026*

---

## Business Readiness Assessment

### ✅ READY (Complete)

| Feature | Status | Notes |
|---------|--------|-------|
| Frontend booking form | ✅ | Multi-step wizard with validation |
| Backend booking API | ✅ | Create, read, list bookings |
| PostgreSQL database | ✅ | Cloud SQL connected |
| Stripe payment integration | ✅ | SDK integrated, needs keys configured |
| Analytics dashboard API | ✅ | 7 endpoints for business insights |
| Billing reconciliation | ✅ | Payment sync + issue detection |
| Confirmation page | ✅ | Shows booking reference |
| Package pages | ✅ | Essential, Signature, Premium |
| Service areas page | ✅ | Geographic coverage display |
| FAQ page | ✅ | Common questions |
| Gallery page | ✅ | Photo showcase |
| Reviews page | ✅ | Customer testimonials |
| Mobile responsive | ✅ | CSS variables + responsive design |
| CORS configured | ✅ | Frontend ↔ Backend connected |

### ❌ MISSING (Critical for Business)

| Feature | Priority | Impact | Effort |
|---------|----------|--------|--------|
| **Email Notifications** | 🔴 CRITICAL | Customer doesn't receive confirmation | 2-3 hours |
| **Admin Dashboard** | 🔴 CRITICAL | Can't manage bookings | 4-6 hours |
| **Contact Form Handler** | 🔴 HIGH | Inquiries lost | 1 hour |
| **Booking Lookup** | 🟠 HIGH | Customer can't check status | 1 hour |
| **Cancel/Modify Booking** | 🟠 HIGH | No self-service | 2 hours |
| **Rate Limiting** | 🟠 MEDIUM | API abuse protection | 1 hour |
| **AI Chatbot** | 🟡 LOW | Basic responses only | 4+ hours |
| **Calendar Export** | 🟡 LOW | No iCal/Google sync | 2 hours |
| **Error Logging** | 🟢 LOW | Debugging harder | 1 hour |

### Minimum Viable Business (MVB) Checklist

To accept real customers, you NEED:

1. ⬜ **Email notifications** - Customer confirmation, admin alerts
2. ⬜ **Admin dashboard** - View/manage all bookings  
3. ⬜ **Contact form** - Handle inquiries
4. ⬜ **Stripe keys** - Real payment processing
