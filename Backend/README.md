# ChefWeb Backend

Minimal Express backend scaffold aligned to frontend contracts.

## Setup

1. Create an env file:

```
cp .env.example .env
```

2. Install dependencies:

```
npm install
```

3. Run locally:

```
npm run dev
```

## Key Endpoints

- GET /health
- GET /api/config/stripe
- POST /api/payments/create-intent
- POST /api/chatbot/message
- GET /api/videos/homepage
- POST /api/analytics/video
- POST /api/bookings

## Notes

- Payment flows are stubbed for now and must be wired to Stripe server-side SDK.
- Storage is in-memory for development and should be replaced with PostgreSQL.
