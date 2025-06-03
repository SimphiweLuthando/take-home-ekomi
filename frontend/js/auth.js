/**
 * Authentication Module
 * Handles user authentication, token management, and session state
 */

class AuthManager {
    constructor() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        this.loginAttempts = 0;
        this.maxLoginAttempts = CONFIG.SECURITY.MAX_LOGIN_ATTEMPTS;
        

        this.initialize();
    }

    /**
     * Initialize authentication state from localStorage
     */
    initialize() {
        try {

            const storedToken = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
            const storedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA);

            if (storedToken && storedUser) {
                this.token = storedToken;
                this.user = JSON.parse(storedUser);
                

                this.verifyToken().then(isValid => {
                    if (isValid) {
                        this.isAuthenticated = true;
                        this.onAuthStateChanged(true);
                    } else {
                        this.clearAuthData();
                    }
                }).catch(() => {
                    this.clearAuthData();
                });
            }
        } catch (error) {
            console.error('Error initializing auth:', error);
            this.clearAuthData();
        }
    }

    /**
     * Login with email and password
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<boolean>} Success status
     */
    async login(email, password) {
        try {

            if (this.loginAttempts >= this.maxLoginAttempts) {
                throw new Error('Too many login attempts. Please try again later.');
            }


            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            if (!this.isValidEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            const response = await fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.LOGIN), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                this.loginAttempts++;
                throw new Error(data.error || 'Login failed');
            }


            this.token = data.token;
            this.user = data.user;
            this.isAuthenticated = true;
            this.loginAttempts = 0;


            localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, this.token);
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(this.user));


            this.onAuthStateChanged(true);

            console.log('✅ Login successful:', this.user.email);
            return true;

        } catch (error) {
            console.error('❌ Login error:', error.message);
            throw error;
        }
    }

    /**
     * Register a new user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<boolean>} Success status
     */
    async register(email, password) {
        try {

            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            if (!this.isValidEmail(email)) {
                throw new Error('Please enter a valid email address');
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            const response = await fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.REGISTER), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Registration failed');
            }


            this.token = data.token;
            this.user = data.user;
            this.isAuthenticated = true;


            localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, this.token);
            localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(this.user));


            this.onAuthStateChanged(true);

            console.log('✅ Registration successful:', this.user.email);
            return true;

        } catch (error) {
            console.error('❌ Registration error:', error.message);
            throw error;
        }
    }

    /**
     * Logout the current user
     */
    logout() {
        this.clearAuthData();
        this.onAuthStateChanged(false);
        console.log('✅ Logout successful');
    }

    /**
     * Verify if the current token is valid
     * @returns {Promise<boolean>} Token validity
     */
    async verifyToken() {
        if (!this.token) {
            return false;
        }

        try {
            const response = await fetch(CONFIG.getApiUrl(CONFIG.ENDPOINTS.VERIFY_TOKEN), {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.valid) {

                    if (data.user) {
                        this.user = data.user;
                        localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(this.user));
                    }
                    return true;
                }
            }

            return false;

        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }

    /**
     * Get authorization headers for API requests
     * @returns {Object} Headers object
     */
    getAuthHeaders() {
        if (!this.token) {
            throw new Error('No authentication token available');
        }

        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Check if user is currently authenticated
     * @returns {boolean} Authentication status
     */
    isLoggedIn() {
        return this.isAuthenticated && this.token && this.user;
    }

    /**
     * Get current user data
     * @returns {Object|null} User data or null
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Get current auth token
     * @returns {string|null} Auth token or null
     */
    getToken() {
        return this.token;
    }

    /**
     * Clear all authentication data
     */
    clearAuthData() {
        this.token = null;
        this.user = null;
        this.isAuthenticated = false;
        

        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_DATA);
    }

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} Validation result
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Handle authentication state changes
     * @param {boolean} isAuthenticated - New auth state
     */
    onAuthStateChanged(isAuthenticated) {

        this.updateUI(isAuthenticated);
        

        window.dispatchEvent(new CustomEvent('authStateChanged', {
            detail: {
                isAuthenticated,
                user: this.user,
                token: this.token
            }
        }));
    }

    /**
     * Update UI based on authentication state
     * @param {boolean} isAuthenticated - Current auth state
     */
    updateUI(isAuthenticated) {
        const loginPanel = document.getElementById('loginPanel');
        const appPanel = document.getElementById('appPanel');
        const userInfo = document.getElementById('userInfo');
        const userEmail = document.getElementById('userEmail');

        if (isAuthenticated && this.user) {

            if (loginPanel) loginPanel.style.display = 'none';
            if (appPanel) appPanel.style.display = 'block';
            if (userInfo) userInfo.style.display = 'flex';
            if (userEmail) userEmail.textContent = this.user.email;
        } else {

            if (loginPanel) loginPanel.style.display = 'block';
            if (appPanel) appPanel.style.display = 'none';
            if (userInfo) userInfo.style.display = 'none';
            if (userEmail) userEmail.textContent = '';
        }
    }

    /**
     * Check if token is about to expire
     * @returns {boolean} Whether token needs refresh
     */
    shouldRefreshToken() {
        if (!this.token) return false;
        
        try {

            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const expiryTime = payload.exp * 1000;
            const currentTime = Date.now();
            const timeUntilExpiry = expiryTime - currentTime;
            
            return timeUntilExpiry < CONFIG.SECURITY.TOKEN_REFRESH_THRESHOLD;
        } catch (error) {
            console.warn('Error checking token expiry:', error);
            return true;
        }
    }

    /**
     * Auto-refresh token if needed
     */
    async autoRefreshToken() {
        if (this.shouldRefreshToken()) {
            console.log('🔄 Token approaching expiry, verifying...');
            const isValid = await this.verifyToken();
            if (!isValid) {
                console.log('🔒 Token expired, logging out...');
                this.logout();
            }
        }
    }
}


window.authManager = new AuthManager();


setInterval(() => {
    if (window.authManager.isLoggedIn()) {
        window.authManager.autoRefreshToken();
    }
}, 5 * 60 * 1000);