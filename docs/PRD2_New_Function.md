# PRD2: Frontend New Functions - POP Habachi Enhancement

**Document Version:** 1.1  
**Date:** January 21, 2026  
**Project:** POP Habachi Full-Stack Development  
**Scope:** Frontend Enhancements for Video Player, AI Chatbot, and Payment Integration

---

## 1. Executive Summary

This PRD details three critical frontend enhancements to transform POP Habachi from a static marketing site into a fully functional booking platform:

1. **Video Player Module** - Owner-uploaded promotional videos on homepage
2. **AI Chatbot Assistant** - Intelligent booking support and FAQ automation
3. **Payment Integration** - Stripe-powered deposit and full payment system (US)

### Business Objectives
- **Increase Conversion Rate**: Video content increases engagement by 80%
- **Reduce Support Load**: AI chatbot handles 70% of pre-booking inquiries
- **Enable Instant Booking**: Deposit payment secures bookings without manual intervention
- **Improve Trust**: Payment processing through Stripe increases credibility

---

## 2. Current Frontend Analysis

### 2.1 Existing Structure
```
ChefWeb/docs/
├── css/
│   ├── reset.css           (Base reset)
│   ├── variables.css       (Design tokens)
│   ├── global.css         (Utilities)
│   └── components.css     (5342 lines - all components)
├── js/
│   ├── main.js            (Global utilities, mobile menu)
│   ├── components.js      (Modal stack, accordion, stepper)
│   ├── home.js            (Quick booking widget)
│   ├── booking.js         (1238 lines - multi-step funnel)
│   ├── gallery.js         (Gallery + lightbox + UGC)
│   ├── reviews.js         (Review display + filtering)
│   ├── contact.js         (Contact form)
│   └── confirmation.js    (Booking confirmation)
└── pages/
    ├── booking.html       (4-step funnel)
    ├── confirmation.html
    ├── packages.html
    ├── gallery.html
    ├── reviews.html
    ├── faq.html
    └── contact.html
```

### 2.2 Key Components Already Implemented
- ✅ Multi-step booking funnel (4 steps with progress stepper)
- ✅ Price calculation engine (base + add-ons + travel fee)
- ✅ SessionStorage state management
- ✅ Form validation framework
- ✅ Modal system with stack management
- ✅ Responsive grid layout
- ✅ Component library (buttons, cards, chips, accordions)

### 2.3 Identified Gaps for New Functions
1. No video embedding capability
2. No conversational UI patterns (chat interface)
3. No payment form components
4. No Stripe integration hooks
5. No video upload/management interface

---

## 3. Feature 1: Video Player Module

### 3.1 Business Requirements

**Primary Goal**: Display owner-uploaded promotional videos on the homepage to increase engagement and showcase chef experiences visually.

---

## 4. CEO Requirements Update (January 21, 2026)

### 4.1 Branding
- **Brand Name**: POP Habachi
- **Logo**: Must be present in header and footer. Provide a logo asset and apply consistently.

### 4.2 Service Area & Travel Fee
- **Primary Service Area**: San Francisco Bay Area.
- **Occasional Service**: Up to 300 miles outside the Bay Area.
- **Travel Fee**: Charged for travel beyond the Bay Area; displayed clearly during booking and in summary.

### 4.3 Party Type Field
- Add a **Party Type** selector (single-select, high-level categories).
- Suggested options: **Birthday**, **Friendsgiving**, **Business**, **Other**.

### 4.4 Menu Presentation on Homepage
- Show a **“$60 per person includes”** food list on the homepage.
- Provide a clear list of typical items (e.g., salad, chicken, shrimp, lobster).
- This is a marketing list; final menu varies by package.

### 4.5 Allergy Section Prominence
- Allergy input must be **highly visible**, visually emphasized, and not buried.
- Add a strong warning style and clear CTA for specifying allergies.

### 4.6 Booking Flow Simplification
- Reduced to **4 steps** to minimize drop-off while preserving required info.
- Goal: reduce drop-off and fatigue while preserving required info.

---

## 5. Booking Flow (Simplified)

### Proposed 4-Step Flow (Recommended)
1. **Location & Date** (service area + travel fee visibility)
2. **Party Details** (party size + party type)
3. **Package & Add-ons** (combine Step 3 & 4)
4. **Contact + Allergies + Payment** (combine Step 5–7 with prominent allergy block)

**Acceptance Criteria**:
- [x] Booking steps reduced from 7 to 4–5
- [x] Party Type captured in Step 2
- [x] Allergies block visible above dietary preferences in final step
- [x] Payment can remain embedded in final step (Stripe Elements)

---

## 6. Menu List on Homepage

### Requirements
- Add a **“$60 per person includes”** block in the pricing or package section.
- Display **4–6 food items** (e.g., salad, chicken, shrimp, lobster).
- Ensure copy is adjustable from CMS later.

**Acceptance Criteria**:
- [ ] Menu list is visible without scrolling on desktop.
- [ ] Menu list is clear and readable on mobile.
- [ ] Menu list does not conflict with package pricing tiers.

**Key Metrics**:
- Video view rate: Target 60% of homepage visitors
- Video completion rate: Target 40% watch to end
- Video-to-booking conversion: Track users who watched video then booked

### 3.2 Functional Requirements

#### FR1.1: Video Section on Homepage
**Location**: Insert between "How It Works" section and "Pricing Anchor" section  
**Priority**: P0 (Must Have)

**Acceptance Criteria**:
- [ ] Video section appears in homepage flow at designated position
- [ ] Section has clear heading: "See Our Chefs in Action"
- [ ] Section includes subheading describing video content
- [ ] Responsive layout: full-width on mobile, contained on desktop
- [ ] Lazy-loading implemented (video only loads when section is in viewport)

#### FR1.2: Video Player Component
**Priority**: P0 (Must Have)

**Technical Specifications**:
```javascript
// Video Player Component Structure
{
  videoSource: 'url',        // Video URL from backend
  thumbnail: 'url',          // Poster image URL
  title: 'string',           // Video title
  duration: 'number',        // Duration in seconds
  autoplay: false,           // Never autoplay (UX best practice)
  controls: true,            // Show native controls
  muted: false,              // Start unmuted
  playsinline: true,         // Mobile inline playback
}
```

**Player Features**:
- [ ] Custom play button overlay on thumbnail
- [ ] Play/pause toggle
- [ ] Volume control
- [ ] Fullscreen capability
- [ ] Progress bar with scrubbing
- [ ] Current time / total duration display
- [ ] Keyboard controls (Space = play/pause, Arrow keys = seek)

**Acceptance Criteria**:
- [ ] Video plays smoothly without buffering on 5Mbps connection
- [ ] Player works on Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- [ ] Mobile responsive (iOS Safari, Android Chrome)
- [ ] ARIA labels for accessibility (play/pause buttons, progress bar)
- [ ] Loading spinner while video buffers
- [ ] Error state with fallback message if video fails to load

#### FR1.3: Video Analytics Tracking
**Priority**: P1 (Should Have)

**Events to Track**:
```javascript
{
  video_view_start: { video_id, user_session },
  video_25_percent: { video_id, user_session },
  video_50_percent: { video_id, user_session },
  video_75_percent: { video_id, user_session },
  video_complete: { video_id, user_session },
  video_error: { video_id, error_message }
}
```

**Acceptance Criteria**:
- [ ] Analytics events fire correctly
- [ ] Events include timestamp and session ID
- [ ] No duplicate event firing (debounce)
- [ ] Works with Google Analytics 4 or custom backend

#### FR1.4: Multiple Videos Support (Future)
**Priority**: P2 (Could Have)

**UI Pattern**: Carousel or grid of video thumbnails  
**Acceptance Criteria**:
- [ ] Up to 5 videos can be displayed
- [ ] Next/Previous navigation
- [ ] Active video indicator
- [ ] Swipe gesture support on mobile

### 3.3 UI/UX Specifications

#### Layout Desktop (≥1025px)
```
┌────────────────────────────────────────────────────────┐
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │  See Our Chefs in Action                        │ │
│  │  Watch real hibachi performances from our team   │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │                                                  │ │
│  │                                                  │ │
│  │             Video Player                         │ │
│  │             (16:9 ratio)                        │ │
│  │                                                  │ │
│  │                                                  │ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
│  [▶ Play] [Duration] [Volume] [Fullscreen]            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### Layout Mobile (≤768px)
```
┌──────────────────────┐
│ See Our Chefs       │
│ in Action           │
│                     │
│ ┌─────────────────┐ │
│ │                 │ │
│ │  Video Player   │ │
│ │  (16:9 ratio)   │ │
│ │                 │ │
│ └─────────────────┘ │
│                     │
│ [▶][Progress][Vol]  │
└──────────────────────┘
```

### 3.4 Component CSS Specification

```css
/* Video Section */
.video-showcase {
    padding: var(--spacing-4xl) 0;
    background: var(--color-background);
}

