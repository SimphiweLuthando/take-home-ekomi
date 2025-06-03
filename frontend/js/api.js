/**
 * API Module
 * Handles all backend communication with authentication and error handling
 */

class ApiManager {
    constructor() {
        this.requestCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
    }

    /**
     * Make an authenticated API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Request options
     * @returns {Promise<Object>} Response data
     */
    async makeRequest(endpoint, options = {}) {
        try {

            if (this.isProtectedEndpoint(endpoint) && !window.authManager.isLoggedIn()) {
                throw new Error('Authentication required');
            }


            const config = {
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };


            if (this.isProtectedEndpoint(endpoint) && window.authManager.isLoggedIn()) {
                config.headers = {
                    ...config.headers,
                    ...window.authManager.getAuthHeaders()
                };
            }


            if (options.body && config.method !== 'GET') {
                config.body = typeof options.body === 'string' 
                    ? options.body 
                    : JSON.stringify(options.body);
            }

            const url = CONFIG.getApiUrl(endpoint);
            console.log(`🌐 ${config.method} ${url}`);


            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
            config.signal = controller.signal;

            try {
                const response = await fetch(url, config);
                clearTimeout(timeoutId);


                if (!response.ok) {
                    await this.handleErrorResponse(response);
                }

                const data = await response.json();
                console.log(`✅ ${config.method} ${url} - Success`);
                return data;

            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }

        } catch (error) {
            console.error(`❌ API Request failed:`, error);
            throw this.processError(error);
        }
    }

    /**
     * Handle error responses from the API
     * @param {Response} response - Fetch response object
     */
    async handleErrorResponse(response) {
        let errorData;
        
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { error: 'Unknown server error' };
        }


