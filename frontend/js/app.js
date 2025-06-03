/**
 * Main Application Module
 * Initializes the application and handles Office.js integration
 */

class OutlookContactEnrichmentApp {
    constructor() {
        this.isOfficeContext = false;
        this.currentEmail = null;
        this.officeInitialized = false;
        
        this.initialize();
    }

    /**
     * Initialize the application
     */
    async initialize() {
        console.log('🚀 Initializing Outlook Contact Enrichment Add-in...');
        
        try {

            await this.initializeOfficeContext();
            

            this.initializeApp();
            

            this.setupOfficeEventListeners();
            

            await this.performInitialSetup();
            
            console.log('✅ Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            window.ui.showMessage('Application failed to initialize: ' + error.message, 'error');
        }
    }

    /**
     * Initialize Office.js context
     */
    async initializeOfficeContext() {
        return new Promise((resolve) => {

            if (typeof Office !== 'undefined' && Office.context) {
                console.log('📧 Office context detected, initializing...');
                
                Office.onReady((info) => {
                    if (info.host === Office.HostType.Outlook) {
                        this.isOfficeContext = true;
                        this.officeInitialized = true;
                        console.log('✅ Office.js initialized successfully');
                        console.log('📍 Host:', info.host, 'Platform:', info.platform);
                        

                        this.getCurrentEmailInfo();
                    } else {
                        console.log('⚠️ Not running in Outlook, using simulation mode');
                    }
                    resolve();
                });
            } else {
                console.log('🔧 Office.js not available, running in standalone mode');

                this.simulateOfficeContext();
                resolve();
            }
        });
    }

    /**
     * Initialize application components
     */
    initializeApp() {
        console.log('🔧 Initializing application components...');
        


        

        this.setupGlobalErrorHandling();
        

        this.setupConnectionMonitoring();
        

        this.initializePerformanceMonitoring();
    }

    /**
     * Setup Office.js event listeners
     */
    setupOfficeEventListeners() {
        if (!this.isOfficeContext || !Office.context.mailbox) {
            return;
        }

        try {

            if (Office.context.mailbox.addHandlerAsync) {
                Office.context.mailbox.addHandlerAsync(
                    Office.EventType.ItemChanged,
                    this.onEmailItemChanged.bind(this),
                    (asyncResult) => {
                        if (asyncResult.status === Office.AsyncResultStatus.Succeeded) {
                            console.log('✅ Email item change listener added');
                        } else {
                            console.warn('⚠️ Failed to add item change listener:', asyncResult.error);
                        }
                    }
                );
            }


            this.getCurrentEmailInfo();

        } catch (error) {
            console.warn('⚠️ Error setting up Office event listeners:', error);
        }
    }

    /**
     * Handle email item changes in Outlook
     * @param {Object} eventArgs - Event arguments
     */
    onEmailItemChanged(eventArgs) {
        console.log('📬 Email item changed:', eventArgs);
        this.getCurrentEmailInfo();
    }

    /**
     * Get current email information from Office context
     */
    getCurrentEmailInfo() {
        if (!this.isOfficeContext || !Office.context.mailbox?.item) {
            return;
        }

        try {
            const item = Office.context.mailbox.item;
            
            if (item.itemType === Office.MailboxEnums.ItemType.Message) {

                if (item.from) {
                    const senderEmail = item.from.emailAddress;
                    console.log('📧 Current email sender:', senderEmail);
                    

                    const senderEmailInput = document.getElementById('senderEmail');
                    if (senderEmailInput) {
                        senderEmailInput.value = senderEmail;
                    }
                    
                    this.currentEmail = senderEmail;
                    

                    if (window.authManager.isLoggedIn()) {
                        this.autoEnrichCurrentEmail();
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Error getting current email info:', error);
        }
    }

    /**
     * Auto-enrich current email sender
     */
    async autoEnrichCurrentEmail() {
        if (!this.currentEmail) {
            return;
        }

        try {
            console.log('🔍 Auto-enriching current email sender:', this.currentEmail);
            await window.ui.enrichContact(this.currentEmail);
        } catch (error) {
            console.warn('⚠️ Auto-enrichment failed:', error);
        }
    }

    /**
     * Simulate Office context for development/testing
     */
    simulateOfficeContext() {
        console.log('🎭 Simulating Office context for development...');
        

        const senderEmailInput = document.getElementById('senderEmail');
        if (senderEmailInput) {
            senderEmailInput.value = CONFIG.DEMO.DEFAULT_SENDER;
        }
        

        this.showSimulationMode();
    }

    /**
     * Show simulation mode indicator
     */
    showSimulationMode() {
        const outlookContext = document.querySelector('.outlook-context');
        if (outlookContext) {
            const simulationBadge = document.createElement('div');
            simulationBadge.className = 'simulation-badge';
            simulationBadge.innerHTML = `
                <i class="fas fa-flask"></i> 
                Simulation Mode - Not connected to Outlook
            `;
            simulationBadge.style.cssText = `
                background: linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
                text-align: center;
                justify-content: center;
                box-shadow: 0 2px 8px rgba(255, 140, 0, 0.3);
            `;
            
            outlookContext.insertBefore(simulationBadge, outlookContext.firstChild);
        }
    }

    /**
     * Perform initial setup tasks
     */
    async performInitialSetup() {
        try {

            await this.checkApiHealth();
            

            if (window.authManager.isLoggedIn()) {
                await this.loadUserPreferences();
            }
            

            this.setupPeriodicHealthChecks();
            
        } catch (error) {
            console.warn('⚠️ Some initial setup tasks failed:', error);
        }
    }

    /**
     * Check API health
     */
    async checkApiHealth() {
        try {
            const healthData = await window.apiManager.checkHealth();
            console.log('✅ API Health Check:', healthData);
            

            this.updateConnectionStatus(true);
            
        } catch (error) {
            console.warn('⚠️ API Health Check failed:', error);
            this.updateConnectionStatus(false);
        }
    }

    /**
     * Update connection status indicator
     * @param {boolean} isConnected - Connection status
     */
    updateConnectionStatus(isConnected) {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            const indicator = statusElement.querySelector('.status-indicator');
            const text = statusElement.querySelector('span:last-child') || statusElement;
            
            if (isConnected) {
                if (indicator) indicator.style.color = 'var(--success-green)';
                text.textContent = text.textContent.replace(/Disconnected|Connecting/, 'Connected');
            } else {
                if (indicator) indicator.style.color = 'var(--error-red)';
                text.textContent = text.textContent.replace(/Connected|Connecting/, 'Disconnected');
            }
        }
    }

    /**
     * Setup periodic health checks
     */
    setupPeriodicHealthChecks() {

        setInterval(async () => {
            try {
                await this.checkApiHealth();
            } catch (error) {
                console.warn('⚠️ Periodic health check failed:', error);
            }
        }, 5 * 60 * 1000);
    }

    /**
     * Load user preferences
     */
    async loadUserPreferences() {
        try {
            const preferences = localStorage.getItem(CONFIG.STORAGE_KEYS.PREFERENCES);
            if (preferences) {
                const userPrefs = JSON.parse(preferences);
                this.applyUserPreferences(userPrefs);
                console.log('✅ User preferences loaded');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load user preferences:', error);
        }
    }

    /**
     * Apply user preferences
     * @param {Object} preferences - User preferences
     */
    applyUserPreferences(preferences) {

        if (preferences.theme) {
            document.documentElement.setAttribute('data-theme', preferences.theme);
        }
        

        if (preferences.autoEnrich !== undefined) {
            this.autoEnrichEnabled = preferences.autoEnrich;
        }
    }

    /**
     * Setup global error handling
     */
    setupGlobalErrorHandling() {

        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ Unhandled promise rejection:', event.reason);
            window.ui.showMessage('An unexpected error occurred. Please try again.', 'error');
            

            event.preventDefault();
        });


        window.addEventListener('error', (event) => {
            console.error('❌ Global error:', event.error);
            

            if (!event.filename || event.filename.includes('.js')) {
                return;
            }
            
            window.ui.showMessage('An error occurred. Please refresh the page.', 'error');
        });
    }

    /**
     * Setup connection monitoring
     */
    setupConnectionMonitoring() {

        window.addEventListener('online', () => {
            console.log('🌐 Connection restored');
            this.updateConnectionStatus(true);
            this.checkApiHealth();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Connection lost');
            this.updateConnectionStatus(false);
        });
    }

    /**
     * Initialize performance monitoring
     */
    initializePerformanceMonitoring() {

        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    console.log('📊 Page load time:', Math.round(perfData.loadEventEnd - perfData.fetchStart), 'ms');
                }
            }, 0);
        });


        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                console.log(`⏱️ API Request to ${args[0]} took ${Math.round(endTime - startTime)}ms`);
                return response;
            } catch (error) {
                const endTime = performance.now();
                console.log(`❌ API Request to ${args[0]} failed after ${Math.round(endTime - startTime)}ms`);
                throw error;
            }
        };
    }

    /**
     * Get application info for debugging
     * @returns {Object} Application information
     */
    getAppInfo() {
        return {
            version: CONFIG.APP.VERSION,
            isOfficeContext: this.isOfficeContext,
            officeInitialized: this.officeInitialized,
            currentEmail: this.currentEmail,
            isAuthenticated: window.authManager.isLoggedIn(),
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Export application data for debugging
     */
    exportDebugData() {
        const debugData = {
            appInfo: this.getAppInfo(),
            config: CONFIG,
            localStorage: { ...localStorage },
            sessionStorage: { ...sessionStorage },
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        };

        window.apiManager.downloadAsFile(debugData, 'outlook-addin-debug.json');
        console.log('📊 Debug data exported');
    }
}


document.addEventListener('DOMContentLoaded', () => {

    window.outlookApp = new OutlookContactEnrichmentApp();
    

    window.exportDebugData = () => window.outlookApp.exportDebugData();
    
    console.log('🎉 Outlook Contact Enrichment Add-in ready!');
    console.log('💡 Tip: Call exportDebugData() in console for debugging info');
});


window.addEventListener('authStateChanged', (event) => {
    const { isAuthenticated } = event.detail;
    
    if (isAuthenticated && window.outlookApp.currentEmail) {

        window.outlookApp.autoEnrichCurrentEmail();
    }
});


window.addEventListener('load', () => {
    if (CONFIG.DEBUG) {
        console.log('🔧 Debug mode enabled');
        console.log('📱 App instance available as window.outlookApp');
        console.log('🔐 Auth manager available as window.authManager');
        console.log('🌐 API manager available as window.apiManager');
        console.log('🎨 UI manager available as window.ui');
    }
}); 