.video-showcase__header {
    text-align: center;
    margin-bottom: var(--spacing-2xl);
}

.video-showcase__title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-sm);
}

.video-showcase__subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
}

/* Video Player Container */
.video-player {
    max-width: 900px;
    margin: 0 auto;
    position: relative;
    border-radius: var(--border-radius-lg);
    overflow: hidden;
    box-shadow: var(--shadow-lg);
}

.video-player__container {
    position: relative;
    padding-bottom: 56.25%; /* 16:9 aspect ratio */
    height: 0;
    overflow: hidden;
}

.video-player__video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
}

/* Play Button Overlay */
.video-player__overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: var(--transition-base);
    z-index: 1;
}

.video-player__overlay--hidden {
    opacity: 0;
    pointer-events: none;
}

.video-player__play-button {
    width: 80px;
    height: 80px;
    background: var(--color-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-base);
}

.video-player__play-button:hover {
    transform: scale(1.1);
    background: var(--color-primary-dark);
}

.video-player__play-icon {
    width: 0;
    height: 0;
    border-left: 24px solid white;
    border-top: 16px solid transparent;
    border-bottom: 16px solid transparent;
    margin-left: 6px;
}

/* Loading State */
.video-player__loading {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
}

.video-player__spinner {
    width: 50px;
    height: 50px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Error State */
.video-player__error {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--color-background-alt);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-xl);
    text-align: center;
}

.video-player__error-icon {
    font-size: 48px;
    margin-bottom: var(--spacing-md);
}

.video-player__error-message {
    color: var(--color-text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
    .video-player__play-button {
        width: 60px;
        height: 60px;
    }
    
    .video-player__play-icon {
        border-left-width: 18px;
        border-top-width: 12px;
        border-bottom-width: 12px;
    }
}
```

### 3.5 JavaScript Implementation

```javascript
/**
 * Video Player Component
 * Handles video playback, analytics, and error states
 */

class VideoPlayer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            autoplay: false,
            muted: false,
            controls: true,
            playsinline: true,
            poster: '',
            ...options
        };
        
        this.video = null;
        this.overlay = null;
        this.isPlaying = false;
        this.hasStarted = false;
        this.milestones = { 25: false, 50: false, 75: false, 100: false };
        
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.error('Video container not found');
            return;
        }
        
        this.renderPlayer();
        this.attachEvents();
        this.setupIntersectionObserver();
    }
    
    renderPlayer() {
        this.container.innerHTML = `
            <div class="video-player">
                <div class="video-player__container">
                    <video 
                        class="video-player__video" 
                        poster="${this.options.poster}"
                        ${this.options.playsinline ? 'playsinline' : ''}
                        ${this.options.controls ? 'controls' : ''}
                        ${this.options.muted ? 'muted' : ''}
                        preload="metadata"
                    >
                        <source src="${this.options.src}" type="video/mp4">
                        <p>Your browser doesn't support HTML5 video. <a href="${this.options.src}">Download the video</a>.</p>
                    </video>
                    
                    <div class="video-player__overlay" id="videoOverlay">
                        <button class="video-player__play-button" aria-label="Play video">
                            <div class="video-player__play-icon"></div>
                        </button>
                    </div>
                    
                    <div class="video-player__loading hidden" id="videoLoading">
                        <div class="video-player__spinner"></div>
                    </div>
                    
                    <div class="video-player__error hidden" id="videoError">
                        <div class="video-player__error-icon">⚠️</div>
                        <p class="video-player__error-message">Unable to load video. Please try again later.</p>
                    </div>
                </div>
            </div>
        `;
        
        this.video = this.container.querySelector('.video-player__video');
        this.overlay = this.container.querySelector('.video-player__overlay');
        this.loading = this.container.querySelector('.video-player__loading');
        this.errorDisplay = this.container.querySelector('.video-player__error');
    }
    
    attachEvents() {
        // Play button click
        this.overlay.addEventListener('click', () => this.play());
        
        // Video events
        this.video.addEventListener('play', () => this.onPlay());
        this.video.addEventListener('pause', () => this.onPause());
        this.video.addEventListener('ended', () => this.onEnded());
        this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
        this.video.addEventListener('waiting', () => this.onWaiting());
        this.video.addEventListener('canplay', () => this.onCanPlay());
        this.video.addEventListener('error', (e) => this.onError(e));
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.isInViewport()) {
                e.preventDefault();
                this.toggle();
            }
        });
    }
    
    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.5
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting && this.isPlaying) {
                    this.pause();
                }
            });
        }, options);
        
        observer.observe(this.container);
    }
    
    play() {
        const promise = this.video.play();
        
        if (promise !== undefined) {
            promise
                .then(() => {
                    console.log('Video playback started');
                })
                .catch(error => {
                    console.error('Playback error:', error);
                    this.showError();
                });
        }
    }
    
    pause() {
        this.video.pause();
    }
    
    toggle() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }
    
    onPlay() {
        this.isPlaying = true;
        this.overlay.classList.add('video-player__overlay--hidden');
        
        if (!this.hasStarted) {
            this.hasStarted = true;
            this.trackEvent('video_view_start');
        }
    }
    
    onPause() {
        this.isPlaying = false;
    }
    
    onEnded() {
        this.isPlaying = false;
        this.overlay.classList.remove('video-player__overlay--hidden');
        this.trackEvent('video_complete');
    }
    
    onTimeUpdate() {
        const percent = (this.video.currentTime / this.video.duration) * 100;
        
        // Track milestones
        if (percent >= 25 && !this.milestones[25]) {
            this.milestones[25] = true;
            this.trackEvent('video_25_percent');
        }
        if (percent >= 50 && !this.milestones[50]) {
            this.milestones[50] = true;
            this.trackEvent('video_50_percent');
        }
        if (percent >= 75 && !this.milestones[75]) {
            this.milestones[75] = true;
            this.trackEvent('video_75_percent');
        }
    }
    
    onWaiting() {
        this.loading.classList.remove('hidden');
    }
    
    onCanPlay() {
        this.loading.classList.add('hidden');
    }
    
    onError(e) {
        console.error('Video error:', e);
        this.showError();
        this.trackEvent('video_error', {
            error: this.video.error ? this.video.error.message : 'Unknown error'
        });
    }
    
    showError() {
        this.errorDisplay.classList.remove('hidden');
        this.overlay.classList.add('video-player__overlay--hidden');
    }
    
    isInViewport() {
        const rect = this.container.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    trackEvent(eventName, data = {}) {
        // Integration with analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, {
                video_id: this.options.videoId || 'homepage_video',
                ...data
            });
        }
        
        // Custom backend analytics
        if (this.options.onEvent) {
            this.options.onEvent(eventName, data);
        }
        
        console.log('Video event:', eventName, data);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('videoShowcase')) {
        const player = new VideoPlayer('videoShowcase', {
            src: '/api/videos/homepage',  // Backend endpoint
            poster: '/api/videos/homepage/thumbnail',
            videoId: 'homepage_promo',
            onEvent: (eventName, data) => {
                // Send to backend analytics
                fetch('/api/analytics/video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        event: eventName,
                        ...data,
                        timestamp: new Date().toISOString(),
                        sessionId: sessionStorage.getItem('sessionId')
                    })
                });
            }
        });
    }
});
```

### 3.6 HTML Integration (index.html)

Insert this section after the "How It Works" section (line ~194):

```html
<!-- Video Showcase Section -->
<section class="video-showcase" aria-labelledby="videoShowcaseHeading">
    <div class="container">
        <div class="video-showcase__header">
            <h2 class="video-showcase__title" id="videoShowcaseHeading">
                See Our Chefs in Action
            </h2>
            <p class="video-showcase__subtitle">
                Watch real hibachi performances and see why families love our service
            </p>
        </div>
        
        <div id="videoShowcase"></div>
    </div>
</section>
```

### 3.7 Backend API Requirements (for integration)

```javascript
// GET /api/videos/homepage
// Response:
{
  "videoUrl": "https://cdn.chefweb.com/videos/homepage-promo.mp4",
  "thumbnailUrl": "https://cdn.chefweb.com/videos/homepage-promo-thumb.jpg",
  "title": "ChefWeb Experience",
  "duration": 120,
  "videoId": "vid_abc123"
}