        switch (response.status) {
            case 401:

                if (window.authManager.isLoggedIn()) {
                    console.log('🔒 Authentication expired, logging out...');
                    window.authManager.logout();
                    window.ui.showMessage('Session expired. Please log in again.', 'warning');
                }
                throw new Error(errorData.error || CONFIG.ERRORS.AUTHENTICATION);

            case 403:
                throw new Error(errorData.error || CONFIG.ERRORS.AUTHORIZATION);

            case 404:
                throw new Error(errorData.error || CONFIG.ERRORS.NOT_FOUND);

            case 429:
                throw new Error(errorData.error || 'Too many requests. Please try again later.');

            case 500:
                throw new Error(errorData.error || CONFIG.ERRORS.SERVER);

            default:
                throw new Error(errorData.error || CONFIG.ERRORS.UNKNOWN);
        }
    }

    /**
     * Process and normalize errors
     * @param {Error} error - Original error
     * @returns {Error} Processed error
     */
    processError(error) {
        if (error.name === 'AbortError') {
            return new Error(CONFIG.ERRORS.TIMEOUT);
        }

        if (error.message.includes('fetch')) {
            return new Error(CONFIG.ERRORS.NETWORK);
        }

        return error;
    }

    /**
     * Check if endpoint requires authentication
     * @param {string} endpoint - API endpoint
     * @returns {boolean} Whether endpoint is protected
     */
    isProtectedEndpoint(endpoint) {
        const publicEndpoints = [
            CONFIG.ENDPOINTS.LOGIN,
            CONFIG.ENDPOINTS.REGISTER,
            CONFIG.ENDPOINTS.HEALTH
        ];
        
        return !publicEndpoints.includes(endpoint);
    }

    /**
     * Get cached request if available and not expired
     * @param {string} key - Cache key
     * @returns {Object|null} Cached data or null
     */
    getCachedRequest(key) {
        const cached = this.requestCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log(`📦 Using cached data for: ${key}`);
            return cached.data;
        }
        return null;
    }

    /**
     * Cache request data
     * @param {string} key - Cache key
     * @param {Object} data - Data to cache
     */
    setCachedRequest(key, data) {
        this.requestCache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Clear specific cache entry or all cache
     * @param {string} key - Cache key (optional)
     */
    clearCache(key = null) {
        if (key) {
            this.requestCache.delete(key);
        } else {
            this.requestCache.clear();
        }
    }



    /**
     * Enrich contact information for an email address
     * @param {string} email - Email address to enrich
     * @returns {Promise<Object>} Enriched contact data
     */
    async enrichContact(email) {
        if (!email) {
            throw new Error('Email address is required');
        }

        const cacheKey = `enrich_${email}`;
        const cached = this.getCachedRequest(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest(`${CONFIG.ENDPOINTS.ENRICH_CONTACT}?email=${encodeURIComponent(email)}`);
        
        this.setCachedRequest(cacheKey, data);
        return data;
    }

    /**
     * Search contacts by query
     * @param {string} query - Search query
     * @returns {Promise<Object>} Search results
     */
    async searchContacts(query) {
        if (!query || query.length < CONFIG.UI.MIN_SEARCH_LENGTH) {
            throw new Error(`Search query must be at least ${CONFIG.UI.MIN_SEARCH_LENGTH} characters`);
        }

        const cacheKey = `search_${query}`;
        const cached = this.getCachedRequest(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest(`${CONFIG.ENDPOINTS.SEARCH_CONTACTS}?q=${encodeURIComponent(query)}`);
        
        this.setCachedRequest(cacheKey, data);
        return data;
    }

    /**
     * Get company directory with pagination
     * @param {number} page - Page number (default: 1)
     * @param {number} limit - Items per page (default: 20)
     * @returns {Promise<Object>} Directory data
     */
    async getDirectory(page = 1, limit = CONFIG.UI.DEFAULT_PAGE_SIZE) {
        const cacheKey = `directory_${page}_${limit}`;
        const cached = this.getCachedRequest(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest(
            `${CONFIG.ENDPOINTS.DIRECTORY}?page=${page}&limit=${limit}`
        );
        
        this.setCachedRequest(cacheKey, data);
        return data;
    }

    /**
     * Get contact database statistics
     * @returns {Promise<Object>} Statistics data
     */
    async getStats() {
        const cacheKey = 'stats';
        const cached = this.getCachedRequest(cacheKey);
        if (cached) return cached;

        const data = await this.makeRequest(CONFIG.ENDPOINTS.STATS);
        
        this.setCachedRequest(cacheKey, data);
        return data;
    }

    /**
     * Check API health
     * @returns {Promise<Object>} Health status
     */
    async checkHealth() {
        return await this.makeRequest(CONFIG.ENDPOINTS.HEALTH);
    }



    /**
     * Perform multiple API requests in parallel
     * @param {Array} requests - Array of request configurations
     * @returns {Promise<Array>} Array of results
     */
    async batchRequests(requests) {
        const promises = requests.map(req => 
            this.makeRequest(req.endpoint, req.options).catch(error => ({ error }))
        );

        return await Promise.all(promises);
    }

    /**
     * Retry failed requests with exponential backoff
     * @param {Function} requestFn - Request function
     * @param {number} maxRetries - Maximum retry attempts
     * @returns {Promise<Object>} Response data
     */
    async retryRequest(requestFn, maxRetries = CONFIG.RETRY_ATTEMPTS) {
        let lastError;
        
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    const delay = CONFIG.RETRY_DELAY * Math.pow(2, attempt);
                    console.log(`🔄 Retrying request in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error(`❌ Request failed after ${maxRetries + 1} attempts`);
                }
            }
        }
        
        throw lastError;
    }



    /**
     * Build query string from object
     * @param {Object} params - Query parameters
     * @returns {string} Query string
     */
    buildQueryString(params) {
        return Object.entries(params)
            .filter(([key, value]) => value !== null && value !== undefined)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');
    }

    /**
     * Download data as file
     * @param {Object} data - Data to download
     * @param {string} filename - File name
     * @param {string} type - MIME type
     */
    downloadAsFile(data, filename, type = 'application/json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
}


window.apiManager = new ApiManager();


window.addEventListener('authStateChanged', (event) => {
    if (!event.detail.isAuthenticated) {
        window.apiManager.clearCache();
    }
});


window.addEventListener('online', () => {
    console.log('🌐 Back online');
    window.ui.showMessage('Connection restored', 'success');
});

window.addEventListener('offline', () => {
    console.log('📴 Gone offline');
    window.ui.showMessage('No internet connection', 'warning');
}); 