## January 21, 2026 Update (CEO Requirements)

**Brand:** POP Habachi (update logo + name everywhere)  
**Primary Service Area:** San Francisco Bay Area  
**Extended Service:** Up to 300 miles with travel fee  
**Party Types:** Birthday, Friendsgiving, Business, Other  
**Homepage Menu Callout:** “$60 per person includes” list (salad, chicken, shrimp, lobster, etc.)  
**Allergy Capture:** Must be highly visible and emphasized in booking flow  
**Booking Steps:** Reduce to 4–5 total steps (current 7 is too long)

---

1) Start from the business objective (so scope stays tight)

For this category, the website’s job is usually one primary conversion:

Book now (instant booking + deposit), or

Request a quote (lead capture + human follow-up)

Hibachi Omakase is a “conversion-first” site: clear offer, strong social proof, and heavy emphasis on service area + booking entry points. 
hibachiomakase.com
+1

2) Divide the project into 6 workstreams (clean ownership)

Product & Ops (what you sell + how you fulfill)

Packages/pricing rules (per-person, minimum spend, add-ons)

Service area rules (city/region, travel fee, indoor/outdoor constraints)

Policies (cancellation, refunds, gratuity, allergy disclaimers)

IA + UX (Information Architecture + user flows)

Sitemap

Booking funnel flow

Edge cases (date unavailable, travel fee, minimum spend not met, multi-chef events)

UI Design (Figma)

Design system + components

Responsive templates

High-fidelity prototype (clickable)

Engineering

Frontend site

Booking + payments + notifications

Admin ops panel (even if minimal)

Content + SEO

Photos/video, menu copy, FAQs

Location landing pages (high ROI in this niche)

Legal + Trust

Terms, privacy, insurance requests, safety notes
Hibachi Omakase explicitly surfaces terms and related policies in the footer. 
hibachiomakase.com

3) Define your MVP using a proven page/module map

A strong MVP often looks like this (mirrors what works on the reference site):

Public pages (customer-facing)

Home / Landing: “how it works”, menu highlights, pricing anchor, reviews, CTA

Hibachi Omakase shows “How it works” + per-person pricing + add-ons + minimum spend on the homepage. 
hibachiomakase.com

Menu / Packages: package tiers, inclusions, add-ons, dietary notes

Service Area: selectable regions (or “enter ZIP code”) + travel fee logic

They list many states/regions prominently and drive booking by location. 
hibachiomakase.com

Booking (the funnel entry)

Gallery

Reviews

FAQ

Their FAQ addresses cost, minimum spend, host setup responsibilities, payment norms. 
hibachiomakase.com

Contact

Optional but powerful:

Referral / Rewards

They run a referral program with explicit reward tiers and redemption steps. 
hibachiomakase.com

Booking funnel (MVP flow)

A clean, high-converting sequence (reduced to 4–5 steps):

1) **Location & Date** (Bay Area vs 300‑mile range + travel fee visibility)

2) **Party Details** (party size + party type)

3) **Package & Add-ons** (combined)

4) **Contact + Allergies + Payment** (combined; allergy block must be prominent)

Reference pattern notes:

They emphasize host provides tables/chairs/utensils; vendor brings chef + grill, etc. 
hibachiomakase.com
+1

Their location pages describe a post-booking operational touchpoint (confirmation email + support follow-up before event). 
hibachiomakase.com

Admin (operator-facing) — keep minimal but real

You need at least:

Booking list (status: new/confirmed/completed/cancelled)

Calendar view (availability blocks)

Assignment (which chef/team)

Pricing overrides (travel fee, peak dates)

Message templates (confirmation, reminders)

4) Most efficient prototyping approach (Figma) that actually speeds engineering

If you want efficiency, don’t start with “beautiful screens.” Start with structure + reusable components.

Figma workflow (fast + engineering-friendly)

Sitemap + user flow diagram (same file)

Home → Service area → Booking → Confirmation

Home → FAQ/Reviews → Booking

Low-fi wireframes (greyscale)

6–8 core screens only: Home, Packages, Service Area, Booking steps, Confirmation, Admin list (optional)

Design system “lite”

Tokens: type scale, spacing, radius, shadow, brand colors

Components: Nav, Hero, CTA block, Pricing card, Review card, Form fields, Stepper, Footer
This is where you gain speed: the whole site becomes recombination of components.