// POST /api/analytics/video
// Request body:
{
  "event": "video_view_start" | "video_25_percent" | "video_50_percent" | "video_75_percent" | "video_complete" | "video_error",
  "videoId": "vid_abc123",
  "sessionId": "session_xyz",
  "timestamp": "2026-01-03T10:30:00Z",
  "error": "optional error message"
}
```

---

## 7. Feature 2: AI Chatbot Assistant

### 4.1 Business Requirements

**Primary Goal**: Provide instant, 24/7 support for booking questions, reduce support workload, and guide users through the booking funnel.

**Key Metrics**:
- Chatbot engagement rate: Target 30% of visitors
- Question resolution rate: Target 70% without human intervention
- Chat-to-booking conversion: Track users who used chat then booked
- Average response time: <2 seconds

### 4.2 Functional Requirements

#### FR2.1: Chat Widget UI
**Priority**: P0 (Must Have)

**Position**: Fixed bottom-right corner on all pages  
**States**: Minimized (bubble), Expanded (chat window), Hidden (optional)

**Acceptance Criteria**:
- [ ] Chat bubble visible on all pages
- [ ] Unread message indicator (red dot with count)
- [ ] Smooth expand/collapse animation
- [ ] Mobile responsive (full-screen on mobile <768px)
- [ ] Z-index above all content except modals
- [ ] Draggable on desktop (optional P2 feature)

#### FR2.2: Chat Interface Components
**Priority**: P0 (Must Have)

**Required UI Elements**:
```html
<!-- Chat Window Structure -->
<div class="chatbot">
  <div class="chatbot__header">
    <div class="chatbot__avatar"></div>
    <div class="chatbot__title">ChefWeb Assistant</div>
    <div class="chatbot__status">Online</div>
    <button class="chatbot__close">×</button>
  </div>
  
  <div class="chatbot__messages">
    <!-- Message bubbles here -->
  </div>
  
  <div class="chatbot__input">
    <textarea placeholder="Ask about booking..."></textarea>
    <button class="chatbot__send">Send</button>
  </div>
  
  <div class="chatbot__quick-replies">
    <!-- Suggested questions -->
  </div>
</div>
```

**Acceptance Criteria**:
- [ ] Message history scrolls automatically to latest message
- [ ] User messages align right, bot messages align left
- [ ] Typing indicator shows when bot is "thinking"
- [ ] Timestamps show for each message
- [ ] Quick reply buttons for common questions
- [ ] Emoji support in messages
- [ ] Link detection and clickable links
- [ ] Image attachments support (for menu photos, etc.)

#### FR2.3: Conversation Flow
**Priority**: P0 (Must Have)

**Welcome Message**:
```
"Hi! 👋 I'm the ChefWeb Assistant. I can help you with:
• Booking information
• Package details
• Pricing questions
• Service area coverage
• Dietary restrictions

How can I help you today?"
```

**Quick Reply Options** (Always visible):
- "How much does it cost?"
- "What areas do you serve?"
- "Tell me about packages"
- "Book now"
- "Dietary restrictions"

**Acceptance Criteria**:
- [ ] Welcome message appears when chat first opens
- [ ] Quick replies trigger predefined responses
- [ ] Context maintained throughout conversation
- [ ] Bot can reference previous messages
- [ ] Conversation persists across page navigation (sessionStorage)
- [ ] Clear conversation button available

#### FR2.4: AI Integration Points
**Priority**: P0 (Must Have)

**Backend AI Service Requirements**:
- Natural language understanding (OpenAI GPT-4 or similar)
- Intent classification:
  - `booking_inquiry`
  - `pricing_question`
  - `service_area_check`
  - `package_comparison`
  - `dietary_restrictions`
  - `general_question`
- Entity extraction (date, location, party size, dietary needs)
- Context awareness (maintain conversation state)

**Response Types**:
```javascript
{
  text: "Based on your party of 15, I recommend the Signature package...",
  quickReplies: ["Tell me more", "See pricing", "Book now"],
  actions: [
    { type: "open_url", url: "/pages/packages.html" },
    { type: "prefill_booking", data: { adults: 15, package: "signature" } }
  ],
  suggestedNextSteps: ["Would you like to see our availability?"]
}
```

**Acceptance Criteria**:
- [ ] AI responds within 2 seconds
- [ ] Responses are contextually relevant
- [ ] Can handle multi-turn conversations
- [ ] Graceful fallback to human support when needed
- [ ] No profanity or inappropriate responses (content filtering)

#### FR2.5: Booking Handoff
**Priority**: P0 (Must Have)

**Scenario**: User asks to book → Bot extracts details → Pre-fills booking form

**Data Extraction**:
- Service state/city
- Event date
- Party size (adults/children)
- Package preference
- Dietary restrictions

**Handoff Flow**:
1. Bot: "Great! Let me help you start your booking. I noticed you mentioned..."
2. Bot shows summary of extracted details
3. Bot: "Does this look correct?"
4. User confirms
5. Bot: "Perfect! I'll take you to the booking page with this information pre-filled."
6. Redirect to `/pages/booking.html?prefill=true` with data in sessionStorage

**Acceptance Criteria**:
- [ ] Extracted data correctly prefills booking form
- [ ] User can edit prefilled information
- [ ] Chat conversation accessible from booking page
- [ ] User can return to chat without losing booking progress

#### FR2.6: Human Handoff
**Priority**: P1 (Should Have)

**Trigger Conditions**:
- User explicitly requests human support ("talk to a person")
- Bot confidence score < 0.6 for 3 consecutive messages
- User expresses frustration (sentiment analysis)
- Complex custom requests (50+ guests, specific dietary needs)

**Handoff Process**:
```
Bot: "I'd like to connect you with our team for personalized assistance. 
     Would you prefer:
     • Call us: (123) 456-7890
     • Text us: (123) 456-7890
     • Email: info@chefweb.com
     • Leave your contact info for a callback"
```

**Acceptance Criteria**:
- [ ] Handoff message clearly indicates next steps
- [ ] Contact methods are clickable (tel:, sms:, mailto:)
- [ ] Callback form collects name, phone, preferred time
- [ ] Handoff notification sent to admin dashboard
- [ ] Chat transcript emailed to support team

### 4.3 UI/UX Specifications

#### Chat Bubble (Minimized State)
```
Position: fixed bottom-right
Desktop: 24px from bottom, 24px from right
Mobile: 16px from bottom, 16px from right

Size: 60px × 60px circle
Background: Primary color (#ff6b35)
Shadow: 0 4px 12px rgba(0,0,0,0.15)
Icon: Chat bubble SVG or emoji 💬

Hover state: Scale 1.1, shadow increases
Unread badge: Red dot (12px) top-right corner
Animation: Subtle pulse every 3s
```

#### Chat Window (Expanded State)
```
Desktop (≥1025px):
  Width: 380px
  Height: 600px
  Position: fixed bottom-right
  Margin: 24px from edges

Tablet (768-1024px):
  Width: 360px
  Height: 500px

Mobile (<768px):
  Full screen overlay
  Width: 100vw
  Height: 100vh
  Z-index: 10000

Border radius: 12px (desktop), 0 (mobile)
Shadow: 0 8px 24px rgba(0,0,0,0.15)
```

#### Message Bubbles
```
User messages:
  Background: Primary color (#ff6b35)
  Text color: White
  Align: right
  Max-width: 75%
  Border-radius: 18px 18px 4px 18px

Bot messages:
  Background: Light gray (#f5f5f5)
  Text color: Dark (#333)
  Align: left
  Max-width: 75%
  Border-radius: 18px 18px 18px 4px
  
Spacing: 8px between messages
Timestamp: Small gray text below message
```

### 4.4 Component CSS Specification

```css
/* Chatbot Widget */
.chatbot-bubble {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 60px;
    height: 60px;
    background: var(--color-primary);
    border-radius: 50%;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: var(--transition-base);
    z-index: 9999;
    animation: pulse 3s infinite;
}

.chatbot-bubble:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.chatbot-bubble__icon {
    font-size: 28px;
}

.chatbot-bubble__badge {
    position: absolute;
    top: -4px;
    right: -4px;
    width: 20px;
    height: 20px;
    background: #e74c3c;
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
}

/* Chat Window */
.chatbot {
    position: fixed;
    bottom: 24px;
    right: 24px;
    width: 380px;
    height: 600px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    z-index: 9999;
    transition: var(--transition-base);
}

.chatbot--hidden {
    transform: scale(0.9);
    opacity: 0;
    pointer-events: none;
}

/* Chat Header */
.chatbot__header {
    padding: var(--spacing-md);
    background: var(--color-primary);
    color: white;
    border-radius: 12px 12px 0 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
}

.chatbot__avatar {
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
}

.chatbot__title {
    flex: 1;
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-lg);
}

.chatbot__status {
    font-size: var(--font-size-sm);
    opacity: 0.9;
}

.chatbot__close {
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    border-radius: 50%;
    transition: var(--transition-base);
}

.chatbot__close:hover {
    background: rgba(255, 255, 255, 0.2);
}

/* Messages Area */
.chatbot__messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-md);
    background: #fafafa;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
}

.chatbot__message {
    display: flex;
    gap: var(--spacing-sm);
    max-width: 75%;
}

.chatbot__message--user {
    align-self: flex-end;
    flex-direction: row-reverse;
}

.chatbot__message--bot {
    align-self: flex-start;
}

.chatbot__message-bubble {
    padding: var(--spacing-sm) var(--spacing-md);
    border-radius: 18px;
    word-wrap: break-word;
}

.chatbot__message--user .chatbot__message-bubble {
    background: var(--color-primary);
    color: white;
    border-radius: 18px 18px 4px 18px;
}

.chatbot__message--bot .chatbot__message-bubble {
    background: white;
    color: var(--color-text);
    border-radius: 18px 18px 18px 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.chatbot__message-time {
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
    margin-top: 4px;
}

/* Typing Indicator */
.chatbot__typing {
    display: flex;
    gap: 4px;
    padding: var(--spacing-sm);
}

.chatbot__typing-dot {
    width: 8px;
    height: 8px;
    background: var(--color-text-secondary);
    border-radius: 50%;
    animation: typing 1.4s infinite;
}

.chatbot__typing-dot:nth-child(2) {
    animation-delay: 0.2s;
}

.chatbot__typing-dot:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-10px); }
}

