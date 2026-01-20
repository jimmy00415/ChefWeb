# ChefWeb

Static marketing site for ChefWeb private hibachi service.

## Features
- Responsive navigation across all pages
- Gallery with filtering, lightbox, and UGC modal
- Packages, service areas, reviews, FAQ, booking flow

## Getting Started
1) Install Node.js (includes npm).
2) Install static server:
   ```bash
   npm install -g http-server
   ```
3) Start local server from repo root:
   ```bash
   http-server -p 8080 -c-1 --cors
   ```
4) Open http://127.0.0.1:8080 in your browser.

## Development Notes
- Source: HTML/CSS/JS under `pages/`, `css/`, `js/`.
- Gallery data lives in `js/gallery.js` (placeholder images). Adjust URLs or replace with real assets when available.
- Styles: `css/components.css` for most components, `css/global.css` for layout utilities, `css/reset.css` for base reset.
- Navigation/header is consistent across all pages using `.header__container` structure.

## Manual Test Checklist
- Navigation: links and active states on all pages.
- Gallery: images render, filters switch counts, lightbox opens/closes with prev/next.
- Forms: booking/contact forms render; front-end validation is minimal.
- UGC modal: open/close, file selection preview (no upload backend wired).

## Deploy
This is a static site; host via any static server/CDN. Ensure correct base path if not served from root. Caching is disabled in the dev command above (`-c-1`).
