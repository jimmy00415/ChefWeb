/**
 * API Configuration
 * Automatically detects environment and uses correct API base URL
 * Includes rate limit handling and retry logic
 */
const API_CONFIG = {
    // Production backend with custom domain
    production: 'https://api.pophibachi.com',
    // Fallback to Cloud Run URL
    cloudrun: 'https://chefweb-backend-775848565797.us-central1.run.app',
    // Local development
    development: 'http://localhost:4000'
};

// Auto-detect environment
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.');

const API_BASE_URL = isLocalhost ? API_CONFIG.development : API_CONFIG.production;

/**
 * Display rate limit error to user
 * @param {object} errorData - Error response data
 */
function showRateLimitError(errorData) {
    const message = errorData.message || 'You have made too many requests. Please wait a few minutes and try again.';
    const retryMinutes = errorData.retryAfter || 15;
    
    // Try to use existing toast/notification system, fallback to alert
    if (window.showToast) {
        window.showToast(`⏳ ${message} (retry in ${retryMinutes} min)`, 'warning', 8000);
    } else if (window.showNotification) {
        window.showNotification(message, 'warning');
    } else {
        alert(`Rate limit reached.\n\n${message}\n\nPlease wait ${retryMinutes} minutes before trying again.`);
    }
}

/**
 * Make an API request with proper base URL
 * Handles rate limiting (429) gracefully
 * @param {string} endpoint - API endpoint (e.g., '/api/videos/homepage')
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    
    console.log('[API] Request:', options.method || 'GET', url);
    
    const response = await fetch(url, {
        ...options,
        mode: 'cors',
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    });
    
    console.log('[API] Response:', response.status, response.ok);
    
    // Handle rate limiting specifically
    if (response.status === 429) {
        try {
            const errorData = await response.clone().json();
            showRateLimitError(errorData);
        } catch {
            showRateLimitError({ message: 'Too many requests. Please wait and try again.' });
        }
    }
    
    return response;
}

/**
 * Make an API request with automatic retry on rate limit
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @param {number} maxRetries - Maximum number of retries (default: 1)
 * @returns {Promise<Response>}
 */
async function apiRequestWithRetry(endpoint, options = {}, maxRetries = 1) {
    let lastResponse;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        lastResponse = await apiRequest(endpoint, options);
        
        if (lastResponse.status !== 429 || attempt === maxRetries) {
            return lastResponse;
        }
        
        // Wait before retry (exponential backoff: 5s, 10s, 20s...)
        const waitMs = 5000 * Math.pow(2, attempt);
        console.log(`[API] Rate limited, retrying in ${waitMs / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitMs));
    }
    
    return lastResponse;
}

// Export for use in other modules
window.API_BASE_URL = API_BASE_URL;
window.apiRequest = apiRequest;
window.apiRequestWithRetry = apiRequestWithRetry;
window.showRateLimitError = showRateLimitError;

console.log(`[API] Using backend: ${API_BASE_URL}`);