/* Quick Replies */
.chatbot__quick-replies {
    padding: var(--spacing-sm) var(--spacing-md);
    background: white;
    border-top: 1px solid var(--color-border-light);
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
}

.chatbot__quick-reply {
    padding: var(--spacing-xs) var(--spacing-sm);
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-full);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: var(--transition-base);
}

.chatbot__quick-reply:hover {
    background: var(--color-primary);
    color: white;
    border-color: var(--color-primary);
}

/* Input Area */
.chatbot__input {
    padding: var(--spacing-md);
    background: white;
    border-top: 1px solid var(--color-border-light);
    border-radius: 0 0 12px 12px;
    display: flex;
    gap: var(--spacing-sm);
    align-items: flex-end;
}

.chatbot__textarea {
    flex: 1;
    min-height: 40px;
    max-height: 120px;
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    resize: none;
    font-family: inherit;
    font-size: var(--font-size-base);
}

.chatbot__textarea:focus {
    outline: none;
    border-color: var(--color-primary);
}

.chatbot__send {
    width: 40px;
    height: 40px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: var(--transition-base);
    display: flex;
    align-items: center;
    justify-content: center;
}

.chatbot__send:hover {
    background: var(--color-primary-dark);
}

.chatbot__send:disabled {
    background: var(--color-border);
    cursor: not-allowed;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .chatbot {
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        height: 100%;
        border-radius: 0;
        margin: 0;
    }
    
    .chatbot__header {
        border-radius: 0;
    }
    
    .chatbot-bubble {
        bottom: 16px;
        right: 16px;
    }
}
```

### 4.5 JavaScript Implementation

```javascript
/**
 * AI Chatbot Component
 * Handles chat UI, message flow, and AI integration
 */

class Chatbot {
    constructor(options = {}) {
        this.options = {
            apiEndpoint: '/api/chatbot/message',
            welcomeMessage: "Hi! 👋 I'm the ChefWeb Assistant. How can I help you today?",
            quickReplies: [
                "How much does it cost?",
                "What areas do you serve?",
                "Tell me about packages",
                "Book now"
            ],
            ...options
        };
        
        this.isOpen = false;
        this.conversationId = this.generateConversationId();
        this.messages = [];
        this.isTyping = false;
        
        this.init();
    }
    
