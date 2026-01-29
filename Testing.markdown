# ChefWeb Comprehensive Test Plan

## Document Information

| Field | Value |
|-------|-------|
| **Project** | ChefWeb - POP Habachi Private Chef Booking Platform |
| **Version** | 2.0 |
| **Last Updated** | January 29, 2026 |
| **Author** | QA Engineering Team |
| **Environment** | Cloud Run (Production), Local Development |

---

## Table of Contents

1. [Testing Overview](#1-testing-overview)
2. [Test Environment Setup](#2-test-environment-setup)
3. [API Endpoint Testing](#3-api-endpoint-testing)
4. [Frontend Functional Testing](#4-frontend-functional-testing)
5. [Integration Testing](#5-integration-testing)
6. [Security Testing](#6-security-testing)
7. [Performance Testing](#7-performance-testing)
8. [Regression Test Checklist](#8-regression-test-checklist)

---

## 1. Testing Overview

### 1.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (GitHub Pages)                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │   Booking    │ │   Admin      │ │   Chatbot    │ │   Contact    │    │
│  │   Funnel     │ │   Dashboard  │ │   Widget     │ │   Form       │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Cloud Run)                              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │  Bookings    │ │  Payments    │ │  Chatbot     │ │  Admin       │    │
│  │  API         │ │  (Stripe)    │ │  (Gemini)    │ │  API         │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │  PostgreSQL  │ │  SendGrid    │ │  Stripe      │ │  Vertex AI   │    │
│  │  (Cloud SQL) │ │  (Email)     │ │  (Payments)  │ │  (Gemini)    │    │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Test Categories

| Category | Priority | Scope |
|----------|----------|-------|
| **Smoke Tests** | P0 | Critical path - booking flow works end-to-end |
| **API Tests** | P1 | All backend endpoints |
| **UI Tests** | P1 | All user-facing pages |
| **Integration Tests** | P2 | Service integrations (Stripe, SendGrid, Gemini) |
| **Security Tests** | P1 | Authentication, rate limiting, input validation |
| **Performance Tests** | P3 | Load testing, response times |

---

## 2. Test Environment Setup

### 2.1 Backend API Base URLs

| Environment | URL |
|-------------|-----|
| **Production** | `https://chefweb-backend-775848565797.us-central1.run.app` |
| **Local Development** | `http://localhost:4000` |

### 2.2 Frontend URLs

| Environment | URL |
|-------------|-----|
| **Production** | `https://jimmy00415.github.io/ChefWeb/` |
| **Local Development** | File system or local server |

### 2.3 Test Credentials

| Credential | Environment Variable | Test Value |
|------------|---------------------|------------|
| Admin API Key | `ADMIN_API_KEY` | Set in .env |
| Stripe Test Key | `STRIPE_SECRET_KEY` | `sk_test_...` |
| SendGrid API Key | `SENDGRID_API_KEY` | Test key |

### 2.4 Test Data Templates

**Booking Payload:**
```json
{
  "serviceState": "CA",
  "city": "San Francisco",
  "eventDate": "2026-03-15",
  "eventTime": "18:00",
  "numAdults": 10,
  "numChildren": 2,
  "package": "signature",
  "contactName": "Test User",
  "contactEmail": "test@example.com",
  "contactPhone": "(555) 123-4567",
  "agreeToTerms": true,
  "paymentOption": "deposit"
}
```

---

## 3. API Endpoint Testing

### 3.1 Health & Configuration Endpoints

#### TC-API-001: Health Check
| Field | Value |
|-------|-------|
| **Endpoint** | `GET /health` |
| **Priority** | P0 |
| **Preconditions** | Server is running |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send GET request to `/health` | Status 200 |
| 2 | Verify response body | `{ "status": "ok", "postgres": true/false, "timestamp": "..." }` |

#### TC-API-002: Stripe Configuration
| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/payments/config/stripe` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send GET request | Status 200 |
| 2 | Verify response | Contains `publishableKey` and `configured` boolean |

---

### 3.2 Booking API Endpoints

#### TC-API-010: Create Booking - Valid Payload
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/bookings` |
| **Priority** | P0 |
| **Rate Limit** | 10/hour per IP |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send POST with valid booking payload | Status 201 |
| 2 | Verify response | Contains `bookingId`, `confirmationNumber`, `status` |
| 3 | Verify confirmation number format | Matches `CHF-XXXXXX` pattern |
| 4 | Verify database record | Booking exists with correct data |

#### TC-API-011: Create Booking - Missing Required Fields
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/bookings` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send POST without `contactEmail` | Status 400 |
| 2 | Verify error response | Contains `errors` array with field name |

#### TC-API-012: Create Booking - Invalid Email Format
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/bookings` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send POST with `contactEmail: "invalid"` | Status 400 |
| 2 | Verify error | Email validation error message |

#### TC-API-013: Create Booking - Below Minimum Spend
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/bookings` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send POST with `numAdults: 2`, package `essential` ($130 total) | Status 400 |
| 2 | Verify error | "Minimum spend of $500 required" |

#### TC-API-014: Booking Lookup - Valid Credentials
| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/bookings/lookup` |
| **Priority** | P0 |
| **Rate Limit** | 20/15min per IP |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a test booking | Get confirmation number |
| 2 | GET `/api/bookings/lookup?confirmation=CHF-XXXX&email=test@example.com` | Status 200 |
| 3 | Verify response | Contains `booking` object and `permissions` object |
| 4 | Verify permissions | Contains `canModify`, `canCancel`, `daysUntilEvent` |

#### TC-API-015: Booking Lookup - Wrong Email
| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/bookings/lookup` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | GET with valid confirmation but wrong email | Status 404 |
| 2 | Verify error | "Booking not found" message |

#### TC-API-016: Booking Modification
| Field | Value |
|-------|-------|
| **Endpoint** | `PATCH /api/bookings/:id/modify` |
| **Priority** | P0 |
| **Rate Limit** | 10/hour per IP |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create booking with event 7+ days away | Get booking ID |
| 2 | PATCH with new `numAdults: 15` and email verification | Status 200 |
| 3 | Verify response | Contains updated booking with new totals |
| 4 | Verify email | Modification confirmation sent |

#### TC-API-017: Booking Modification - Too Close to Event
| Field | Value |
|-------|-------|
| **Endpoint** | `PATCH /api/bookings/:id/modify` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create booking with event 2 days away | Get booking ID |
| 2 | Attempt to modify | Status 400 |
| 3 | Verify error | "Modifications require 3+ days notice" |

#### TC-API-018: Booking Cancellation - Full Refund Eligible
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/bookings/:id/cancel` |
| **Priority** | P0 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create booking with event 8+ days away | Get booking ID |
| 2 | POST cancel with email verification | Status 200 |
| 3 | Verify response | `refundPercentage: 100`, status `cancelled` |
| 4 | Verify database | `cancelled_at` and `refund_amount` populated |

#### TC-API-019: Booking Cancellation - Partial Refund
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/bookings/:id/cancel` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create booking with event 5 days away | Get booking ID |
| 2 | POST cancel | Status 200 |
| 3 | Verify response | `refundPercentage: 50` |

#### TC-API-020: Booking Cancellation - No Refund
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/bookings/:id/cancel` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create booking with event 2 days away | Get booking ID |
| 2 | POST cancel | Status 200 |
| 3 | Verify response | `refundPercentage: 0` |

#### TC-API-021: Calendar Download (.ics)
| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/bookings/:id/calendar.ics` |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create a test booking | Get booking ID |
| 2 | GET `/api/bookings/:id/calendar.ics?email=test@example.com` | Status 200 |
| 3 | Verify Content-Type | `text/calendar; charset=utf-8` |
| 4 | Verify .ics content | Contains VCALENDAR, VEVENT, correct dates |

---

### 3.3 Payment API Endpoints

#### TC-API-030: Create Payment Intent
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/payments/create-intent` |
| **Priority** | P0 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST with booking data and amount | Status 200 |
| 2 | Verify response | Contains `clientSecret`, `paymentIntentId` |
| 3 | Verify Stripe dashboard | PaymentIntent created (test mode) |

#### TC-API-031: Confirm Payment
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/payments/confirm` |
| **Priority** | P0 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create PaymentIntent | Get paymentIntentId |
| 2 | POST confirm with booking ID | Status 200 |
| 3 | Verify booking status | Updated to `confirmed` |
| 4 | Verify payment status | Updated to `paid` or `deposit_paid` |

#### TC-API-032: Payment Webhook - Success
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/payments/webhook` |
| **Priority** | P0 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Simulate Stripe webhook `payment_intent.succeeded` | Status 200 |
| 2 | Verify database | Payment status updated to `succeeded` |
| 3 | Verify email | Payment receipt sent to customer |

#### TC-API-033: Process Refund
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/payments/refund` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST with paymentIntentId and refund amount | Status 200 |
| 2 | Verify Stripe | Refund created |
| 3 | Verify database | Refund recorded |

---

### 3.4 Contact API Endpoints

#### TC-API-040: Submit Contact Form
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/contact` |
| **Priority** | P1 |
| **Rate Limit** | 5/hour per IP |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST with name, email, message | Status 201 |
| 2 | Verify response | Contains `success: true`, `inquiryId` |
| 3 | Verify database | Contact inquiry saved with status `new` |
| 4 | Verify emails | Admin alert + auto-reply sent |

#### TC-API-041: Contact Form - Missing Fields
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/contact` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST without required `message` field | Status 400 |
| 2 | Verify error | Lists missing required fields |

#### TC-API-042: Contact Form - XSS Prevention
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/contact` |
| **Priority** | P1 - Security |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST with `message: "<script>alert('xss')</script>"` | Status 201 |
| 2 | Verify database | Script tags stripped from message |

---

### 3.5 Chatbot API Endpoints

#### TC-API-050: Chatbot Message - Gemini Response
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/chatbot/message` |
| **Priority** | P1 |
| **Rate Limit** | 30/15min per IP |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST with `{ message: "What packages do you offer?" }` | Status 200 |
| 2 | Verify response structure | Contains `response`, `intent`, `confidence`, `quickReplies`, `source` |
| 3 | Verify source | `source: "gemini"` (when Gemini available) |
| 4 | Verify content | Mentions Essential $65, Signature $75, Premium $95 |

#### TC-API-051: Chatbot with Conversation History
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/chatbot/message` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST asking about packages | Get response about packages |
| 2 | POST with history + "Which one has lobster?" | Status 200 |
| 3 | Verify response | Mentions Premium package includes lobster |

#### TC-API-052: Chatbot Fallback (Pattern Matching)
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/chatbot/message` |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Disable Gemini (no PROJECT_ID) | Fallback mode active |
| 2 | POST with "What are your prices?" | Status 200 |
| 3 | Verify response | `source: "pattern"`, still provides pricing info |

#### TC-API-053: Chatbot Status
| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/chatbot/status` |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | GET /api/chatbot/status | Status 200 |
| 2 | Verify response | Contains `geminiAvailable`, `mode`, `intentsLoaded` |

#### TC-API-054: Chatbot - Empty Message
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/chatbot/message` |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST with `{ message: "" }` | Status 200 |
| 2 | Verify response | `source: "validation"`, helpful prompt to ask questions |

#### TC-API-055: Chatbot - Message Too Long
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/chatbot/message` |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST with message > 1000 characters | Message truncated to 1000 |
| 2 | Verify response | Still processes successfully |

---

### 3.6 Admin API Endpoints

#### TC-API-060: Admin Login - Valid Key
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/admin/login` |
| **Priority** | P0 |
| **Rate Limit** | 5/15min per IP |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST with valid `ADMIN_API_KEY` | Status 200 |
| 2 | Verify response | Contains `token`, `expiresAt` |
| 3 | Verify token | Can be used for authenticated requests |

#### TC-API-061: Admin Login - Invalid Key
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/admin/login` |
| **Priority** | P1 - Security |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST with wrong API key | Status 401 after ~1s delay |
| 2 | Verify response | `{ error: "Invalid API key" }` |
| 3 | Verify no token | No session created |

#### TC-API-062: Admin Dashboard Stats
| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/admin/stats` |
| **Priority** | P1 |
| **Auth Required** | Yes |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login and get token | Have valid session token |
| 2 | GET /api/admin/stats with Bearer token | Status 200 |
| 3 | Verify response | Contains `summary`, `recentBookings`, `upcomingEvents` |

#### TC-API-063: Admin Bookings List with Filters
| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/admin/bookings` |
| **Priority** | P1 |
| **Auth Required** | Yes |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | GET with `?status=confirmed` | Status 200 |
| 2 | Verify results | Only confirmed bookings returned |
| 3 | GET with `?search=test@example.com` | Status 200 |
| 4 | Verify results | Only matching bookings returned |

#### TC-API-064: Admin Update Booking Status
| Field | Value |
|-------|-------|
| **Endpoint** | `PATCH /api/admin/bookings/:id` |
| **Priority** | P1 |
| **Auth Required** | Yes |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | PATCH with `{ status: "fulfilled" }` | Status 200 |
| 2 | Verify database | Booking status updated |
| 3 | Verify `updated_at` | Timestamp updated |

#### TC-API-065: Admin Contact Inquiries
| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/admin/contacts` |
| **Priority** | P2 |
| **Auth Required** | Yes |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | GET /api/admin/contacts | Status 200 |
| 2 | Verify response | Contains contact inquiries list |

#### TC-API-066: Admin Session Verification
| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/admin/verify` |
| **Priority** | P1 |
| **Auth Required** | Yes |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | GET with valid token | Status 200, `{ valid: true }` |
| 2 | GET with expired/invalid token | Status 401 |

#### TC-API-067: Admin Logout
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/admin/logout` |
| **Priority** | P2 |
| **Auth Required** | Yes |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST /api/admin/logout | Status 200 |
| 2 | Try using old token | Status 401 (invalidated) |

---

### 3.7 Analytics API Endpoints

#### TC-API-070: Track Video Event
| Field | Value |
|-------|-------|
| **Endpoint** | `POST /api/analytics/video` |
| **Priority** | P3 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | POST with video event data | Status 201 |
| 2 | Verify database | Event recorded |

#### TC-API-071: Analytics Dashboard
| Field | Value |
|-------|-------|
| **Endpoint** | `GET /api/analytics/dashboard` |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | GET /api/analytics/dashboard | Status 200 |
| 2 | Verify response | Contains `todayRevenue`, `pendingPayments`, `eventsToday` |

---

## 4. Frontend Functional Testing

### 4.1 Booking Funnel

#### TC-UI-001: Complete Booking Flow (Happy Path)
| Field | Value |
|-------|-------|
| **Page** | `/pages/booking.html` |
| **Priority** | P0 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open booking page | Step 1 (Location) displayed |
| 2 | Select state (CA), city (San Francisco) | Travel fee status shown |
| 3 | Select date (future), time | "Next" button enabled |
| 4 | Click Next → Step 2 | Guest count displayed |
| 5 | Set adults=10, children=2 | Price preview updates |
| 6 | Click Next → Step 3 | Package selection displayed |
| 7 | Select "Signature" package | Price updates to $75/person |
| 8 | Click Next → Step 4 | Contact & payment form |
| 9 | Fill all required fields | Validation passes |
| 10 | Select "Pay Deposit" | Stripe Elements loads |
| 11 | Enter test card (4242...) | Payment processes |
| 12 | Submit | Redirected to confirmation page |
| 13 | Verify confirmation | Shows confirmation number, booking details |

#### TC-UI-002: Booking Funnel - Step Navigation
| Field | Value |
|-------|-------|
| **Page** | `/pages/booking.html` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete Step 1, move to Step 2 | Progress indicator shows step 2 |
| 2 | Click back to Step 1 | Can navigate back |
| 3 | Click step indicator directly | Navigates if step unlocked |
| 4 | Try to skip ahead | Cannot access steps beyond maxStepReached |

#### TC-UI-003: Booking Funnel - Minimum Spend Validation
| Field | Value |
|-------|-------|
| **Page** | `/pages/booking.html` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set numAdults=4, Essential package | Total = $260 |
| 2 | Try to proceed | Warning: "Minimum spend $500 required" |
| 3 | Increase to numAdults=8 | Total = $520, can proceed |

#### TC-UI-004: Booking Funnel - Session Persistence
| Field | Value |
|-------|-------|
| **Page** | `/pages/booking.html` |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Fill out Step 1-2 | Data saved to sessionStorage |
| 2 | Refresh page | Data restored, returns to current step |
| 3 | Close and reopen browser | Data cleared (sessionStorage) |

#### TC-UI-005: Booking Funnel - Price Calculation
| Field | Value |
|-------|-------|
| **Page** | `/pages/booking.html` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set 10 adults, 2 children, Signature ($75) | Adults: $750, Children: $75 (50%), Total: $825 |
| 2 | Add travel fee (estimated $100) | Total: $925 |
| 3 | Switch to Premium ($95) | Adults: $950, Children: $95, Total: $1,045 + travel |

---

### 4.2 Booking Lookup & Self-Service

#### TC-UI-010: Booking Lookup
| Field | Value |
|-------|-------|
| **Page** | `/pages/booking-lookup.html` |
| **Priority** | P0 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter valid confirmation + email | Click "Find Booking" |
| 2 | Verify booking details | Shows event date, package, guests, status |
| 3 | Verify action buttons | "Modify" and "Cancel" buttons visible if eligible |

#### TC-UI-011: Booking Modification
| Field | Value |
|-------|-------|
| **Page** | `/pages/booking-modify.html` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Access from lookup page | Pre-filled with current booking data |
| 2 | Change guest count | Price updates |
| 3 | Submit modification | Confirmation message |
| 4 | Verify email | Modification confirmation received |

#### TC-UI-012: Booking Cancellation
| Field | Value |
|-------|-------|
| **Page** | `/pages/booking-cancel.html` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Access from lookup page | Shows refund information |
| 2 | Verify refund percentage | Correct based on days until event |
| 3 | Confirm cancellation | Success message, status updated |

---

### 4.3 Contact Form

#### TC-UI-020: Contact Form Submission
| Field | Value |
|-------|-------|
| **Page** | `/pages/contact.html` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Fill name, email, message | All fields populated |
| 2 | Click Submit | Loading indicator shown |
| 3 | Verify success | Success message displayed |
| 4 | Verify form | Form cleared/reset |

#### TC-UI-021: Contact Form Validation
| Field | Value |
|-------|-------|
| **Page** | `/pages/contact.html` |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit empty form | Validation errors shown |
| 2 | Enter invalid email | "Invalid email" error |
| 3 | Enter valid data | Errors cleared |

---

### 4.4 Chatbot Widget

#### TC-UI-030: Chatbot Toggle
| Field | Value |
|-------|-------|
| **Component** | Chatbot floating widget |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click chat toggle button | Chat window opens with animation |
| 2 | Verify welcome message | Shows "Hi there! 👋" welcome |
| 3 | Verify quick replies | Default quick reply buttons shown |
| 4 | Click close or toggle | Chat window closes |

#### TC-UI-031: Chatbot Conversation
| Field | Value |
|-------|-------|
| **Component** | Chatbot widget |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Type "What packages do you offer?" | Message appears in chat |
| 2 | Wait for response | Typing indicator shows, then response |
| 3 | Verify response | Contains package information |
| 4 | Click quick reply button | Sends that message |

#### TC-UI-032: Chatbot History Persistence
| Field | Value |
|-------|-------|
| **Component** | Chatbot widget |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Have a conversation | Messages displayed |
| 2 | Close and reopen chat | History preserved (localStorage) |
| 3 | Clear browser storage | History cleared |

---

### 4.5 Admin Dashboard

#### TC-UI-040: Admin Login
| Field | Value |
|-------|-------|
| **Page** | `/pages/admin/login.html` |
| **Priority** | P0 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter valid API key | Click "Login" |
| 2 | Verify redirect | Goes to dashboard.html |
| 3 | Verify token | Stored in localStorage |

#### TC-UI-041: Admin Login - Invalid
| Field | Value |
|-------|-------|
| **Page** | `/pages/admin/login.html` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Enter wrong API key | Click "Login" |
| 2 | Verify error | "Invalid API key" message |
| 3 | Verify no redirect | Stays on login page |

#### TC-UI-042: Admin Dashboard Stats
| Field | Value |
|-------|-------|
| **Page** | `/pages/admin/dashboard.html` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to dashboard | Stats cards displayed |
| 2 | Verify stats | Today's events, pending payments, revenue, contacts |
| 3 | Verify recent bookings | List of latest bookings |
| 4 | Click booking row | Opens booking detail |

#### TC-UI-043: Admin Bookings Management
| Field | Value |
|-------|-------|
| **Page** | `/pages/admin/bookings.html` |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View bookings list | All bookings displayed |
| 2 | Apply status filter | List filtered |
| 3 | Use search | Results filtered by email/name |
| 4 | Click pagination | Loads next page |

#### TC-UI-044: Admin Session Timeout
| Field | Value |
|-------|-------|
| **Page** | Any admin page |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login and wait 24+ hours | Session expires |
| 2 | Try to access admin page | Redirected to login |

---

### 4.6 Static Pages

#### TC-UI-050: Packages Page
| Field | Value |
|-------|-------|
| **Page** | `/pages/packages.html` |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load page | All 3 packages displayed |
| 2 | Verify pricing | Essential $65, Signature $75, Premium $95 |
| 3 | Click "Book Now" | Navigates to booking page |

#### TC-UI-051: Service Areas Page
| Field | Value |
|-------|-------|
| **Page** | `/pages/service-areas.html` |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load page | State list displayed |
| 2 | Click state | Shows cities in that state |
| 3 | Click "Book in [City]" | Navigates to booking with pre-fill |

#### TC-UI-052: FAQ Page
| Field | Value |
|-------|-------|
| **Page** | `/pages/faq.html` |
| **Priority** | P3 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load page | FAQ accordion displayed |
| 2 | Click question | Answer expands |
| 3 | Click another question | Previous collapses, new expands |

#### TC-UI-053: Gallery Page
| Field | Value |
|-------|-------|
| **Page** | `/pages/gallery.html` |
| **Priority** | P3 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Load page | Images/videos displayed |
| 2 | Click image | Lightbox opens |
| 3 | Play video | Video plays, tracked in analytics |

---

## 5. Integration Testing

### 5.1 Email Integration (SendGrid)

#### TC-INT-001: Booking Confirmation Email
| Field | Value |
|-------|-------|
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create new booking | Email triggered |
| 2 | Verify customer receives | Confirmation email in inbox |
| 3 | Verify admin receives | Admin alert email |
| 4 | Check email content | Correct booking details, links work |

#### TC-INT-002: Payment Receipt Email
| Field | Value |
|-------|-------|
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Complete payment | Receipt email triggered |
| 2 | Verify content | Amount, booking details correct |

#### TC-INT-003: Cancellation Email
| Field | Value |
|-------|-------|
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Cancel a booking | Email triggered |
| 2 | Verify content | Refund amount, confirmation |

---

### 5.2 Payment Integration (Stripe)

#### TC-INT-010: Full Payment Flow
| Field | Value |
|-------|-------|
| **Priority** | P0 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create booking with payment | PaymentIntent created |
| 2 | Enter test card 4242... | Payment succeeds |
| 3 | Verify Stripe Dashboard | Payment recorded |
| 4 | Verify booking status | Updated to confirmed |

#### TC-INT-011: Deposit Payment
| Field | Value |
|-------|-------|
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Select "Pay Deposit (50%)" | Amount = 50% of total |
| 2 | Complete payment | Status = deposit_paid |
| 3 | Verify remaining balance | Tracked correctly |

#### TC-INT-012: Payment Failure
| Field | Value |
|-------|-------|
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Use decline test card (4000000000000002) | Payment fails |
| 2 | Verify error message | User-friendly error shown |
| 3 | Verify booking status | Remains pending_payment |

#### TC-INT-013: Refund Processing
| Field | Value |
|-------|-------|
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Cancel paid booking (7+ days out) | Refund initiated |
| 2 | Verify Stripe | Refund appears |
| 3 | Verify database | refund_amount recorded |

---

### 5.3 AI Integration (Gemini)

#### TC-INT-020: Gemini Response Quality
| Field | Value |
|-------|-------|
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Ask about packages | Accurate pricing returned |
| 2 | Ask about cancellation policy | Correct 7-day/3-day policy |
| 3 | Ask off-topic question | Politely redirects to hibachi topics |
| 4 | Ask with context | Uses conversation history |

#### TC-INT-021: Gemini Fallback
| Field | Value |
|-------|-------|
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Simulate Gemini unavailable | Pattern matching activates |
| 2 | Verify response | Still provides helpful info |
| 3 | Verify source | `source: "pattern"` |

---

## 6. Security Testing

### 6.1 Rate Limiting

#### TC-SEC-001: Booking Rate Limit
| Field | Value |
|-------|-------|
| **Limit** | 10 bookings/hour per IP |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Make 10 booking requests | All succeed |
| 2 | Make 11th request | Status 429, rate limit error |
| 3 | Wait 1 hour | Limit resets |

#### TC-SEC-002: Admin Login Rate Limit
| Field | Value |
|-------|-------|
| **Limit** | 5 attempts/15min per IP |
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Make 5 failed login attempts | All return 401 |
| 2 | Make 6th attempt | Status 429 |
| 3 | Response includes retry info | `retryAfter: 15` |

#### TC-SEC-003: Chatbot Rate Limit
| Field | Value |
|-------|-------|
| **Limit** | 30 messages/15min per IP |
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send 30 messages | All succeed |
| 2 | Send 31st message | Status 429 |

#### TC-SEC-004: IPv6 Rate Limiting
| Field | Value |
|-------|-------|
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send requests from IPv6 address | Rate limiting works |
| 2 | Verify /64 subnet normalization | Prevents subnet rotation bypass |

---

### 6.2 Authentication & Authorization

#### TC-SEC-010: Admin Endpoint Protection
| Field | Value |
|-------|-------|
| **Priority** | P0 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Access /api/admin/stats without token | Status 401 |
| 2 | Access with invalid token | Status 401 |
| 3 | Access with expired token | Status 401 |
| 4 | Access with valid token | Status 200 |

#### TC-SEC-011: Booking Lookup Authorization
| Field | Value |
|-------|-------|
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Lookup with wrong email | 404 Not Found |
| 2 | Cannot enumerate bookings | No information leak |

#### TC-SEC-012: Session Management
| Field | Value |
|-------|-------|
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login creates session | Token returned |
| 2 | Session expires after 24h | Token invalidated |
| 3 | Logout invalidates session | Token no longer works |

---

### 6.3 Input Validation

#### TC-SEC-020: SQL Injection Prevention
| Field | Value |
|-------|-------|
| **Priority** | P0 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit booking with `contactName: "'; DROP TABLE bookings;--"` | Request processed safely |
| 2 | Verify database | Tables intact, value escaped |

#### TC-SEC-021: XSS Prevention
| Field | Value |
|-------|-------|
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit contact with `<script>` in message | Scripts stripped |
| 2 | Verify stored data | Sanitized content |

#### TC-SEC-022: Email Validation
| Field | Value |
|-------|-------|
| **Priority** | P1 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Submit with invalid email formats | Rejected with error |
| 2 | Verify regex pattern | Catches common invalid formats |

---

## 7. Performance Testing

### 7.1 Response Time Benchmarks

| Endpoint | Target | Max Acceptable |
|----------|--------|----------------|
| `GET /health` | < 50ms | < 200ms |
| `POST /api/bookings` | < 500ms | < 2s |
| `POST /api/chatbot/message` | < 3s | < 10s (Gemini) |
| `GET /api/admin/stats` | < 1s | < 3s |
| `POST /api/payments/create-intent` | < 1s | < 3s |

### 7.2 Load Testing Scenarios

#### TC-PERF-001: Concurrent Booking Requests
| Field | Value |
|-------|-------|
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send 50 concurrent booking requests | All processed |
| 2 | Verify no duplicates | Unique confirmation numbers |
| 3 | Verify response times | Within acceptable range |

#### TC-PERF-002: Chatbot Under Load
| Field | Value |
|-------|-------|
| **Priority** | P2 |

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Send 100 concurrent chat messages | All responded |
| 2 | Verify Gemini queuing | Graceful handling |
| 3 | Verify fallback activation | Pattern matching if Gemini overloaded |

---

## 8. Regression Test Checklist

### 8.1 Pre-Deployment Smoke Tests

Run before every production deployment:

- [ ] **TC-API-001**: Health check returns 200
- [ ] **TC-API-010**: Create booking works
- [ ] **TC-API-030**: Payment intent creation works
- [ ] **TC-API-060**: Admin login works
- [ ] **TC-API-050**: Chatbot responds
- [ ] **TC-UI-001**: Booking funnel completes
- [ ] **TC-INT-001**: Confirmation email sends

### 8.2 Post-Deployment Verification

Run immediately after deployment:

- [ ] Check Cloud Run revision is serving traffic
- [ ] Verify database connectivity
- [ ] Test live booking creation
- [ ] Test live payment (test mode)
- [ ] Verify chatbot Gemini status
- [ ] Check admin dashboard loads

### 8.3 Weekly Regression Suite

| Category | Test Cases | Duration |
|----------|------------|----------|
| API Tests | TC-API-001 to TC-API-071 | ~30 min |
| UI Tests | TC-UI-001 to TC-UI-053 | ~45 min |
| Integration | TC-INT-001 to TC-INT-021 | ~20 min |
| Security | TC-SEC-001 to TC-SEC-022 | ~15 min |
| **Total** | **All** | **~2 hours** |

---

## Appendix A: Test Data

### A.1 Stripe Test Cards

| Scenario | Card Number |
|----------|-------------|
| Success | 4242 4242 4242 4242 |
| Decline | 4000 0000 0000 0002 |
| Insufficient Funds | 4000 0000 0000 9995 |
| Expired | 4000 0000 0000 0069 |
| 3D Secure Required | 4000 0027 6000 3184 |

### A.2 Test Email Addresses

| Purpose | Email |
|---------|-------|
| Standard Test | test@example.com |
| Bounce Test | bounce@simulator.amazonses.com |
| Complaint Test | complaint@simulator.amazonses.com |

### A.3 Package Pricing Reference

| Package | Adult Price | Child Price (50%) |
|---------|-------------|-------------------|
| Essential | $65 | $32.50 |
| Signature | $75 | $37.50 |
| Premium | $95 | $47.50 |

### A.4 Cancellation Policy Reference

| Days Before Event | Refund % |
|-------------------|----------|
| > 7 days | 100% |
| 3-7 days | 50% |
| < 3 days | 0% |

---

## Appendix B: Bug Report Template

```markdown
## Bug Report

**Title:** [Short description]

**Environment:** Production / Development
**Browser/Client:** [Chrome 120, Postman, etc.]
**Date:** [YYYY-MM-DD]

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**


**Actual Result:**


**Screenshots/Logs:**


**Severity:** Critical / High / Medium / Low

**Related Test Case:** TC-XXX-NNN
```

---

## Appendix C: API Testing with cURL

### Create Booking
```bash
curl -X POST https://chefweb-backend-775848565797.us-central1.run.app/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "serviceState": "CA",
    "city": "San Francisco",
    "eventDate": "2026-03-15",
    "eventTime": "18:00",
    "numAdults": 10,
    "numChildren": 0,
    "package": "signature",
    "contactName": "Test User",
    "contactEmail": "test@example.com",
    "contactPhone": "(555) 123-4567",
    "agreeToTerms": true,
    "paymentOption": "later"
  }'
```

### Chatbot Message
```bash
curl -X POST https://chefweb-backend-775848565797.us-central1.run.app/api/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message": "What packages do you offer?"}'
```

### Admin Login
```bash
curl -X POST https://chefweb-backend-775848565797.us-central1.run.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "YOUR_ADMIN_API_KEY"}'
```

### Admin Stats (with token)
```bash
curl https://chefweb-backend-775848565797.us-central1.run.app/api/admin/stats \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

---

*End of Test Plan Document*
