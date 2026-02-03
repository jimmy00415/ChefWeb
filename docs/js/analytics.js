/**
 * Analytics & Tracking Configuration for POP Habachi
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Analytics 4 property at https://analytics.google.com
 * 2. Get your Measurement ID (G-XXXXXXXXXX)
 * 3. Replace 'G-XXXXXXXXXX' below with your actual ID
 * 4. Uncomment the gtag script in the HTML <head>
 */

// Google Analytics 4 Measurement ID
// Replace with your actual GA4 Measurement ID
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';

// Initialize dataLayer
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

// Check if GA is enabled (ID is configured)
const isGAEnabled = GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX';

if (isGAEnabled) {
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
        'page_title': document.title,
        'page_location': window.location.href
    });
    console.log('[Analytics] Google Analytics initialized');
} else {
    console.log('[Analytics] GA not configured - set GA_MEASUREMENT_ID in analytics.js');
}

/**
 * Track custom events
 * @param {string} eventName - Event name
 * @param {object} params - Event parameters
 */
function trackEvent(eventName, params = {}) {
    if (!isGAEnabled) {
        console.log('[Analytics] Event (not sent):', eventName, params);
        return;
    }
    
    gtag('event', eventName, params);
    console.log('[Analytics] Event tracked:', eventName, params);
}

/**
 * Track page views manually (for SPA navigation)
 * @param {string} pagePath - Page path
 * @param {string} pageTitle - Page title
 */
function trackPageView(pagePath, pageTitle) {
    if (!isGAEnabled) return;
    
    gtag('event', 'page_view', {
        page_title: pageTitle || document.title,
        page_location: window.location.origin + pagePath,
        page_path: pagePath
    });
}

// ============================================================================
// CONVERSION TRACKING
// ============================================================================

/**
 * Track booking started
 */
function trackBookingStarted(packageType) {
    trackEvent('begin_checkout', {
        currency: 'USD',
        value: 0,
        items: [{
            item_name: packageType + ' Package',
            item_category: 'Hibachi Package'
        }]
    });
}

/**
 * Track booking completed
 */
function trackBookingCompleted(packageType, totalValue, guestCount) {
    trackEvent('purchase', {
        currency: 'USD',
        value: totalValue,
        transaction_id: 'BK_' + Date.now(),
        items: [{
            item_name: packageType + ' Package',
            item_category: 'Hibachi Package',
            quantity: guestCount
        }]
    });
}

/**
 * Track contact form submission
 */
function trackContactSubmission(formType) {
    trackEvent('generate_lead', {
        form_type: formType,
        page_location: window.location.href
    });
}

/**
 * Track chatbot interaction
 */
function trackChatbotInteraction(action) {
    trackEvent('chatbot_' + action, {
        action: action
    });
}

/**
 * Track CTA button clicks
 */
function trackCTAClick(buttonName, destinationPage) {
    trackEvent('cta_click', {
        button_name: buttonName,
        destination: destinationPage
    });
}

// Export functions for global use
window.trackEvent = trackEvent;
window.trackPageView = trackPageView;
window.trackBookingStarted = trackBookingStarted;
window.trackBookingCompleted = trackBookingCompleted;
window.trackContactSubmission = trackContactSubmission;
window.trackChatbotInteraction = trackChatbotInteraction;
window.trackCTAClick = trackCTAClick;

// ============================================================================
// AUTO-TRACKING SETUP
// ============================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Track all "Book Now" button clicks
    document.querySelectorAll('a[href*="booking"]').forEach(function(link) {
        link.addEventListener('click', function() {
            trackCTAClick('Book Now', link.href);
        });
    });
    
    // Track all "Contact" button/link clicks
    document.querySelectorAll('a[href*="contact"]').forEach(function(link) {
        link.addEventListener('click', function() {
            trackCTAClick('Contact', link.href);
        });
    });
    
    // Track package views
    const packageCards = document.querySelectorAll('.package-card, .card--package');
    if (packageCards.length > 0) {
        trackEvent('view_item_list', {
            item_list_name: 'Hibachi Packages'
        });
    }
});