    init() {
        this.renderChatbot();
        this.loadConversationHistory();
        this.attachEvents();
        
        // Show welcome message on first load
        if (this.messages.length === 0) {
            this.addMessage(this.options.welcomeMessage, 'bot');
            this.showQuickReplies(this.options.quickReplies);
        }
    }
    
    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    renderChatbot() {
        const chatbotHTML = `
            <!-- Chat Bubble -->
            <div class="chatbot-bubble" id="chatbotBubble">
                <span class="chatbot-bubble__icon">💬</span>
                <span class="chatbot-bubble__badge hidden" id="chatbotBadge">0</span>
            </div>
            
            <!-- Chat Window -->
            <div class="chatbot chatbot--hidden" id="chatbotWindow">
                <div class="chatbot__header">
                    <div class="chatbot__avatar">🤖</div>
                    <div>
                        <div class="chatbot__title">ChefWeb Assistant</div>
                        <div class="chatbot__status">Online</div>
                    </div>
                    <button class="chatbot__close" id="chatbotClose" aria-label="Close chat">×</button>
                </div>
                
                <div class="chatbot__messages" id="chatbotMessages"></div>
                
                <div class="chatbot__quick-replies hidden" id="chatbotQuickReplies"></div>
                
                <div class="chatbot__input">
                    <textarea 
                        class="chatbot__textarea" 
                        id="chatbotInput" 
                        placeholder="Ask about booking..." 
                        rows="1"
                    ></textarea>
                    <button class="chatbot__send" id="chatbotSend" aria-label="Send message">
                        ➤
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', chatbotHTML);
        
        // Cache DOM elements
        this.bubble = document.getElementById('chatbotBubble');
        this.window = document.getElementById('chatbotWindow');
        this.messagesContainer = document.getElementById('chatbotMessages');
        this.input = document.getElementById('chatbotInput');
        this.sendButton = document.getElementById('chatbotSend');
        this.closeButton = document.getElementById('chatbotClose');
        this.quickRepliesContainer = document.getElementById('chatbotQuickReplies');
        this.badge = document.getElementById('chatbotBadge');
    }
    
    attachEvents() {
        // Open chat
        this.bubble.addEventListener('click', () => this.open());
        
        // Close chat
        this.closeButton.addEventListener('click', () => this.close());
        
        // Send message
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Enter key to send
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        this.input.addEventListener('input', () => {
            this.input.style.height = 'auto';
            this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
        });
    }
    
    open() {
        this.isOpen = true;
        this.window.classList.remove('chatbot--hidden');
        this.bubble.style.display = 'none';
        this.badge.classList.add('hidden');
        this.input.focus();
        this.scrollToBottom();
    }
    
    close() {
        this.isOpen = false;
        this.window.classList.add('chatbot--hidden');
        this.bubble.style.display = 'flex';
        this.saveConversationHistory();
    }
    
    addMessage(text, sender = 'bot', options = {}) {
        const message = {
            id: `msg_${Date.now()}`,
            text,
            sender,
            timestamp: new Date(),
            ...options
        };
        
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
        this.saveConversationHistory();
        
        // Update unread badge if chat is closed
        if (!this.isOpen && sender === 'bot') {
            this.incrementBadge();
        }
        
        return message;
    }
    
    renderMessage(message) {
        const messageHTML = `
            <div class="chatbot__message chatbot__message--${message.sender}">
                <div class="chatbot__message-bubble">
                    ${this.formatMessageText(message.text)}
                </div>
            </div>
        `;
        
        this.messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
    }
    
    formatMessageText(text) {
        // Convert URLs to links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        text = text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>');
        
        // Convert line breaks
        text = text.replace(/\n/g, '<br>');
        
        return text;
    }
    
    showTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        const typingHTML = `
            <div class="chatbot__message chatbot__message--bot" id="typingIndicator">
                <div class="chatbot__typing">
                    <span class="chatbot__typing-dot"></span>
                    <span class="chatbot__typing-dot"></span>
                    <span class="chatbot__typing-dot"></span>
                </div>
            </div>
        `;
        
        this.messagesContainer.insertAdjacentHTML('beforeend', typingHTML);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        this.isTyping = false;
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    showQuickReplies(replies) {
        if (!replies || replies.length === 0) {
            this.quickRepliesContainer.classList.add('hidden');
            return;
        }
        
        let repliesHTML = '';
        replies.forEach(reply => {
            repliesHTML += `
                <button class="chatbot__quick-reply" data-reply="${reply}">
                    ${reply}
                </button>
            `;
        });
        
        this.quickRepliesContainer.innerHTML = repliesHTML;
        this.quickRepliesContainer.classList.remove('hidden');
        
        // Attach click handlers
        this.quickRepliesContainer.querySelectorAll('.chatbot__quick-reply').forEach(button => {
            button.addEventListener('click', () => {
                const reply = button.dataset.reply;
                this.input.value = reply;
                this.sendMessage();
            });
        });
    }
    
    async sendMessage() {
        const text = this.input.value.trim();
        if (!text) return;
        
        // Add user message
        this.addMessage(text, 'user');
        this.input.value = '';
        this.input.style.height = 'auto';
        this.quickRepliesContainer.classList.add('hidden');
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Call AI API
            const response = await fetch(this.options.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    conversationId: this.conversationId,
                    context: {
                        currentPage: window.location.pathname,
                        sessionId: sessionStorage.getItem('sessionId'),
                        bookingState: this.getBookingState()
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('API request failed');
            }
            
            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add bot response
            this.addMessage(data.response, 'bot');
            
            // Show quick replies if provided
            if (data.quickReplies) {
                this.showQuickReplies(data.quickReplies);
            }
            
            // Handle actions
            if (data.actions) {
                this.handleActions(data.actions);
            }
            
        } catch (error) {
            console.error('Chatbot error:', error);
            this.hideTypingIndicator();
            this.addMessage(
                "I'm having trouble connecting right now. Please try again or call us at (123) 456-7890.",
                'bot'
            );
        }
    }
    
    handleActions(actions) {
        actions.forEach(action => {
            switch (action.type) {
                case 'open_url':
                    setTimeout(() => {
                        window.location.href = action.url;
                    }, 1000);
                    break;
                    
                case 'prefill_booking':
                    sessionStorage.setItem('booking_prefill', JSON.stringify(action.data));
                    break;
                    
                case 'human_handoff':
                    this.showHandoffOptions();
                    break;
            }
        });
    }
    
    showHandoffOptions() {
        const handoffHTML = `
            I'd like to connect you with our team for personalized assistance.<br><br>
            <strong>Contact options:</strong><br>
            📞 Call: <a href="tel:+1234567890">(123) 456-7890</a><br>
            💬 Text: <a href="sms:+1234567890">(123) 456-7890</a><br>
            ✉️ Email: <a href="mailto:info@chefweb.com">info@chefweb.com</a>
        `;
        
        this.addMessage(handoffHTML, 'bot');
    }
    
    getBookingState() {
        const bookingState = sessionStorage.getItem('bookingState');
        return bookingState ? JSON.parse(bookingState) : null;
    }
    
    saveConversationHistory() {
        sessionStorage.setItem('chatbot_conversation', JSON.stringify({
            conversationId: this.conversationId,
            messages: this.messages
        }));
    }
    
    loadConversationHistory() {
        const saved = sessionStorage.getItem('chatbot_conversation');
        if (saved) {
            const data = JSON.parse(saved);
            this.conversationId = data.conversationId;
            this.messages = data.messages;
            
            // Render saved messages
            data.messages.forEach(msg => this.renderMessage(msg));
        }
    }
    
    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }
    
    incrementBadge() {
        const badge = this.badge;
        const currentCount = parseInt(badge.textContent) || 0;
        badge.textContent = currentCount + 1;
        badge.classList.remove('hidden');
    }
}

// Initialize chatbot
document.addEventListener('DOMContentLoaded', () => {
    window.chefwebChatbot = new Chatbot({
        apiEndpoint: '/api/chatbot/message'
    });
});
```

### 4.6 Backend API Requirements (for integration)

```javascript
// POST /api/chatbot/message
// Request:
{
  "message": "How much for 15 people?",
  "conversationId": "conv_123abc",
  "context": {
    "currentPage": "/pages/packages.html",
    "sessionId": "session_xyz",
    "bookingState": { /* booking form data */ }
  }
}

// Response:
{
  "response": "For a party of 15, our Signature package would be $75 per person, totaling $1,125. This easily meets our $500 minimum and includes everything you need!",
  "quickReplies": [
    "Tell me more about Signature",
    "See other packages",
    "Book now",
    "What's included?"
  ],
  "actions": [
    {
      "type": "prefill_booking",
      "data": {
        "numAdults": 15,
        "package": "signature"
      }
    }
  ],
  "intent": "pricing_question",
  "confidence": 0.95,
  "requiresHumanHandoff": false
}

// Intent Types:
- booking_inquiry
- pricing_question
- service_area_check
- package_comparison
- dietary_restrictions
- general_question
- human_handoff_request
```

---

## 8. Feature 3: Payment Integration (Stripe - US)

### 5.1 Business Requirements

**Primary Goal**: Enable secure deposit payments and full booking payments through Stripe to eliminate manual payment processing and reduce booking abandonment.

**Key Metrics**:
- Payment success rate: Target >95%
- Payment abandonment rate: <15% after reaching payment step
- Average time to complete payment: <60 seconds
- Chargeback rate: <0.5%

**Payment Models**:
1. **Deposit Model** (Recommended): $100-200 deposit to secure booking, balance due on event day
2. **Full Payment Model**: 100% payment upfront
3. **Flexible Model**: Customer chooses deposit or full payment

### 5.2 Functional Requirements

#### FR3.1: Payment Step in Booking Funnel
**Priority**: P0 (Must Have)

**Position**: Step 4 in booking funnel (after Contact Info section)  
**Payment Options**:
- Pay deposit now ($150 - configurable)
- Pay full amount now
- Pay later (request quote without immediate payment)

**Acceptance Criteria**:
- [ ] Payment step appears after Contact Info section
- [ ] User can choose payment option (deposit/full/later)
- [ ] Total amount and deposit amount clearly displayed
- [ ] Payment option selection updates price summary
- [ ] "Pay Later" option allows booking without payment (status: "pending_payment")

#### FR3.2: Stripe Payment Form
**Priority**: P0 (Must Have)

**Integration Method**: Stripe Elements (embedded credit card form)

**Required Fields**:
- Card number (Stripe Element)
- Expiration date (Stripe Element)
- CVC (Stripe Element)
- Billing ZIP code (Stripe Element)
- Cardholder name (regular input)
- Save payment method checkbox (optional - for returning customers)

**Acceptance Criteria**:
- [ ] Stripe Elements inject correctly into payment form
- [ ] Form validates in real-time (invalid card, expired, etc.)
- [ ] Card brand icon displays (Visa, Mastercard, Amex, Discover)
- [ ] Supports 3D Secure (SCA) for cards that require it
- [ ] Mobile-optimized input fields
- [ ] Clear error messages for failed payments
- [ ] Loading state during payment processing
- [ ] Success confirmation before redirect

#### FR3.3: Payment Processing Flow
**Priority**: P0 (Must Have)

**Flow Steps**:
1. User fills booking form (Steps 1-3)
2. User reaches payment section (Step 4)
3. User selects payment option (deposit/full/later)
4. If payment selected:
   a. User enters card details
   b. Frontend creates Stripe PaymentIntent
   c. Stripe processes payment
   d. Success → Create booking in backend with status "confirmed"
   e. Failure → Show error, allow retry
5. If "pay later" selected:
   a. Skip payment
   b. Create booking with status "pending_payment"
   c. Send invoice link for later payment

**Acceptance Criteria**:
- [ ] Payment Intent created with correct amount
- [ ] Payment succeeds or fails within 10 seconds
- [ ] Successful payment shows confirmation screen
- [ ] Failed payment shows clear error message
- [ ] User can retry failed payment without re-entering booking details
- [ ] Payment amount matches final calculated total
- [ ] Receipt email sent after successful payment

#### FR3.4: Payment Security & Compliance
**Priority**: P0 (Must Have)

**Security Requirements**:
- [ ] All payment data handled by Stripe (PCI compliant)
- [ ] No credit card data stored on ChefWeb servers
- [ ] HTTPS enforced on all payment pages
- [ ] CSRF protection on payment submission
- [ ] 3D Secure (SCA) support for European cards
- [ ] Fraud detection through Stripe Radar

**Compliance**:
- [ ] Stripe Terms of Service link displayed
- [ ] Privacy policy updated to include payment processing
- [ ] Refund policy clearly stated before payment
- [ ] Payment confirmation includes transaction ID

#### FR3.5: Payment Status & Receipts
**Priority**: P0 (Must Have)

**Confirmation Page Elements**:
- [ ] "Payment Successful" message
- [ ] Transaction ID
- [ ] Amount charged
- [ ] Payment method (last 4 digits of card)
- [ ] Receipt number
- [ ] Booking summary
- [ ] Download receipt button (PDF)
- [ ] Email receipt button

**Email Receipt**:
- [ ] Sent immediately after successful payment
- [ ] Includes all confirmation page elements
- [ ] PDF receipt attached
- [ ] Link to booking details page

#### FR3.6: Refund & Cancellation Handling
**Priority**: P1 (Should Have)

**Refund Scenarios**:
- Full refund if cancelled >7 days before event
- 50% refund if cancelled 3-7 days before
- No refund if cancelled <3 days before

**Refund Process**:
1. Customer requests cancellation (contact form or chatbot)
2. Admin reviews request
3. Admin initiates refund through admin panel
4. Stripe processes refund (3-5 business days)
5. Customer receives refund confirmation email

**Acceptance Criteria**:
- [ ] Refund policy displayed before payment
- [ ] Refund amount calculated based on cancellation policy
- [ ] Refund processed through Stripe API
- [ ] Refund confirmation email sent
- [ ] Booking status updated to "cancelled" + "refunded"

### 5.3 UI/UX Specifications

#### Payment Step Layout (Desktop)
```
┌────────────────────────────────────────────────────┐
│ Step 4: Payment                                    │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ Choose Payment Option                        │  │
│ │                                              │  │
│ │ ○ Pay Deposit Now ($150)                    │  │
│ │   Secure your booking with a deposit         │  │
│ │   Balance due on event day                   │  │
│ │                                              │  │
│ │ ○ Pay Full Amount Now ($1,125)              │  │
│ │   Complete payment and you're all set        │  │
│ │                                              │  │
│ │ ○ Pay Later                                  │  │
│ │   We'll send you an invoice                  │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ ┌──────────────────────────────────────────────┐  │
│ │ Payment Details                              │  │
│ │                                              │  │
│ │ Cardholder Name                             │  │
│ │ [John Doe                              ]     │  │
│ │                                              │  │
│ │ Card Information                             │  │
│ │ [4242 4242 4242 4242] [12/25] [123]        │  │
│ │ [Visa icon]                                  │  │
│ │                                              │  │
│ │ Billing ZIP Code                             │  │
│ │ [12345                                ]      │  │
│ │                                              │  │
│ │ ☐ Save payment method for future bookings   │  │
│ │                                              │  │
│ │ 🔒 Secure payment powered by Stripe          │  │
│ └──────────────────────────────────────────────┘  │
│                                                    │
│ [< Back]                    [Pay Now →]            │
└────────────────────────────────────────────────────┘

// Right Sidebar: Price Summary
┌──────────────────────────┐
│ Booking Summary          │
│                          │
│ Subtotal: $1,125        │
│ Travel Fee: Included     │
│ Tax: $90.00             │
│ ─────────────────────   │
│ Total: $1,215.00        │
│                          │
│ Amount Due Today:        │
│ $150.00 (deposit)       │
│                          │
│ Balance Due on Event:    │
│ $1,065.00               │
└──────────────────────────┘
```

#### Mobile Payment View
```
┌──────────────────────────┐
│ Step 4 of 4             │
│                          │
│ Choose Payment           │
│                          │
│ ● Deposit ($150)        │
│ ○ Full ($1,125)         │
│ ○ Pay Later             │
│                          │
│ ──────────────────────  │
│                          │
│ Cardholder Name          │
│ [John Doe           ]    │
│                          │
│ Card Information         │
│ [4242 4242 4242 424]    │
│ [12/25] [123]           │
│                          │
│ ZIP Code                 │
│ [12345              ]    │
│                          │
│ ☐ Save card             │
│                          │
│ 🔒 Secure via Stripe     │
│                          │
│ ──────────────────────  │
│                          │
│ Amount Due: $150.00      │
│                          │
│ [Pay Now]               │
└──────────────────────────┘
```

### 5.4 Component CSS Specification

```css
/* Payment Step */
.payment-step {
    max-width: 600px;
    margin: 0 auto;
}

.payment-options {
    margin-bottom: var(--spacing-2xl);
}

.payment-option {
    background: white;
    border: 2px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-lg);
    margin-bottom: var(--spacing-md);
    cursor: pointer;
    transition: var(--transition-base);
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
}

.payment-option:hover {
    border-color: var(--color-primary);
}

.payment-option--selected {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
}

.payment-option__radio {
    margin-top: 4px;
}

.payment-option__content {
    flex: 1;
}

.payment-option__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: var(--spacing-xs);
}

.payment-option__description {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}

.payment-option__amount {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-primary);
}

/* Stripe Payment Form */
.payment-form {
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-xl);
}

.payment-form__title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-lg);
}

.payment-form__field {
    margin-bottom: var(--spacing-lg);
}

.payment-form__label {
    display: block;
    font-weight: var(--font-weight-semibold);
    margin-bottom: var(--spacing-xs);
}

.payment-form__input {
    width: 100%;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    font-size: var(--font-size-base);
}

/* Stripe Elements Container */
.stripe-element {
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-md);
    background: white;
    transition: var(--transition-base);
}

.stripe-element--focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}

.stripe-element--invalid {
    border-color: var(--color-error);
}

.stripe-element--complete {
    border-color: var(--color-success);
}

/* Card Brand Icon */
.payment-form__card-brand {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 40px;
    height: 25px;
}

/* Error Message */
.payment-form__error {
    color: var(--color-error);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-xs);
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
}

.payment-form__error-icon {
    font-size: 16px;
}

/* Security Badge */
.payment-form__security {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    background: var(--color-background-alt);
    border-radius: var(--border-radius-md);
    margin-top: var(--spacing-lg);
}

.payment-form__security-icon {
    font-size: 24px;
}

.payment-form__security-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
}

/* Loading Overlay */
.payment-loading {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.payment-loading__content {
    background: white;
    padding: var(--spacing-2xl);
    border-radius: var(--border-radius-lg);
    text-align: center;
}

.payment-loading__spinner {
    width: 60px;
    height: 60px;
    border: 4px solid var(--color-border-light);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto var(--spacing-lg);
}

.payment-loading__text {
    font-size: var(--font-size-lg);
    color: var(--color-text-primary);
}

/* Success State */
.payment-success {
    text-align: center;
    padding: var(--spacing-3xl);
}

.payment-success__icon {
    font-size: 72px;
    margin-bottom: var(--spacing-lg);
}

.payment-success__title {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-success);
    margin-bottom: var(--spacing-md);
}

.payment-success__message {
    font-size: var(--font-size-lg);
    color: var(--color-text-secondary);
    margin-bottom: var(--spacing-xl);
}

.payment-success__details {
    background: var(--color-background-alt);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-xl);
    margin-bottom: var(--spacing-xl);
    text-align: left;
}

.payment-success__detail-row {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
    border-bottom: 1px solid var(--color-border-light);
}

.payment-success__detail-label {
    color: var(--color-text-secondary);
}

.payment-success__detail-value {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

/* Responsive */
@media (max-width: 768px) {
    .payment-form {
        padding: var(--spacing-lg);
    }
    
    .payment-option {
        padding: var(--spacing-md);
    }
}
```

### 5.5 JavaScript Implementation

```javascript
/**
 * Stripe Payment Integration
 * Handles payment processing, Stripe Elements, and confirmation
 */

class StripePayment {
    constructor(options = {}) {
        this.options = {
            publishableKey: '', // Stripe publishable key from backend
            createPaymentIntentEndpoint: '/api/payments/create-intent',
            confirmBookingEndpoint: '/api/bookings/confirm',
            ...options
        };
        
        this.stripe = null;
        this.elements = null;
        this.cardElement = null;
        this.paymentIntent = null;
        this.selectedOption = 'deposit'; // 'deposit', 'full', 'later'
        
        this.init();
    }
    
    async init() {
        // Load Stripe.js
        if (!window.Stripe) {
            await this.loadStripeScript();
        }
        
        // Initialize Stripe
        this.stripe = Stripe(this.options.publishableKey);
        this.elements = this.stripe.elements();
        
        // Render payment form
        this.renderPaymentStep();
        this.attachEvents();
    }
    
    loadStripeScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    renderPaymentStep() {
        const container = document.getElementById('paymentStepContainer');
        if (!container) return;
        
        container.innerHTML = `
            <div class="payment-step">
                <h2 class="step-title">Payment</h2>
                <p class="step-description">Choose your payment option and enter your payment details.</p>
                
                <div class="payment-options">
                    <label class="payment-option payment-option--selected" data-option="deposit">
                        <input type="radio" name="paymentOption" value="deposit" checked class="payment-option__radio">
                        <div class="payment-option__content">
                            <div class="payment-option__title">Pay Deposit Now</div>
                            <div class="payment-option__amount">$150.00</div>
                            <div class="payment-option__description">
                                Secure your booking with a deposit. Balance of $<span id="balanceAmount">1,065.00</span> due on event day.
                            </div>
                        </div>
                    </label>
                    
                    <label class="payment-option" data-option="full">
                        <input type="radio" name="paymentOption" value="full" class="payment-option__radio">
                        <div class="payment-option__content">
                            <div class="payment-option__title">Pay Full Amount Now</div>
                            <div class="payment-option__amount">$<span id="fullAmount">1,215.00</span></div>
                            <div class="payment-option__description">
                                Complete payment now and you're all set. Nothing due on event day.
                            </div>
                        </div>
                    </label>
                    
                    <label class="payment-option" data-option="later">
                        <input type="radio" name="paymentOption" value="later" class="payment-option__radio">
                        <div class="payment-option__content">
                            <div class="payment-option__title">Pay Later</div>
                            <div class="payment-option__description">
                                We'll send you an invoice. Payment required within 48 hours to confirm booking.
                            </div>
                        </div>
                    </label>
                </div>
                
                <div class="payment-form" id="paymentForm">
                    <h3 class="payment-form__title">Payment Details</h3>
                    
                    <div class="payment-form__field">
                        <label class="payment-form__label">Cardholder Name</label>
                        <input type="text" id="cardholderName" class="payment-form__input" placeholder="John Doe" required>
                    </div>
                    
                    <div class="payment-form__field">
                        <label class="payment-form__label">Card Information</label>
                        <div id="cardElement" class="stripe-element"></div>
                        <div id="cardErrors" class="payment-form__error hidden"></div>
                    </div>
                    
                    <div class="payment-form__field">
                        <label class="form-checkbox">
                            <input type="checkbox" id="saveCard">
                            <span>Save payment method for future bookings</span>
                        </label>
                    </div>
                    
                    <div class="payment-form__security">
                        <span class="payment-form__security-icon">🔒</span>
                        <span class="payment-form__security-text">
                            Secure payment powered by <strong>Stripe</strong>. 
                            Your card information is encrypted and never stored on our servers.
                        </span>
                    </div>
                </div>
            </div>
        `;
        
        // Initialize Stripe Elements
        this.setupStripeElements();
    }
    
    setupStripeElements() {
        const style = {
            base: {
                fontSize: '16px',
                color: '#333',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                '::placeholder': {
                    color: '#aaa'
                }
            },
            invalid: {
                color: '#e74c3c'
            }
        };
        
        // Create card element
        this.cardElement = this.elements.create('card', { style });
        this.cardElement.mount('#cardElement');
        
        // Handle real-time validation errors
        this.cardElement.on('change', (event) => {
            const errorElement = document.getElementById('cardErrors');
            
            if (event.error) {
                errorElement.innerHTML = `
                    <span class="payment-form__error-icon">⚠️</span>
                    ${event.error.message}
                `;
                errorElement.classList.remove('hidden');
            } else {
                errorElement.classList.add('hidden');
            }
            
            // Update element style based on state
            const container = document.getElementById('cardElement');
            container.classList.remove('stripe-element--focus', 'stripe-element--complete', 'stripe-element--invalid');
            
            if (event.complete) {
                container.classList.add('stripe-element--complete');
            } else if (event.error) {
                container.classList.add('stripe-element--invalid');
            }
        });
        
        // Handle focus
        this.cardElement.on('focus', () => {
            document.getElementById('cardElement').classList.add('stripe-element--focus');
        });
        
        this.cardElement.on('blur', () => {
            document.getElementById('cardElement').classList.remove('stripe-element--focus');
        });
    }
    
    attachEvents() {
        // Payment option selection
        document.querySelectorAll('.payment-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.payment-option').forEach(opt => {
                    opt.classList.remove('payment-option--selected');
                });
                option.classList.add('payment-option--selected');
                
                const selectedOption = option.dataset.option;
                this.selectedOption = selectedOption;
                
                // Show/hide payment form
                const paymentForm = document.getElementById('paymentForm');
                if (selectedOption === 'later') {
                    paymentForm.style.display = 'none';
                } else {
                    paymentForm.style.display = 'block';
                }
                
                // Update amount in price summary
                this.updatePriceSummary();
            });
        });
        
        // Payment submission
        const nextButton = document.getElementById('bookingNextButton');
        if (nextButton) {
            nextButton.addEventListener('click', () => this.handlePayment());
        }
    }
    
    updatePriceSummary() {
        const total = BookingState.total || 1215; // Get from booking state
        const depositAmount = 150;
        
        const amountDueToday = this.selectedOption === 'deposit' ? depositAmount : 
                               this.selectedOption === 'full' ? total : 0;
        
        // Update summary sidebar
        const summaryElement = document.getElementById('amountDueToday');
        if (summaryElement) {
            summaryElement.textContent = `$${amountDueToday.toFixed(2)}`;
        }
    }
    
    async handlePayment() {
        if (this.selectedOption === 'later') {
            // Skip payment, create booking with "pending_payment" status
            await this.createBookingWithoutPayment();
            return;
        }
        
        // Validate cardholder name
        const cardholderName = document.getElementById('cardholderName').value.trim();
        if (!cardholderName) {
            alert('Please enter the cardholder name');
            return;
        }
        
        // Show loading overlay
        this.showLoading('Processing payment...');
        
        try {
            // Step 1: Create Payment Intent
            const amount = this.selectedOption === 'deposit' ? 15000 : BookingState.total * 100; // Amount in cents
            const paymentIntent = await this.createPaymentIntent(amount);
            
            // Step 2: Confirm payment with Stripe
            const { error, paymentIntent: confirmedPayment } = await this.stripe.confirmCardPayment(
                paymentIntent.client_secret,
                {
                    payment_method: {
                        card: this.cardElement,
                        billing_details: {
                            name: cardholderName
                        }
                    }
                }
            );
            
            if (error) {
                throw new Error(error.message);
            }
            
            // Step 3: Confirm booking with backend
            await this.confirmBooking(confirmedPayment.id);
            
            // Step 4: Show success and redirect
            this.hideLoading();
            this.showSuccess(confirmedPayment);
            
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }
    
    async createPaymentIntent(amount) {
        const response = await fetch(this.options.createPaymentIntentEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount,
                currency: 'usd',
                bookingData: BookingState.formData,
                paymentType: this.selectedOption
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create payment intent');
        }
        
        return await response.json();
    }
    
    async confirmBooking(paymentIntentId) {
        const response = await fetch(this.options.confirmBookingEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bookingData: BookingState.formData,
                paymentIntentId,
                paymentType: this.selectedOption
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to confirm booking');
        }
        
        return await response.json();
    }
    
    async createBookingWithoutPayment() {
        this.showLoading('Creating your booking...');
        
        try {
            const response = await fetch(this.options.confirmBookingEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    bookingData: BookingState.formData,
                    paymentType: 'later',
                    status: 'pending_payment'
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to create booking');
            }
            
            const data = await response.json();
            
            this.hideLoading();
            
            // Redirect to confirmation page
            window.location.href = `/pages/confirmation.html?bookingId=${data.bookingId}&paymentLater=true`;
            
        } catch (error) {
            this.hideLoading();
            this.showError(error.message);
        }
    }
    
    showLoading(message) {
        const loadingHTML = `
            <div class="payment-loading" id="paymentLoading">
                <div class="payment-loading__content">
                    <div class="payment-loading__spinner"></div>
                    <div class="payment-loading__text">${message}</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }
    
