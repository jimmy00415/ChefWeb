/**
 * API Configuration
 * Automatically detects environment and uses correct API base URL
 */
const API_CONFIG = {
    // Production backend on Cloud Run
    production: 'https://chefweb-backend-775848565797.us-central1.run.app',
    // Local development
    development: 'http://localhost:4000'
};

// Auto-detect environment
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1' ||
                    window.location.hostname.startsWith('192.168.');

const API_BASE_URL = isLocalhost ? API_CONFIG.development : API_CONFIG.production;

/**
 * Make an API request with proper base URL
 * @param {string} endpoint - API endpoint (e.g., '/api/videos/homepage')
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
        'Content-Type': 'application/json'
    };
    
    return fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    });
}

// Export for use in other modules
window.API_BASE_URL = API_BASE_URL;
window.apiRequest = apiRequest;

console.log(`[API] Using backend: ${API_BASE_URL}`);