High-fi prototype (only for conversion-critical paths)

Prototype only the booking funnel + key CTAs

Add microcopy rules (validation errors, minimum spend messaging)

Handoff-ready specs

Component states (default/hover/disabled/error)

Responsive behavior notes (breakpoints, stacking rules)

Form rules (required fields, constraints)

Practical acceleration tips

Use an existing UI kit (Webflow/Material/Tailwind-based kits) as your component baseline, then brand it.

Keep imagery “real”: food/service businesses live or die by photos; design around actual assets early.

Prototype the operations reality: travel fee, minimum spend, deposits, cancellation policy—these are not “later.”

5) Build strategy choices (efficiency-first)
Option A — Fastest MVP (recommended for first launch)

Marketing site on a visual builder (e.g., Webflow/Framer)

Booking via a proven scheduling tool + payments (deposit)

Lightweight backend for lead/booking storage (Airtable/Notion/Sheets + automation)

Best when: you need to launch quickly and validate demand.

Option B — Custom build (recommended once ops complexity grows)

Next.js (or similar) + headless CMS for content

Custom booking engine (availability, pricing rules, travel zones)

Stripe for payments + email/SMS notifications

Admin console for scheduling + assignment

Best when: multiple chefs/regions, dynamic pricing, heavy SEO landing pages, or you want full control.

6) A milestone plan you can execute (sequence, not “big-bang”)

Milestone 1: Scope lock

Packages/pricing rules, service area model, deposit/policy decisions

Milestone 2: Prototype

Sitemap + booking flow + hi-fi booking prototype + core components

Milestone 3: MVP build

Public pages + booking + confirmation messaging + basic admin booking list

Milestone 4: Growth layer

Location landing pages + reviews pipeline + referral program + analytics tuning

If you want, I can turn the above into a PRD-style document (requirements + user stories + acceptance criteria) specifically for an “at-home private chef booking website,” using this same structure and focusing the MVP on the booking funnel.

develop a clear UI/UX interaction design logic, don't need care the backend things, just make sure all business logic showing clearly and meeting the website objective. and then according to these logic give me clear website development PRD(focus on UI/UX)---that could directly pass to coding agent that will develop a UX/UI design which could meet all business requirement(all details should be considered-- review card, where put the photo and any others) 
Thought for 1m 32s

Below is a UI/UX-first interaction design logic and a frontend-focused PRD that a coding agent can implement directly (no backend assumptions beyond “submit booking request” and “show confirmation”).

I’m using Hibachi Omakase as the pattern reference for: (a) clear “How it works” + host responsibilities, (b) pricing/minimum-spend logic, (c) location-first booking entry, (d) heavy social proof with Google reviews, and (e) large-group “request a quote” path. 
Hibachi Omakase - Hibachi At Home
+2
Hibachi Omakase - Hibachi At Home
+2

A) UI/UX Interaction Design Logic (Business Logic → UX)
A1. Website objective and conversion model

Primary objective (North Star): Visitor completes Booking Request (or “Book Now” submission).
Secondary objectives: Call/Text click, “Request a Quote” (large events), view service area confirmation, view menu/packages, submit photos (UGC).
Reference pattern: strong “BOOK NOW” + state/city entry points and visible phone call-to-action. 
Hibachi Omakase - Hibachi At Home

A2. The “must-be-clear” business rules (UI must express them explicitly)

Pricing model: per-person pricing (adult/child), upgrades/add-ons, and a minimum spend. 
Hibachi Omakase - Hibachi At Home
+1

Service area: user must confirm where service is offered (state/city/ZIP) before they invest effort in booking. Hibachi Omakase pushes “Select your state” early. 
Hibachi Omakase - Hibachi At Home

Travel fee variability: may apply “depending on location” → UI must show a travel-fee state: Included / Estimated / To be confirmed. 
Hibachi Omakase - Hibachi At Home
+1

Large party handling: above a threshold, additional chefs or a different fulfillment mode (e.g., buffet/quote). 
Hibachi Omakase - Hibachi At Home
+1

Setup responsibilities: what host provides vs what chef team provides (trust + reduces day-of surprises). 
Hibachi Omakase - Hibachi At Home
+1

Allergy & dietary capture: must be explicitly collected during request to reduce risk and increase confidence. 
helpcenter.takeachef.com
+2
Food Allergy Canada
+2

