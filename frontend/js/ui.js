/**
 * UI Management Module
 * Handles user interface interactions, animations, and updates
 */

class UIManager {
    constructor() {
        this.activeMessages = new Set();
        this.debounceTimers = new Map();
        this.currentPanel = null;
        this.searchTimeout = null;
        
        this.initializeEventListeners();
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        
        this.setupLoginForm();
        
        
        this.setupLogoutButton();
        
        
        this.setupContactEnrichment();
        
        
        this.setupSearchFunctionality();
        
        
        this.setupDirectoryFunctionality();
        
        
        this.setupGeneralInteractions();
        
        
        this.setupKeyboardShortcuts();
    }

    

    /**
     * Setup login form handling
     */
    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');

        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin(e);
            });
        }

        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                
                const icon = togglePassword.querySelector('i');
                icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
            });
        }
    }

    /**
     * Handle login form submission
     * @param {Event} event - Form submit event
     */
    async handleLogin(event) {
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const email = form.email.value.trim();
        const password = form.password.value;

        try {
            
            this.setFormLoading(submitBtn, true);
            
            
            await window.authManager.login(email, password);
            
            
            this.showMessage(CONFIG.SUCCESS.LOGIN, 'success');
            
            
            form.reset();

        } catch (error) {
            this.showMessage(error.message, 'error');
        } finally {
            this.setFormLoading(submitBtn, false);
        }
    }

    /**
     * Setup logout button
     */
    setupLogoutButton() {
        const logoutBtn = document.getElementById('logoutBtn');
        
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                window.authManager.logout();
                this.showMessage(CONFIG.SUCCESS.LOGOUT, 'info');
            });
        }
    }

    

    /**
     * Setup contact enrichment functionality
     */
    setupContactEnrichment() {
        const enrichBtn = document.getElementById('enrichBtn');
        const senderEmailInput = document.getElementById('senderEmail');

        if (enrichBtn) {
            enrichBtn.addEventListener('click', async () => {
                const email = senderEmailInput?.value?.trim();
                if (email) {
                    await this.enrichContact(email);
                } else {
                    this.showMessage('Please enter an email address', 'warning');
                }
            });
        }

        if (senderEmailInput) {
            senderEmailInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    enrichBtn?.click();
                }
            });
        }
    }

    /**
     * Enrich contact information
     * @param {string} email - Email address to enrich
     */
    async enrichContact(email) {
        try {
            this.showLoading(true, 'Enriching contact information...');
            
            const data = await window.apiManager.enrichContact(email);
            
            this.displayContactInfo(data);
            this.showMessage(CONFIG.SUCCESS.CONTACT_ENRICHED, 'success');

        } catch (error) {
            this.showMessage(error.message, 'error');
            this.hideContactInfo();
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Display contact information
     * @param {Object} data - Contact data from API
     */
    displayContactInfo(data) {
        const contactInfo = document.getElementById('contactInfo');
        const contactDetails = document.getElementById('contactDetails');
        const enrichmentBadge = document.getElementById('enrichmentBadge');

        if (!contactInfo || !contactDetails) return;

        
        contactInfo.style.display = 'block';

        
        if (enrichmentBadge) {
            if (data.data.enriched) {
                enrichmentBadge.textContent = 'Enhanced';
                enrichmentBadge.className = 'enrichment-badge';
            } else {
                enrichmentBadge.textContent = 'Basic Info';
                enrichmentBadge.className = 'enrichment-badge not-enriched';
            }
        }

        
        contactDetails.innerHTML = '';

        if (data.data.enriched && data.data.contactInfo) {
            
            const fields = [
                { label: 'Full Name', value: data.data.contactInfo.fullName, icon: 'fas fa-user' },
                { label: 'Email', value: data.data.email, icon: 'fas fa-envelope' },
                { label: 'Job Title', value: data.data.contactInfo.jobTitle, icon: 'fas fa-briefcase' },
                { label: 'Department', value: data.data.contactInfo.department, icon: 'fas fa-building' },
                { label: 'Company', value: data.data.contactInfo.company, icon: 'fas fa-industry' },
                { label: 'Phone', value: data.data.contactInfo.phoneNumber, icon: 'fas fa-phone' },
                { label: 'Location', value: data.data.contactInfo.location, icon: 'fas fa-map-marker-alt' }
            ];

            fields.forEach(field => {
                contactDetails.appendChild(this.createContactField(field));
            });

            
            if (data.data.metadata) {
                contactDetails.appendChild(this.createMetadataSection(data.data.metadata));
            }
        } else {
            
            contactDetails.innerHTML = `
                <div class="contact-field">
                    <div class="contact-field-label">
                        <i class="fas fa-envelope"></i> Email
                    </div>
                    <div class="contact-field-value">${data.data.email}</div>
                </div>
                <div class="no-enrichment-message">
                    <p><i class="fas fa-info-circle"></i> ${data.data.message}</p>
                    <ul>
                        ${data.data.suggestions?.map(suggestion => `<li>${suggestion}</li>`).join('') || ''}
                    </ul>
                </div>
            `;
        }

        
        contactInfo.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    /**
     * Create a contact field element
     * @param {Object} field - Field data
     * @returns {HTMLElement} Contact field element
     */
    createContactField(field) {
        const fieldElement = document.createElement('div');
        fieldElement.className = 'contact-field';

        const value = field.value || 'Not available';
        const isEmpty = !field.value;

        fieldElement.innerHTML = `
            <div class="contact-field-label">
                <i class="${field.icon}"></i> ${field.label}
            </div>
            <div class="contact-field-value ${isEmpty ? 'empty' : ''}">${value}</div>
        `;

        return fieldElement;
    }

    /**
     * Create metadata section
     * @param {Object} metadata - Metadata object
     * @returns {HTMLElement} Metadata section element
     */
    createMetadataSection(metadata) {
        const section = document.createElement('div');
        section.className = 'metadata-section';

        section.innerHTML = `
            <div class="metadata-title">
                <i class="fas fa-info-circle"></i> Data Information
            </div>
            <div class="metadata-list">
                <div class="metadata-item">
                    <span class="metadata-label">Data Age:</span>
                    <span class="metadata-value">${metadata.dataAge} days</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Last Updated:</span>
                    <span class="metadata-value">${new Date(metadata.lastUpdated).toLocaleDateString()}</span>
                </div>
                <div class="metadata-item">
                    <span class="metadata-label">Source:</span>
                    <span class="metadata-value">${metadata.dataSource}</span>
                </div>
            </div>
        `;

        return section;
    }

    /**
     * Hide contact information panel
     */
    hideContactInfo() {
        const contactInfo = document.getElementById('contactInfo');
        if (contactInfo) {
            contactInfo.style.display = 'none';
        }
    }

    

    /**
     * Setup search functionality
     */
    setupSearchFunctionality() {
        const searchContactsBtn = document.getElementById('searchContactsBtn');
        const closeSearchBtn = document.getElementById('closeSearchBtn');
        const searchQuery = document.getElementById('searchQuery');
        const searchSubmitBtn = document.getElementById('searchSubmitBtn');

        if (searchContactsBtn) {
            searchContactsBtn.addEventListener('click', () => {
                this.showPanel('searchPanel');
            });
        }

        if (closeSearchBtn) {
            closeSearchBtn.addEventListener('click', () => {
                this.hidePanel('searchPanel');
            });
        }

        if (searchQuery) {
            searchQuery.addEventListener('input', (e) => {
                this.debounceSearch(e.target.value);
            });

            searchQuery.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }

        if (searchSubmitBtn) {
            searchSubmitBtn.addEventListener('click', () => {
                const query = searchQuery?.value?.trim();
                if (query) {
                    this.performSearch(query);
                }
            });
        }
    }

    /**
     * Debounce search input
     * @param {string} query - Search query
     */
    debounceSearch(query) {
        clearTimeout(this.searchTimeout);
        
        if (query.length >= CONFIG.UI.MIN_SEARCH_LENGTH) {
            this.searchTimeout = setTimeout(() => {
                this.performSearch(query);
            }, CONFIG.UI.SEARCH_DEBOUNCE_DELAY);
        } else {
            this.clearSearchResults();
        }
    }

    /**
     * Perform contact search
     * @param {string} query - Search query
     */
    async performSearch(query) {
        if (!query || query.length < CONFIG.UI.MIN_SEARCH_LENGTH) {
            this.showMessage(`Search query must be at least ${CONFIG.UI.MIN_SEARCH_LENGTH} characters`, 'warning');
            return;
        }

        try {
            this.showSearchLoading(true);
            
            const data = await window.apiManager.searchContacts(query);
            
            this.displaySearchResults(data);
            this.showMessage(`Found ${data.totalFound} contacts`, 'info');

        } catch (error) {
            this.showMessage(error.message, 'error');
            this.clearSearchResults();
        } finally {
            this.showSearchLoading(false);
        }
    }

    /**
     * Display search results
     * @param {Object} data - Search results data
     */
    displaySearchResults(data) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        searchResults.innerHTML = '';

        if (data.results && data.results.length > 0) {
            data.results.forEach(contact => {
                const resultElement = this.createSearchResultElement(contact);
                searchResults.appendChild(resultElement);
            });
        } else {
            searchResults.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <p>No contacts found for "${data.query}"</p>
                    <p>Try a different search term or check the spelling.</p>
                </div>
            `;
        }
    }

    /**
     * Create search result element
     * @param {Object} contact - Contact data
     * @returns {HTMLElement} Search result element
     */
    createSearchResultElement(contact) {
        const element = document.createElement('div');
        element.className = 'search-result-item';

        element.innerHTML = `
            <div class="search-result-name">${contact.fullName}</div>
            <div class="search-result-info">
                <span><i class="fas fa-envelope"></i> ${contact.email}</span>
                <span><i class="fas fa-briefcase"></i> ${contact.jobTitle || 'N/A'}</span>
                <span><i class="fas fa-building"></i> ${contact.department || 'N/A'}</span>
                <span><i class="fas fa-phone"></i> ${contact.phoneNumber || 'N/A'}</span>
            </div>
        `;

        
        element.addEventListener('click', () => {
            this.hidePanel('searchPanel');
            const senderEmail = document.getElementById('senderEmail');
            if (senderEmail) {
                senderEmail.value = contact.email;
                this.enrichContact(contact.email);
            }
        });

        return element;
    }

    /**
     * Clear search results
     */
    clearSearchResults() {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }

    /**
     * Show/hide search loading indicator
     * @param {boolean} show - Whether to show loading
     */
    showSearchLoading(show) {
        const searchSubmitBtn = document.getElementById('searchSubmitBtn');
        if (searchSubmitBtn) {
            if (show) {
                searchSubmitBtn.disabled = true;
                searchSubmitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
            } else {
                searchSubmitBtn.disabled = false;
                searchSubmitBtn.innerHTML = '<i class="fas fa-search"></i> Search';
            }
        }
    }

    

    /**
     * Setup directory functionality
     */
    setupDirectoryFunctionality() {
        const viewDirectoryBtn = document.getElementById('viewDirectoryBtn');
        const closeDirectoryBtn = document.getElementById('closeDirectoryBtn');

        if (viewDirectoryBtn) {
            viewDirectoryBtn.addEventListener('click', async () => {
                this.showPanel('directoryPanel');
                await this.loadDirectory();
            });
        }

        if (closeDirectoryBtn) {
            closeDirectoryBtn.addEventListener('click', () => {
                this.hidePanel('directoryPanel');
            });
        }
    }

    /**
     * Load and display directory
     */
    async loadDirectory() {
        try {
            const [directoryData, statsData] = await Promise.all([
                window.apiManager.getDirectory(),
                window.apiManager.getStats()
            ]);

            this.displayDirectoryStats(statsData);
            this.displayDirectory(directoryData);

        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    /**
     * Display directory statistics
     * @param {Object} data - Statistics data
     */
    displayDirectoryStats(data) {
        const directoryStats = document.getElementById('directoryStats');
        if (!directoryStats || !data.statistics) return;

        const stats = [
            { label: 'Total Contacts', value: data.statistics.totalContacts, icon: 'fas fa-users' },
            { label: 'Departments', value: data.statistics.departmentCount, icon: 'fas fa-building' },
            { label: 'Companies', value: data.statistics.companyCount, icon: 'fas fa-industry' },
            { label: 'With Phone', value: data.statistics.contactsWithPhone, icon: 'fas fa-phone' }
        ];

        directoryStats.innerHTML = stats.map(stat => `
            <div class="stat-card">
                <div class="stat-number">${stat.value}</div>
                <div class="stat-label">
                    <i class="${stat.icon}"></i> ${stat.label}
                </div>
            </div>
        `).join('');
    }

    /**
     * Display directory content
     * @param {Object} data - Directory data
     */
    displayDirectory(data) {
        const directoryContent = document.getElementById('directoryContent');
        if (!directoryContent || !data.data) return;

        directoryContent.innerHTML = '';

        if (data.data.contactsByDepartment) {
            Object.entries(data.data.contactsByDepartment).forEach(([department, contacts]) => {
                const section = document.createElement('div');
                section.className = 'department-section';

                section.innerHTML = `
                    <div class="department-header">
                        <i class="fas fa-building"></i> ${department} (${contacts.length})
                    </div>
                    <div class="department-contacts">
                        ${contacts.map(contact => this.createContactCard(contact)).join('')}
                    </div>
                `;

                directoryContent.appendChild(section);
            });
        }
    }

    /**
     * Create contact card element
     * @param {Object} contact - Contact data
     * @returns {string} Contact card HTML
     */
    createContactCard(contact) {
        return `
            <div class="contact-card" onclick="window.ui.selectDirectoryContact('${contact.email}')">
                <div class="contact-name">${contact.fullName}</div>
                <div class="contact-title">${contact.jobTitle || 'N/A'}</div>
                <a href="mailto:${contact.email}" class="contact-email" onclick="event.stopPropagation()">${contact.email}</a>
                <div class="contact-phone">
                    <i class="fas fa-phone"></i> ${contact.phoneNumber || 'N/A'}
                </div>
            </div>
        `;
    }

    /**
     * Select contact from directory
     * @param {string} email - Contact email
     */
    selectDirectoryContact(email) {
        this.hidePanel('directoryPanel');
        const senderEmail = document.getElementById('senderEmail');
        if (senderEmail) {
            senderEmail.value = email;
            this.enrichContact(email);
        }
    }

    

    /**
     * Setup general UI interactions
     */
    setupGeneralInteractions() {
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAllPanels();
            }
        });

        
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('panel') && this.currentPanel) {
                this.hidePanel(this.currentPanel);
            }
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.showPanel('searchPanel');
                document.getElementById('searchQuery')?.focus();
            }

            
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                document.getElementById('viewDirectoryBtn')?.click();
            }
        });
    }

    /**
     * Show a panel
     * @param {string} panelId - Panel element ID
     */
    showPanel(panelId) {
        this.hideAllPanels();
        
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'block';
            this.currentPanel = panelId;
            
            
            const firstInput = panel.querySelector('input');
            if (firstInput) {
                setTimeout(() => firstInput.focus(), 100);
            }
        }
    }

    /**
     * Hide a panel
     * @param {string} panelId - Panel element ID
     */
    hidePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.style.display = 'none';
            if (this.currentPanel === panelId) {
                this.currentPanel = null;
            }
        }
    }

    /**
     * Hide all panels
     */
    hideAllPanels() {
        const panels = ['searchPanel', 'directoryPanel'];
        panels.forEach(panelId => this.hidePanel(panelId));
    }

    /**
     * Show loading indicator
     * @param {boolean} show - Whether to show loading
     * @param {string} message - Loading message
     */
    showLoading(show, message = 'Loading...') {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            if (show) {
                loadingIndicator.style.display = 'flex';
                const messageElement = loadingIndicator.querySelector('p');
                if (messageElement) {
                    messageElement.textContent = message;
                }
            } else {
                loadingIndicator.style.display = 'none';
            }
        }
    }

    /**
     * Set form loading state
     * @param {HTMLElement} button - Submit button
     * @param {boolean} loading - Loading state
     */
    setFormLoading(button, loading) {
        if (!button) return;

        if (loading) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Signing in...</span>';
        } else {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-sign-in-alt"></i> <span>Sign In</span>';
        }
    }

    /**
     * Show message to user
     * @param {string} message - Message text
     * @param {string} type - Message type (success, error, warning, info)
     */
    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('messageContainer');
        if (!messageContainer) return;

        const messageId = Date.now().toString();
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.id = messageId;
        messageElement.textContent = message;

        messageContainer.appendChild(messageElement);
        this.activeMessages.add(messageId);

        
        setTimeout(() => {
            this.removeMessage(messageId);
        }, CONFIG.UI.MESSAGE_DURATION);

        
        messageElement.addEventListener('click', () => {
            this.removeMessage(messageId);
        });
    }

    /**
     * Remove message
     * @param {string} messageId - Message ID
     */
    removeMessage(messageId) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                messageElement.remove();
                this.activeMessages.delete(messageId);
            }, 300);
        }
    }

    /**
     * Clear all messages
     */
    clearAllMessages() {
        this.activeMessages.forEach(messageId => {
            this.removeMessage(messageId);
        });
    }
}


window.ui = new UIManager();


const style = document.createElement('style');
style.textContent = `
    @keyframes slideOut {
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style); 