    hideLoading() {
        const loading = document.getElementById('paymentLoading');
        if (loading) {
            loading.remove();
        }
    }
    
    showSuccess(paymentIntent) {
        // Redirect to confirmation page with payment details
        const params = new URLSearchParams({
            paymentIntentId: paymentIntent.id,
            amount: (paymentIntent.amount / 100).toFixed(2),
            last4: paymentIntent.payment_method?.card?.last4 || '****',
            paymentType: this.selectedOption
        });
        
        window.location.href = `/pages/confirmation.html?${params.toString()}`;
    }
    
    showError(message) {
        alert(`Payment failed: ${message}\n\nPlease check your card details and try again.`);
    }
}

// Initialize payment on booking page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('paymentStepContainer')) {
        // Get Stripe publishable key from backend
        fetch('/api/config/stripe')
            .then(res => res.json())
            .then(config => {
                window.stripePayment = new StripePayment({
                    publishableKey: config.publishableKey
                });
            })
            .catch(err => {
                console.error('Failed to load Stripe configuration:', err);
                alert('Payment system is temporarily unavailable. Please try again later or contact support.');
            });
    }
});
```

### 5.6 Backend API Requirements (for integration)

```javascript
// GET /api/config/stripe
// Response:
{
  "publishableKey": "pk_live_..." // Stripe publishable key (public)
}