Payment posture (UX copy only): deposit vs pay-on-day must be stated clearly. Hibachi Omakase indicates cash-only/no deposit; other platforms use payment to reserve—your UI should support either. 
Hibachi Omakase - Hibachi At Home
+1

A3. The conversion architecture (what the UI should do)

To minimize drop-off, use a two-layer funnel:

Layer 1: “Instant clarity” on the landing page (30 seconds)

Visitor must understand:

What the experience is (“private chef at your home”)

How it works (3 steps)

Starting price + minimum spend

Where it’s available (service area picker)

Social proof (rating summary + review highlights)

Primary CTA (Start booking)

This mirrors the reference site: “How it works”, pricing/minimum, location selector, and Google-review embed on the homepage. 
Hibachi Omakase - Hibachi At Home

Layer 2: Booking funnel (multi-step form, low cognitive load)

A multi-step form with a progress indicator is strongly recommended to reduce perceived complexity and increase completion. 
Reform
+3
Nielsen Norman Group
+3
B13
+3

Core principle: show a live price summary in a sidebar (desktop) or sticky summary drawer (mobile), so business logic stays transparent throughout.

A4. Critical UX patterns (non-negotiable)

Progress indicator (“Step 2 of 6”) + ability to go back without losing inputs. 
Nielsen Norman Group
+2
B13
+2

Inline validation (field-level errors, not just top-of-form).

Price transparency: always show base + upgrades + travel fee state + minimum spend rule. 
Hibachi Omakase - Hibachi At Home
+1

Trust near CTAs: ratings + insurance/license note (if applicable) + clear responsibilities. 
Hibachi Omakase - Hibachi At Home
+1

Safety capture: allergy/dietary capture is required, plus disclaimer copy. 
Food Allergy Canada
+1

B) UI/UX-Focused Website PRD (Pass to Coding Agent)
B1. Product summary

Product: Independent website for “Private Chef On-Door Service” (at-home chef experience).
Goal: Convert traffic into qualified bookings with minimal friction, high trust, and explicit pricing/setup logic.

In scope

Public website pages + booking request funnel UI

UI components and states

Responsive layouts (desktop-first, mobile supported)

Content slots and component contracts

Out of scope (explicitly)

Backend systems, chef assignment engine, payment processing implementation (UI text may reference policy)

Admin panel

B2. Target users and key scenarios

Host planning a party (birthday / family gathering)

Wants price estimate, availability, and clear requirements.

Corporate/large event planner

Needs quote path and confidence in process.

Returning customer

Wants quick re-booking and trust signals.

B3. Information architecture (routes)

Top nav (desktop) / hamburger (mobile):

Home

Packages/Menu

Service Areas

Gallery

Reviews

FAQ

Contact

Book Now (primary button)

Reference has similar top-level structure (Gallery/FAQ/Contact/Reviews) plus location emphasis. 
Hibachi Omakase - Hibachi At Home
+1

B4. Primary user flows
Flow 1: Standard booking (most users)

Home → Start booking → Multi-step booking → Confirmation page

Flow 2: Location-first entry (high-intent SEO traffic)

Service Area page or Location landing page → Start booking pre-filled with location → Funnel → Confirmation
(Location pages can include service coverage + travel fee note + timeline expectations.) 
Hibachi Omakase - Hibachi At Home
+1

Flow 3: Large party / special service quote

Home or Packages → “Large Event (50+) / Buffet / Corporate” → Request a Quote form
Reference: “For groups of 50 or more… Request A Quote.” 
Hibachi Omakase - Hibachi At Home

Flow 4: Trust-building loop

Home → Reviews → Book Now
Home → Gallery → Book Now
Home → FAQ (setup/allergy) → Book Now 
Hibachi Omakase - Hibachi At Home
+1

B5. Booking funnel UX spec (multi-step form)
Step structure (final 4 steps)

Use a stepper + “Step X of 4” progress indicator. 
Nielsen Norman Group
+2
B13
+2

Step 1 — Service area + date/time

Fields:

Service area selector (State/City/ZIP)

Preferred date

Preferred time window (e.g., 5–7pm)

UX rules:

If outside coverage: show alternate contact CTA (“Request availability”) and do not proceed normally.

Copy must highlight “Price may vary by location / travel fee may apply” when relevant. 
Hibachi Omakase - Hibachi At Home
+1

