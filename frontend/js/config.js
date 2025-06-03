/**
 * Application Configuration
 * Contains API endpoints, settings, and constants
 */

const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

const CONFIG = {
    API_BASE_URL: isProduction 
        ? '/api'
        : 'http://localhost:3001/api',  // In development, use explicit URL
    
    ENDPOINTS: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        VERIFY_TOKEN: '/auth/verify',
        
        ENRICH_CONTACT: '/contacts/enrich',
        SEARCH_CONTACTS: '/contacts/search',
        DIRECTORY: '/contacts/directory',
        STATS: '/contacts/stats',
        
        HEALTH: '/health'
    },
    
    REQUEST_TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    
    UI: {
        MESSAGE_DURATION: 5000, 
        LOADING_DELAY: 500,
        ANIMATION_DURATION: 300,
        
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 50,
        
        MIN_SEARCH_LENGTH: 2,
        SEARCH_DEBOUNCE_DELAY: 500,
    },
    
    STORAGE_KEYS: {
        AUTH_TOKEN: 'outlook_addin_token',
        USER_DATA: 'outlook_addin_user',
        THEME: 'outlook_addin_theme',
        PREFERENCES: 'outlook_addin_preferences'
    },
    
    APP: {
        NAME: 'Contact Enrichment Add-in',
        VERSION: '1.0.0',
        DESCRIPTION: 'Secure Outlook add-in for contact enrichment',
        AUTHOR: 'eKomi Development Team'
    },
    
    OFFICE: {
        REQUIRED_APIS: [
            'Mailbox',
            'Item'
        ],
        SUPPORTED_HOSTS: [
            'Outlook'
        ]
    },
    
    DEMO: {
        SAMPLE_EMAILS: [
            'john.doe@company.com',
            'jane.smith@company.com',
            'alice.johnson@company.com',
            'bob.wilson@company.com',
            'sarah.davis@company.com'
        ],
        
        DEFAULT_SENDER: 'jane.smith@company.com'
    },
    
    ERRORS: {
        NETWORK: 'Network error. Please check your connection and try again.',
        AUTHENTICATION: 'Authentication failed. Please log in again.',
        AUTHORIZATION: 'You do not have permission to access this resource.',
        VALIDATION: 'Please check your input and try again.',
        SERVER: 'Server error. Please try again later.',
        NOT_FOUND: 'The requested resource was not found.',
        TIMEOUT: 'Request timed out. Please try again.',
        UNKNOWN: 'An unexpected error occurred. Please try again.'
    },
    
    SUCCESS: {
        LOGIN: 'Successfully logged in!',
        LOGOUT: 'Successfully logged out!',
        DATA_LOADED: 'Data loaded successfully!',
        SEARCH_COMPLETED: 'Search completed successfully!',
        CONTACT_ENRICHED: 'Contact information enriched successfully!'
    },
    
    FEATURES: {
        ENABLE_REGISTRATION: true,
        ENABLE_SEARCH: true,
        ENABLE_DIRECTORY: true,
        ENABLE_STATS: true,
        ENABLE_OFFICE_INTEGRATION: true,
        ENABLE_OFFLINE_MODE: false,
        ENABLE_ANALYTICS: false
    },
    
    SECURITY: {
        TOKEN_REFRESH_THRESHOLD: 300000, 
        MAX_LOGIN_ATTEMPTS: 5,
        SESSION_TIMEOUT: 86400000,
        CSRF_PROTECTION: true
    }
};

CONFIG.getApiUrl = function(endpoint) {
    return this.API_BASE_URL + endpoint;
};

CONFIG.isFeatureEnabled = function(feature) {
    return this.FEATURES[feature] === true;
};

if (isProduction) {
    CONFIG.UI.MESSAGE_DURATION = 3000; 
    CONFIG.REQUEST_TIMEOUT = 15000; 
} else {
    console.log('🔧 Running in development mode');
    console.log('📍 API Base URL:', CONFIG.API_BASE_URL);
    
    CONFIG.DEBUG = true;
}

Object.freeze(CONFIG);
Object.freeze(CONFIG.ENDPOINTS);
Object.freeze(CONFIG.UI);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.APP);
Object.freeze(CONFIG.OFFICE);
Object.freeze(CONFIG.DEMO);
Object.freeze(CONFIG.ERRORS);
Object.freeze(CONFIG.SUCCESS);
Object.freeze(CONFIG.FEATURES);
Object.freeze(CONFIG.SECURITY);

window.CONFIG = CONFIG; 