// POST /api/payments/create-intent
// Request:
{
  "amount": 15000, // Amount in cents ($150.00)
  "currency": "usd",
  "paymentType": "deposit" | "full",
  "bookingData": { /* booking form data */ }
}

// Response:
{
  "clientSecret": "pi_xxx_secret_yyy", // Stripe PaymentIntent client secret
  "paymentIntentId": "pi_xxx"
}

// POST /api/bookings/confirm
// Request:
{
  "bookingData": { /* all booking form data */ },
  "paymentIntentId": "pi_xxx", // null if paymentType=later
  "paymentType": "deposit" | "full" | "later",
  "status": "confirmed" | "pending_payment"
}

// Response:
{
  "bookingId": "booking_abc123",
  "confirmationNumber": "CHEF-2026-0001",
  "status": "confirmed" | "pending_payment",
  "receiptUrl": "https://...", // Stripe receipt URL
  "invoiceUrl": "https://..." // Invoice URL if paymentType=later
}

// POST /api/payments/refund
// Request:
{
  "bookingId": "booking_abc123",
  "refundAmount": 15000, // Amount in cents
  "reason": "customer_request"
}

// Response:
{
  "refundId": "re_xxx",
  "status": "succeeded",
  "amount": 15000
}
```

---

## 6. Integration Points

### 6.1 Video Player ↔ Analytics
- Video view events tracked in Google Analytics
- Custom backend analytics for video performance metrics
- Session tracking to correlate video views with bookings

### 6.2 Chatbot ↔ Booking Funnel
- Chatbot extracts booking details from conversation
- Prefills booking form via sessionStorage
- Booking form accessible from chat window
- Chat transcript saved with booking record

### 6.3 Chatbot ↔ Payment
- Chatbot can answer payment policy questions
- Directs users to payment options
- Explains deposit vs full payment
- Provides payment support

### 6.4 Payment ↔ Booking Confirmation
- Payment success triggers confirmation email
- Booking status updated based on payment
- Receipt generated and emailed
- Confirmation page shows payment details

### 6.5 Cross-Feature Analytics
- Track conversion funnel: Video → Chatbot → Booking → Payment
- A/B testing payment options (deposit vs full)
- Measure chatbot impact on conversion rate
- Video engagement correlation with booking rate

---

## 7. Technical Requirements

### 7.1 Browser Support
- Chrome 90+ ✓
- Firefox 88+ ✓
- Safari 14+ ✓
- Edge 90+ ✓
- Mobile Safari (iOS 13+) ✓
- Android Chrome (v90+) ✓

### 7.2 Performance Requirements
- Video player loads in <2s
- Chatbot opens in <500ms
- Payment form renders in <1s
- Payment processing completes in <10s
- Page load time with all features: <3s

### 7.3 Security Requirements
- HTTPS enforced on all pages
- Stripe PCI compliance
- CSRF protection
- Input sanitization
- Rate limiting on API endpoints
- Session security (httpOnly cookies)

### 7.4 Accessibility Requirements
- WCAG 2.1 AA compliance
- Keyboard navigation for all features
- Screen reader support
- ARIA labels on all interactive elements
- Color contrast ratios meet standards
- Focus indicators visible

---

## 8. Testing Checklist

### 8.1 Video Player Testing
- [ ] Video plays on all supported browsers
- [ ] Mobile playback works (iOS/Android)
- [ ] Lazy loading works correctly
- [ ] Analytics events fire accurately
- [ ] Error states display properly
- [ ] Keyboard controls functional
- [ ] Accessibility (screen reader compatible)

### 8.2 Chatbot Testing
- [ ] Chat opens/closes smoothly
- [ ] Messages send and receive correctly
- [ ] Quick replies work
- [ ] Typing indicator displays
- [ ] Conversation persists across pages
- [ ] AI responses are relevant
- [ ] Human handoff triggers appropriately
- [ ] Booking prefill works
- [ ] Mobile responsive (full-screen)
- [ ] Accessibility (keyboard navigation)

### 8.3 Payment Testing
- [ ] Stripe Elements load correctly
- [ ] Card validation works in real-time
- [ ] Payment processes successfully
- [ ] Payment failures show clear errors
- [ ] 3D Secure (SCA) flow works
- [ ] Deposit option calculates correctly
- [ ] Full payment option calculates correctly
- [ ] Pay later option skips payment
- [ ] Receipt email sends
- [ ] Confirmation page shows correctly
- [ ] Refund process works
- [ ] Mobile payment form usable
- [ ] Accessibility (form labels, errors)

### 8.4 Integration Testing
- [ ] Video → Chatbot flow works
- [ ] Chatbot → Booking prefill works
- [ ] Booking → Payment flow seamless
- [ ] Payment → Confirmation works
- [ ] Analytics tracking across features
- [ ] Session persistence works
- [ ] Error recovery (network failures)

---

## 9. Deployment Plan

### 9.1 Phase 1: Video Player (Week 1-2)
1. Implement video player component
2. Add video section to homepage
3. Integrate analytics tracking
4. Test on all browsers/devices
5. Deploy to staging
6. User acceptance testing
7. Deploy to production

### 9.2 Phase 2: AI Chatbot (Week 3-4)
1. Implement chat UI components
2. Integrate AI backend service
3. Add booking prefill logic
4. Implement human handoff
5. Test conversation flows
6. Deploy to staging
7. Monitor AI responses
8. Deploy to production

### 9.3 Phase 3: Payment Integration (Week 5-6)
1. Set up Stripe account
2. Implement payment step in booking funnel
3. Integrate Stripe Elements
4. Add payment processing logic
5. Implement receipt generation
6. Test payment flows (success/failure)
7. Test refund process
8. Deploy to staging
9. Process test payments
10. Deploy to production

### 9.4 Phase 4: Integration & Optimization (Week 7-8)
1. Test cross-feature flows
2. Optimize performance
3. Fix bugs from user feedback
4. A/B testing setup
5. Analytics dashboard creation
6. Documentation completion
7. Team training
8. Final production deployment

---

## 10. Success Metrics

### 10.1 Video Player KPIs
- Video view rate: >60% of homepage visitors
- Video completion rate: >40%
- Video-to-booking conversion: Track uplift

### 10.2 Chatbot KPIs
- Chatbot engagement rate: >30%
- Question resolution rate: >70%
- Chat-to-booking conversion: Measure improvement
- Average response time: <2s
- User satisfaction rating: >4/5

### 10.3 Payment KPIs
- Payment success rate: >95%
- Payment abandonment rate: <15%
- Deposit adoption rate: >70%
- Full payment adoption rate: >20%
- Refund rate: <5%
- Chargeback rate: <0.5%

### 10.4 Overall Business Impact
- Booking conversion rate: +25% increase
- Support ticket volume: -50% decrease
- Average booking value: +15% increase
- Customer satisfaction: +20% increase
- Time to booking: -30% decrease

---

## 11. Future Enhancements (Post-MVP)

### 11.1 Video Player
- Multiple video carousel
- Video testimonials section
- Behind-the-scenes videos
- Chef profile videos
- Video SEO optimization

### 11.2 Chatbot
- Voice input support
- Multi-language support
- Sentiment analysis
- Proactive engagement (exit intent)
- Integration with CRM
- Advanced NLP (follow-up questions)

### 11.3 Payment
- Alternative payment methods (Apple Pay, Google Pay, PayPal)
- Split payments (multiple cards)
- Tip/gratuity options
- Loyalty points redemption
- Gift card support
- Subscription packages (recurring bookings)

---

## 12. Appendix

### 12.1 Design Assets
- Video player mockups: [Figma link]
- Chatbot UI mockups: [Figma link]
- Payment form mockups: [Figma link]
- Component library updates: [Figma link]

### 12.2 API Documentation
- Video API spec: [Swagger link]
- Chatbot API spec: [Swagger link]
- Payment API spec: [Stripe docs + custom endpoints]

### 12.3 Third-Party Services
- **Stripe**: Payment processing (https://stripe.com)
- **OpenAI**: AI chatbot backend (https://openai.com)
- **Google Analytics**: Analytics tracking
- **CDN**: Video hosting (Cloudflare/AWS CloudFront)

### 12.4 Compliance & Legal
- Stripe Terms of Service: [link]
- Privacy Policy update: Required for payment data
- Cookie Policy update: Required for analytics
- Refund Policy: Clearly stated on booking page

---

**End of PRD2_New_Function.md**

**Next Steps**:
1. Review and approve this PRD
2. Estimate development time for each feature
3. Assign developers to features
4. Begin Phase 1 (Video Player) development
5. Create detailed backend PRD (PRD_Backend.md)