Step 2 — Party size

Fields:

Adults (required, integer)

Children (optional, integer)

Business logic display:

Show per-person pricing (adult/child)

Show minimum spend rule and whether party currently meets it (pass/fail)

If party size triggers additional chefs: display notice (e.g., “30+ adults may require 2 chefs”). 
Hibachi Omakase - Hibachi At Home
+1

Step 3 — Package selection + add-ons

UI: package cards (radio selection)

Each package card must show:

Title + 1-line value proposition

Included items (3–6 bullets)

Starting price basis (e.g., per-person)

Duration estimate (if relevant)

Include a “Large Event / Buffet / Corporate” card that routes to Quote flow. 
Hibachi Omakase - Hibachi At Home
+1

UI: package cards + “Add-on chips” + quantity controls (where relevant)

Requirements:

Clearly label included choices vs paid upgrades (e.g., premium protein upgrades). 
Hibachi Omakase - Hibachi At Home

Always keep a Live Price Summary visible (desktop sidebar; mobile sticky drawer):

Base subtotal

Add-ons subtotal

Travel fee state (Included/Estimated/TBD) 
Hibachi Omakase - Hibachi At Home

Minimum spend rule reminder (if failing)

Estimated total

Step 4 — Event details + contact + payment

Fields:

Address (street, city, ZIP)

Venue type (Backyard/Patio/Balcony/Indoor-with-outdoor-cooking option)

Notes: parking, access, stairs, etc.

Required informational module (“Setup checklist”):

“Host provides: tables/chairs, plates/utensils” style statement. 
Hibachi Omakase - Hibachi At Home
+1

“We bring: chef + equipment/grill + ingredients” style statement. 
Hibachi Omakase - Hibachi At Home
+1

Dietary section (required):

Allergy toggle: Yes/No

Free-text restrictions field + common chips (vegetarian, gluten-free, etc.)

Safety microcopy: “Please list all allergies; chefs can often accommodate when noted in advance.” 
helpcenter.takeachef.com
+2
Food Allergy Canada
+2

Contact section (required):

Name, phone, email

Preferred contact method (SMS/Call/Email)

Payment section (required):

Deposit/full/later options

Card details when paying now

Policy copy slot:

Payment posture (“deposit required” or “pay on event day”) is content-configurable; reference shows both patterns exist. 
Hibachi Omakase - Hibachi At Home
+1

Submission → Confirmation page (UI only)

Confirmation must include:

“Request received” headline

Summary of selections (location/date/party/package/add-ons)

Next steps timeline (e.g., “We’ll contact you X days before”) — reference uses “customer support will contact you 6 days in advance.” 
Hibachi Omakase - Hibachi At Home

Contact options: phone/text buttons + link to FAQ

B6. Page-by-page UI requirements
1) Home page (highest conversion)

Above the fold (hero)

Left: headline + subheadline + trust bullets (e.g., “At-home chef experience”, “Customizable menu”, “Service area coverage”)

Right: “Start booking” quick module:

Service area

Date

Party size

CTA: “See estimate”

A secondary CTA: “View Packages”

Section order (recommended)

Hero + quick-start booking

“How it works” (3 steps) 
Hibachi Omakase - Hibachi At Home

Pricing anchor + minimum spend explanation 
Hibachi Omakase - Hibachi At Home
+1

Package highlights

Social proof (rating summary + top reviews)

Service areas (browse by state/city)

FAQ preview (top 6 questions)

Final CTA band (Book Now)

2) Packages/Menu page

Must support:

Tier comparison table (sticky headers on desktop)

Add-ons section (chips/cards)

Dietary note block: “Tell us in booking form” 
helpcenter.takeachef.com

Primary CTA persists: “Start booking” sticky button

3) Service Areas page

UI:

Search (ZIP/city)

Region cards (state/city)

Each card: “Typical travel fee policy” (Included/May apply/TBD) and “Book” CTA
Reference: strong state selection module on homepage. 
Hibachi Omakase - Hibachi At Home

4) Location landing page template (SEO + conversion)

Must include:

Local headline (“Private Chef at Home in {City/State}”)

“How it works” + responsibilities 
Hibachi Omakase - Hibachi At Home
+1

Service coverage text + travel fee note 
Hibachi Omakase - Hibachi At Home

