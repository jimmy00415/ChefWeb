# ChefWeb SEO & Search Engine Indexing Workflow

**Project:** POP Habachi - Private Hibachi Chef Service  
**Frontend URL:** https://chefweb-frontend-775848565797.us-central1.run.app  
**Backend API:** https://chefweb-backend-775848565797.us-central1.run.app  
**Last Updated:** January 30, 2026

---

## Table of Contents

1. [Phase 1: Technical SEO Foundation](#phase-1-technical-seo-foundation)
2. [Phase 2: On-Page SEO Optimization](#phase-2-on-page-seo-optimization)
3. [Phase 3: Google Search Console Setup](#phase-3-google-search-console-setup)
4. [Phase 4: Local SEO (Critical for Service Business)](#phase-4-local-seo)
5. [Phase 5: Content SEO Strategy](#phase-5-content-seo-strategy)
6. [Phase 6: Performance & Core Web Vitals](#phase-6-performance--core-web-vitals)
7. [Phase 7: Link Building & Authority](#phase-7-link-building--authority)
8. [Phase 8: Analytics & Monitoring](#phase-8-analytics--monitoring)
9. [Phase 9: Custom Domain Setup](#phase-9-custom-domain-setup)
10. [Maintenance Checklist](#maintenance-checklist)

---

## Phase 1: Technical SEO Foundation

### 1.1 Already Completed ✅

| Task | Status | File/Location |
|------|--------|---------------|
| robots.txt | ✅ Done | `/robots.txt` |
| sitemap.xml | ✅ Done | `/sitemap.xml` |
| Canonical URLs | ✅ Done | `index.html` |
| Structured Data (JSON-LD) | ✅ Done | `index.html` |
| Open Graph Meta Tags | ✅ Done | `index.html` |
| Twitter Cards | ✅ Done | `index.html` |
| Mobile Responsive | ✅ Done | CSS viewport meta |
| HTTPS | ✅ Done | Cloud Run default |
| Gzip Compression | ✅ Done | `nginx.conf` |

### 1.2 To Do - Technical SEO

| # | Task | Priority | Status |
|---|------|----------|--------|
| 1.2.1 | Add meta tags to ALL pages (not just index) | P0 | ⬜ |
| 1.2.2 | Add canonical URLs to all pages | P0 | ⬜ |
| 1.2.3 | Create favicon in multiple sizes (16x16, 32x32, 180x180) | P1 | ⬜ |
| 1.2.4 | Add apple-touch-icon for iOS | P1 | ⬜ |
| 1.2.5 | Create manifest.json for PWA | P2 | ⬜ |
| 1.2.6 | Implement 404 error page with SEO | P1 | ⬜ |
| 1.2.7 | Add hreflang tags (if multi-language needed) | P3 | ⬜ |

### 1.2.1 Pages Needing Meta Tags

```
Priority Order:
1. pages/packages.html - Main conversion page
2. pages/booking.html - Booking funnel
3. pages/service-areas.html - Local SEO critical
4. pages/gallery.html - Visual content
5. pages/reviews.html - Social proof
6. pages/contact.html - Contact info
7. pages/faq.html - Long-tail keywords
8. pages/large-event.html - Corporate market
```

---

## Phase 2: On-Page SEO Optimization

### 2.1 Meta Tags Template for Each Page

```html
<!-- Template for each page -->
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="[UNIQUE 150-160 char description]">
    <meta name="keywords" content="[5-10 relevant keywords]">
    <meta name="robots" content="index, follow">
    <title>[Page Title] | POP Habachi - Private Hibachi Chef</title>
    <link rel="canonical" href="https://[DOMAIN]/pages/[page].html">
    
    <!-- Open Graph -->
    <meta property="og:title" content="[Page Title]">
    <meta property="og:description" content="[Description]">
    <meta property="og:url" content="https://[DOMAIN]/pages/[page].html">
    <meta property="og:type" content="website">
    <meta property="og:image" content="https://[DOMAIN]/images/og-[page].jpg">
</head>
```

### 2.2 Page-Specific SEO Content

| Page | Target Keywords | Meta Description |
|------|-----------------|------------------|
| **index.html** | private hibachi chef, home hibachi party, Texas hibachi catering | Premium private hibachi chef service at your home. Book unforgettable dining experiences in Texas. Starting at $65/person. |
| **packages.html** | hibachi packages, hibachi pricing, private chef cost | Choose from Essential ($65), Signature ($75), or Premium ($95) hibachi packages. All-inclusive pricing with professional chef service. |
| **booking.html** | book hibachi chef, reserve private chef, hibachi reservation | Book your private hibachi experience in minutes. Choose your date, package, and guests. Instant confirmation available. |
| **service-areas.html** | hibachi Houston, hibachi Dallas, hibachi Austin, Texas private chef | Private hibachi chef service in Houston, Dallas, Austin, San Antonio & all major Texas cities. Check if we serve your area. |
| **gallery.html** | hibachi photos, private chef gallery, hibachi party pictures | See stunning photos from our hibachi events. Real customers, real experiences. Get inspired for your party. |
| **reviews.html** | hibachi reviews, private chef testimonials, customer reviews | 5-star rated private hibachi service. Read 100+ verified customer reviews. See why families love POP Habachi. |
| **faq.html** | hibachi FAQ, private chef questions, hibachi party tips | Frequently asked questions about private hibachi service. Dietary options, pricing, booking process explained. |
| **contact.html** | contact hibachi chef, hibachi inquiry, private chef contact | Contact POP Habachi for quotes, questions, or special requests. Response within 2 hours during business hours. |

### 2.3 Header Tag Structure (H1-H6)

```
Each page should have:
- Exactly ONE H1 tag (main page title)
- 2-5 H2 tags (major sections)
- H3-H4 as needed (subsections)
- Keywords naturally included in headers
```

### 2.4 Image SEO Checklist

| # | Task | Status |
|---|------|--------|
| 2.4.1 | Add descriptive alt text to ALL images | ⬜ |
| 2.4.2 | Use descriptive file names (hibachi-chef-cooking.jpg, not IMG_001.jpg) | ⬜ |
| 2.4.3 | Compress images (WebP format preferred) | ⬜ |
| 2.4.4 | Add width/height attributes to prevent layout shift | ⬜ |
| 2.4.5 | Implement lazy loading for below-fold images | ⬜ |
| 2.4.6 | Create OG images (1200x630) for each page | ⬜ |

---

## Phase 3: Google Search Console Setup

### 3.1 Initial Setup Steps

| # | Task | Status | Notes |
|---|------|--------|-------|
| 3.1.1 | Go to https://search.google.com/search-console | ⬜ | Use Google account |
| 3.1.2 | Add property (URL prefix method) | ⬜ | Enter: `https://chefweb-frontend-775848565797.us-central1.run.app` |
| 3.1.3 | Verify ownership (HTML file method) | ⬜ | Download verification file, add to /docs folder |
| 3.1.4 | Deploy verification file | ⬜ | `gcloud run deploy chefweb-frontend --source .` |
| 3.1.5 | Complete verification in Search Console | ⬜ | Click Verify button |

### 3.2 Post-Verification Tasks

| # | Task | Status |
|---|------|--------|
| 3.2.1 | Submit sitemap (`/sitemap.xml`) | ⬜ |
| 3.2.2 | Request indexing for homepage | ⬜ |
| 3.2.3 | Request indexing for key pages | ⬜ |
| 3.2.4 | Check for crawl errors | ⬜ |
| 3.2.5 | Review Mobile Usability report | ⬜ |
| 3.2.6 | Check Core Web Vitals | ⬜ |

### 3.3 Verification File Implementation

```bash
# After downloading googleXXXXXXXX.html from Search Console:
# 1. Place file in d:\VS_PROJECT\ChefWeb\docs\
# 2. Redeploy:
cd D:\VS_PROJECT\ChefWeb\docs
gcloud run deploy chefweb-frontend --source . --region us-central1 --allow-unauthenticated
```

---

## Phase 4: Local SEO

> **Critical for service businesses like POP Habachi**

### 4.1 Google Business Profile

| # | Task | Status | Notes |
|---|------|--------|-------|
| 4.1.1 | Create Google Business Profile | ⬜ | https://business.google.com |
| 4.1.2 | Add business name: "POP Habachi" | ⬜ | |
| 4.1.3 | Select category: "Caterer" or "Personal Chef" | ⬜ | |
| 4.1.4 | Add service areas (Houston, Dallas, Austin, etc.) | ⬜ | |
| 4.1.5 | Add business hours | ⬜ | |
| 4.1.6 | Add photos (10+ high quality) | ⬜ | |
| 4.1.7 | Add website URL | ⬜ | |
| 4.1.8 | Verify business (postcard/phone) | ⬜ | Takes 1-2 weeks |
| 4.1.9 | Respond to all reviews | ⬜ | Ongoing |

### 4.2 Local Schema Markup (Add to each page)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "POP Habachi",
  "description": "Premium private hibachi chef service at your home",
  "url": "https://chefweb-frontend-775848565797.us-central1.run.app/",
  "telephone": "+1-XXX-XXX-XXXX",
  "email": "info@pophabachi.com",
  "priceRange": "$$",
  "image": "https://chefweb-frontend-775848565797.us-central1.run.app/images/logo.png",
  "address": {
    "@type": "PostalAddress",
    "addressRegion": "TX",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "29.7604",
    "longitude": "-95.3698"
  },
  "areaServed": [
    {"@type": "City", "name": "Houston"},
    {"@type": "City", "name": "Dallas"},
    {"@type": "City", "name": "Austin"},
    {"@type": "City", "name": "San Antonio"}
  ],
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    "opens": "10:00",
    "closes": "22:00"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "127"
  }
}
</script>
```

### 4.3 Service Area Pages (Local Landing Pages)

Create dedicated pages for each major city:

| Page | Target URL | Target Keywords |
|------|------------|-----------------|
| Houston | `/pages/areas/houston.html` | hibachi Houston, private chef Houston TX |
| Dallas | `/pages/areas/dallas.html` | hibachi Dallas, private chef Dallas TX |
| Austin | `/pages/areas/austin.html` | hibachi Austin, private chef Austin TX |
| San Antonio | `/pages/areas/san-antonio.html` | hibachi San Antonio, private chef San Antonio |

### 4.4 NAP Consistency

> NAP = Name, Address, Phone - Must be IDENTICAL everywhere

```
Business Name: POP Habachi
Address: [Your business address]
Phone: [Your business phone]

Use this EXACT format on:
- Website footer
- Google Business Profile
- Yelp
- Facebook
- All directory listings
```

---

## Phase 5: Content SEO Strategy

### 5.1 Blog/Content Ideas (Future)

| Topic | Target Keywords | Type |
|-------|-----------------|------|
| "How to Host a Hibachi Party at Home" | home hibachi party, backyard hibachi | Guide |
| "Hibachi vs Teppanyaki: What's the Difference?" | hibachi vs teppanyaki | Educational |
| "10 Best Hibachi Side Dishes" | hibachi sides, hibachi menu | List |
| "Private Chef Cost Guide 2026" | private chef cost, how much hibachi | Pricing |
| "Corporate Hibachi Events: Complete Guide" | corporate hibachi, team building hibachi | B2B |

### 5.2 Content Calendar Template

```
Week 1: Publish 1 blog post
Week 2: Update service area page
Week 3: Add new customer photos to gallery
Week 4: Collect and post new reviews
Monthly: Update sitemap, check rankings
```

---

## Phase 6: Performance & Core Web Vitals

### 6.1 Core Web Vitals Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **LCP** (Largest Contentful Paint) | < 2.5s | TBD | ⬜ |
| **FID** (First Input Delay) | < 100ms | TBD | ⬜ |
| **CLS** (Cumulative Layout Shift) | < 0.1 | TBD | ⬜ |
| **TTFB** (Time to First Byte) | < 600ms | TBD | ⬜ |

### 6.2 Performance Optimization Checklist

| # | Task | Impact | Status |
|---|------|--------|--------|
| 6.2.1 | Enable Gzip compression | High | ✅ Done (nginx) |
| 6.2.2 | Set cache headers for static assets | High | ✅ Done (nginx) |
| 6.2.3 | Optimize images (WebP, compression) | High | ⬜ |
| 6.2.4 | Minify CSS files | Medium | ⬜ |
| 6.2.5 | Minify JavaScript files | Medium | ⬜ |
| 6.2.6 | Lazy load images | Medium | ⬜ |
| 6.2.7 | Preload critical resources | Medium | ⬜ |
| 6.2.8 | Use CDN for static assets | High | ⬜ |
| 6.2.9 | Optimize fonts (preload, subset) | Low | ⬜ |

### 6.3 Testing Tools

```
1. PageSpeed Insights: https://pagespeed.web.dev/
2. GTmetrix: https://gtmetrix.com/
3. WebPageTest: https://www.webpagetest.org/
4. Chrome DevTools Lighthouse
```

---

## Phase 7: Link Building & Authority

### 7.1 Directory Listings (Citations)

| Directory | URL | Status | Priority |
|-----------|-----|--------|----------|
| Google Business | business.google.com | ⬜ | P0 |
| Yelp | yelp.com | ⬜ | P0 |
| Facebook Business | facebook.com/business | ⬜ | P0 |
| Instagram Business | instagram.com | ⬜ | P0 |
| Thumbtack | thumbtack.com | ⬜ | P1 |
| The Knot (weddings) | theknot.com | ⬜ | P1 |
| WeddingWire | weddingwire.com | ⬜ | P1 |
| Eventective | eventective.com | ⬜ | P2 |
| GigSalad | gigsalad.com | ⬜ | P2 |
| PartySlate | partyslate.com | ⬜ | P2 |

### 7.2 Social Media Profiles

| Platform | Status | URL |
|----------|--------|-----|
| Instagram | ⬜ | @pophabachi |
| Facebook | ⬜ | /pophabachi |
| TikTok | ⬜ | @pophabachi |
| YouTube | ⬜ | /pophabachi |
| Pinterest | ⬜ | /pophabachi |

### 7.3 Review Strategy

```
Goal: 50+ Google reviews in first 6 months

After each event:
1. Send thank-you email with review link
2. Follow up 3 days later if no review
3. Respond to ALL reviews within 24 hours
4. Share positive reviews on social media
```

---

## Phase 8: Analytics & Monitoring

### 8.1 Google Analytics 4 Setup

| # | Task | Status |
|---|------|--------|
| 8.1.1 | Create GA4 property | ⬜ |
| 8.1.2 | Get Measurement ID (G-XXXXXXXXXX) | ⬜ |
| 8.1.3 | Add GA4 script to all pages | ⬜ |
| 8.1.4 | Set up conversion goals (booking, contact) | ⬜ |
| 8.1.5 | Link to Search Console | ⬜ |
| 8.1.6 | Set up custom events (chat, video views) | ⬜ |

### 8.2 GA4 Script Template

```html
<!-- Add to <head> of ALL pages -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 8.3 Key Metrics to Track

| Metric | Target | Frequency |
|--------|--------|-----------|
| Organic Traffic | +20%/month | Weekly |
| Keyword Rankings | Top 10 for main keywords | Weekly |
| Bounce Rate | < 50% | Monthly |
| Avg. Session Duration | > 2 min | Monthly |
| Booking Conversions | Track all | Daily |
| Contact Form Submissions | Track all | Daily |

### 8.4 Rank Tracking Keywords

```
Primary Keywords (Track Weekly):
- private hibachi chef
- hibachi at home
- hibachi catering Texas
- private chef Houston
- home hibachi party

Secondary Keywords (Track Monthly):
- hibachi birthday party
- corporate hibachi catering
- backyard hibachi chef
- mobile hibachi service
- teppanyaki at home
```

---

## Phase 9: Custom Domain Setup

### 9.1 Domain Options

| Option | Example | Annual Cost | Recommendation |
|--------|---------|-------------|----------------|
| .com | pophabachi.com | ~$12/year | ✅ Best for SEO |
| .co | pophabachi.co | ~$25/year | Good alternative |
| .io | pophabachi.io | ~$40/year | Tech-focused |

### 9.2 Domain Setup Steps

| # | Task | Status |
|---|------|--------|
| 9.2.1 | Purchase domain (Namecheap, Google Domains, GoDaddy) | ⬜ |
| 9.2.2 | Verify domain in Google Cloud | ⬜ |
| 9.2.3 | Map domain to Cloud Run | ⬜ |
| 9.2.4 | Update all canonical URLs | ⬜ |
| 9.2.5 | Update sitemap.xml | ⬜ |
| 9.2.6 | Update robots.txt | ⬜ |
| 9.2.7 | Update structured data | ⬜ |
| 9.2.8 | Set up 301 redirects from old URLs | ⬜ |
| 9.2.9 | Update Google Search Console | ⬜ |
| 9.2.10 | Update Google Business Profile | ⬜ |

### 9.3 Cloud Run Domain Mapping Commands

```bash
# Verify domain ownership
gcloud domains verify [YOUR-DOMAIN.com]

# Map domain to frontend service
gcloud run domain-mappings create \
  --service chefweb-frontend \
  --domain [YOUR-DOMAIN.com] \
  --region us-central1

# Get DNS records to configure
gcloud run domain-mappings describe \
  --domain [YOUR-DOMAIN.com] \
  --region us-central1
```

---

## Maintenance Checklist

### Weekly Tasks

- [ ] Check Search Console for errors
- [ ] Monitor keyword rankings
- [ ] Respond to new reviews
- [ ] Post on social media (2-3x)

### Monthly Tasks

- [ ] Review analytics and traffic trends
- [ ] Update sitemap if new pages added
- [ ] Check for broken links
- [ ] Update content with new photos/reviews
- [ ] Test Core Web Vitals

### Quarterly Tasks

- [ ] Full SEO audit
- [ ] Competitor analysis
- [ ] Update meta descriptions based on CTR
- [ ] Review and refresh old content
- [ ] Check all directory listings for accuracy

---

## Progress Tracker

### Overall SEO Score

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Phase 1: Technical SEO | 16 | 9 | 56% |
| Phase 2: On-Page SEO | 12 | 0 | 0% |
| Phase 3: Search Console | 11 | 0 | 0% |
| Phase 4: Local SEO | 15 | 0 | 0% |
| Phase 5: Content Strategy | 5 | 0 | 0% |
| Phase 6: Performance | 12 | 2 | 17% |
| Phase 7: Link Building | 15 | 0 | 0% |
| Phase 8: Analytics | 10 | 0 | 0% |
| Phase 9: Custom Domain | 10 | 0 | 0% |
| **TOTAL** | **106** | **11** | **10%** |

---

## Quick Start - Next 5 Actions

1. **🔴 P0**: Set up Google Search Console and verify ownership
2. **🔴 P0**: Submit sitemap.xml to Search Console
3. **🔴 P0**: Create Google Business Profile
4. **🟡 P1**: Add meta tags to all pages (packages, booking, service-areas)
5. **🟡 P1**: Set up Google Analytics 4

---

*Document maintained by: Development Team*  
*Last SEO audit: January 30, 2026*