Local gallery strip

Local reviews strip

Booking CTA (pre-fills location)

5) Reviews page

Top block

Rating summary card:

Average rating (stars)

Total review count

Source badge (“Google”) — reference uses Google-verified review embed language. 
Hibachi Omakase - Hibachi At Home

Review card spec (component)

Layout:

Left: avatar (initials) OR small user photo (optional)

Right: name + star rating + date (if available)

Body: 2–4 lines with “Read more”

Footer: source verification badge (“Verified via Google” style)

Sorting/filter:

“Most recent”, “Highest rating”

Keyword search optional

6) Gallery page

Masonry grid with lightbox

“Share your photos & videos” submission module (UGC) — reference has an upload form on Gallery. 
Hibachi Omakase - Hibachi At Home

7) FAQ page

Accordion component, grouped:

Pricing/minimum spend 
Hibachi Omakase - Hibachi At Home

Setup responsibilities 
Hibachi Omakase - Hibachi At Home
+1

Indoor/outdoor constraints

Allergies/dietary 
Hibachi Omakase - Hibachi At Home
+1

Booking changes and contact

8) Contact page

Contact options (call/text/email)

Simple form (Reason dropdown + message) — reference includes “what would you like to share” type categorization. 
Hibachi Omakase - Hibachi At Home

9) Rewards / Referral page (optional but strong growth loop)

Show simple actions and incentives (UGC/reposts) — reference Rewards page lists specific actions. 
Hibachi Omakase - Hibachi At Home

CTA to upload media (re-use gallery upload component) 
Hibachi Omakase - Hibachi At Home

B7. Core UI components (inventory + requirements)
Global components

Header (logo, nav, Book Now CTA)

Sticky CTA behavior:

Desktop: header CTA

Mobile: bottom sticky bar (“Book Now” + “Call/Text”)

Conversion components

Quick-start booking widget (Home hero)

Multi-step booking form

Stepper + progress

Back/Next

Save draft locally (optional; localStorage acceptable)

Live Price Summary

Desktop: right sidebar

Mobile: sticky drawer sheet

Package card

Selected state, hover, disabled (if incompatible with party size)

Add-on chip/card

Toggle or quantity stepper

Review card (spec in B6)

FAQ accordion

Gallery masonry + lightbox

Trust band

“Licensed/insured” copy slot if true; reference mentions insured and provides an insurance request form link. 
Hibachi Omakase - Hibachi At Home
+1

B8. Form UX rules (detailed)

Use grouped fields and minimize cognitive load; each step should be “one topic.” 
Nielsen Norman Group
+1

Validation:

Inline errors

Disable Next until required fields valid

Microcopy:

Minimum spend: show example math (e.g., “If minimum is $500, you need 10 adults at $50”). Reference-style FAQs often use explicit minimum-spend statements. 
Hibachi Omakase - Hibachi At Home
+1

Allergies:

Required confirmation checkbox: “I have disclosed all known allergies/restrictions”

“Note in advance” emphasis 
Food Allergy Canada
+1

B9. Responsive layout requirements

Breakpoints (recommended):

Mobile: ≤ 480

Tablet: 481–1024

Desktop: ≥ 1025

Rules:

Live Price Summary becomes a sticky collapsed bar on mobile (tap to expand).

Review cards switch from 2-column to 1-column.

Gallery uses 1 column (mobile), 2–3 columns (tablet), 3–5 columns (desktop).

B10. Accessibility and usability

Keyboard navigation for all controls

Proper label associations for form fields

Focus states visible

Accordion and stepper are ARIA-compliant

Color contrast meets WCAG AA (practically required for booking forms)

B11. Acceptance criteria (what “done” means for UI/UX)

A first-time user can:

Identify pricing + minimum spend within 15 seconds on Home

Confirm service area availability within 1 interaction

Complete booking request in ≤ 4 steps with clear progress feedback 
Nielsen Norman Group
+2
B13
+2

All business rules display correctly in UI:

Minimum spend pass/fail

Travel fee state visible where applicable 
Hibachi Omakase - Hibachi At Home

Large-party path routes to Quote flow 
Hibachi Omakase - Hibachi At Home

Social proof is visible before the user reaches the final CTA (reviews strip on Home). 
Hibachi Omakase - Hibachi At Home

Allergy/dietary capture exists and is prominent in booking flow