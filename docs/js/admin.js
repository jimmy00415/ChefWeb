/**
 * Admin Dashboard JavaScript
 * Handles authentication, data loading, and UI interactions
 */

const AdminApp = {
    token: null,
    currentPage: 0,
    pageSize: 20,

    /**
     * Initialize the admin app
     */
    init() {
        this.token = localStorage.getItem('adminToken');
        this.setupEventListeners();
        this.checkAuth();
    },

    /**
     * Check if user is authenticated
     */
    async checkAuth() {
        const isLoginPage = window.location.pathname.includes('login.html');

        if (!this.token) {
            if (!isLoginPage) {
                window.location.href = 'login.html';
            }
            return false;
        }

        try {
            const response = await this.apiRequest('/api/admin/verify');
            if (!response.ok) {
                throw new Error('Invalid session');
            }
            
            if (isLoginPage) {
                window.location.href = 'dashboard.html';
            }
            return true;
        } catch (error) {
            console.error('Auth check failed:', error);
            this.logout();
            return false;
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Booking filters
        const applyFilters = document.getElementById('applyFilters');
        if (applyFilters) {
            applyFilters.addEventListener('click', () => this.loadBookings());
        }

        const clearFilters = document.getElementById('clearFilters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                document.getElementById('filterStatus').value = '';
                document.getElementById('filterPayment').value = '';
                document.getElementById('filterSearch').value = '';
                this.loadBookings();
            });
        }

        // Pagination
        const prevPage = document.getElementById('prevPage');
        if (prevPage) {
            prevPage.addEventListener('click', () => {
                if (this.currentPage > 0) {
                    this.currentPage--;
                    this.loadBookings();
                }
            });
        }

        const nextPage = document.getElementById('nextPage');
        if (nextPage) {
            nextPage.addEventListener('click', () => {
                this.currentPage++;
                this.loadBookings();
            });
        }

        // Modal close
        const closeModal = document.getElementById('closeModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const modalBackdrop = document.getElementById('modalBackdrop');
        
        [closeModal, closeModalBtn, modalBackdrop].forEach(el => {
            if (el) el.addEventListener('click', () => this.closeModal('bookingModal'));
        });

        // Contact modal
        const closeContactModal = document.getElementById('closeContactModal');
        const closeContactModalBtn = document.getElementById('closeContactModalBtn');
        const contactModalBackdrop = document.getElementById('contactModalBackdrop');
        
        [closeContactModal, closeContactModalBtn, contactModalBackdrop].forEach(el => {
            if (el) el.addEventListener('click', () => this.closeModal('contactModal'));
        });

        // Contact filters
        const applyContactFilters = document.getElementById('applyContactFilters');
        if (applyContactFilters) {
            applyContactFilters.addEventListener('click', () => this.loadContacts());
        }

        // Contact status update
        const updateContactStatus = document.getElementById('updateContactStatus');
        if (updateContactStatus) {
            updateContactStatus.addEventListener('change', (e) => {
                if (e.target.value && this.currentContactId) {
                    this.updateContactStatus(this.currentContactId, e.target.value);
                }
            });
        }
    },

    /**
     * Make authenticated API request
     */
    async apiRequest(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        return fetch(`${window.API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });
    },

    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const apiKey = document.getElementById('apiKey').value;
        const loginBtn = document.getElementById('loginBtn');
        const loginError = document.getElementById('loginError');
        
        if (!apiKey) {
            loginError.textContent = 'Please enter your API key';
            return;
        }

        loginBtn.disabled = true;
        loginBtn.textContent = 'Signing in...';
        loginError.textContent = '';

        try {
            const response = await fetch(`${window.API_BASE_URL}/api/admin/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey })
            });

            const result = await response.json();

            if (response.ok && result.token) {
                localStorage.setItem('adminToken', result.token);
                window.location.href = 'dashboard.html';
            } else {
                loginError.textContent = result.error || 'Invalid API key';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'Unable to connect to server';
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Sign In';
        }
    },

    /**
     * Logout user
     */
    async logout() {
        try {
            await this.apiRequest('/api/admin/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        localStorage.removeItem('adminToken');
        window.location.href = 'login.html';
    },

    /**
     * Load dashboard stats
     */
    async loadDashboard() {
        if (!await this.checkAuth()) return;

        try {
            const response = await this.apiRequest('/api/admin/stats');
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            // Update stats
            document.getElementById('statTodaysEvents').textContent = data.summary.todaysEvents;
            document.getElementById('statPendingPayments').textContent = data.summary.pendingPayments;
            document.getElementById('statMonthlyRevenue').textContent = this.formatCurrency(data.summary.monthlyRevenue);
            document.getElementById('statNewContacts').textContent = data.summary.newContacts;

            // Render recent bookings
            this.renderRecentBookings(data.recentBookings);

            // Render upcoming events
            this.renderUpcomingEvents(data.upcomingEvents);

        } catch (error) {
            console.error('Dashboard load error:', error);
        }
    },

    /**
     * Render recent bookings table
     */
    renderRecentBookings(bookings) {
        const tbody = document.getElementById('recentBookingsBody');
        if (!tbody) return;

        if (!bookings || bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="admin-table__empty">No bookings yet</td></tr>';
            return;
        }

        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td><code>${b.confirmation_number}</code></td>
                <td>${this.escapeHtml(b.contact_name)}</td>
                <td>${this.formatDate(b.event_date)}</td>
                <td><span class="status-badge status-badge--${b.status}">${this.formatStatus(b.status)}</span></td>
                <td>${this.formatCurrency(b.total)}</td>
            </tr>
        `).join('');
    },

    /**
     * Render upcoming events
     */
    renderUpcomingEvents(events) {
        const container = document.getElementById('upcomingEvents');
        if (!container) return;

        if (!events || events.length === 0) {
            container.innerHTML = '<p class="admin-table__empty">No upcoming events</p>';
            return;
        }

        container.innerHTML = events.map(e => `
            <div class="event-card">
                <div class="event-card__date">
                    <span class="event-card__day">${new Date(e.event_date).getDate()}</span>
                    <span class="event-card__month">${new Date(e.event_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                </div>
                <div class="event-card__details">
                    <strong>${this.escapeHtml(e.contact_name)}</strong>
                    <span>${e.event_time} · ${e.city}, ${e.service_state}</span>
                    <span>${e.num_adults} adults, ${e.num_children || 0} kids · ${e.package}</span>
                </div>
                <div class="event-card__contact">
                    <a href="tel:${e.contact_phone}">${e.contact_phone}</a>
                </div>
            </div>
        `).join('');
    },

    /**
     * Load bookings list
     */
    async loadBookings() {
        if (!await this.checkAuth()) return;

        const status = document.getElementById('filterStatus')?.value;
        const paymentStatus = document.getElementById('filterPayment')?.value;
        const search = document.getElementById('filterSearch')?.value;

        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (paymentStatus) params.set('paymentStatus', paymentStatus);
        if (search) params.set('search', search);
        params.set('limit', this.pageSize);
        params.set('offset', this.currentPage * this.pageSize);

        try {
            const response = await this.apiRequest(`/api/admin/bookings?${params}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            this.renderBookingsTable(data.bookings);
            this.updatePagination(data.total);

        } catch (error) {
            console.error('Bookings load error:', error);
            document.getElementById('bookingsBody').innerHTML = 
                '<tr><td colspan="10" class="admin-table__error">Failed to load bookings</td></tr>';
        }
    },

    /**
     * Render bookings table
     */
    renderBookingsTable(bookings) {
        const tbody = document.getElementById('bookingsBody');
        if (!tbody) return;

        if (!bookings || bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" class="admin-table__empty">No bookings found</td></tr>';
            return;
        }

        tbody.innerHTML = bookings.map(b => `
            <tr>
                <td><code>${b.confirmation_number}</code></td>
                <td>${this.escapeHtml(b.contact_name)}</td>
                <td><a href="mailto:${b.contact_email}">${b.contact_email}</a></td>
                <td>${this.formatDate(b.event_date)}</td>
                <td>${b.package}</td>
                <td>${b.num_adults}A / ${b.num_children || 0}C</td>
                <td>${this.formatCurrency(b.total)}</td>
                <td><span class="status-badge status-badge--${b.status}">${this.formatStatus(b.status)}</span></td>
                <td><span class="status-badge status-badge--${b.payment_status}">${this.formatStatus(b.payment_status)}</span></td>
                <td>
                    <button class="btn btn--sm btn--outline" onclick="AdminApp.viewBooking('${b.id}')">View</button>
                </td>
            </tr>
        `).join('');
    },

    /**
     * Update pagination controls
     */
    updatePagination(total) {
        const start = this.currentPage * this.pageSize + 1;
        const end = Math.min((this.currentPage + 1) * this.pageSize, total);
        
        const info = document.getElementById('paginationInfo');
        if (info) {
            info.textContent = `Showing ${total > 0 ? start : 0}-${end} of ${total}`;
        }

        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        if (prevBtn) prevBtn.disabled = this.currentPage === 0;
        if (nextBtn) nextBtn.disabled = end >= total;
    },

    /**
     * View booking details
     */
    async viewBooking(id) {
        try {
            const response = await this.apiRequest(`/api/admin/bookings/${id}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            const b = data.booking;
            const detail = document.getElementById('bookingDetail');
            
            detail.innerHTML = `
                <div class="booking-detail">
                    <div class="booking-detail__section">
                        <h4>Booking Info</h4>
                        <p><strong>Confirmation:</strong> ${b.confirmation_number}</p>
                        <p><strong>Status:</strong> <span class="status-badge status-badge--${b.status}">${this.formatStatus(b.status)}</span></p>
                        <p><strong>Payment:</strong> <span class="status-badge status-badge--${b.payment_status}">${this.formatStatus(b.payment_status)}</span></p>
                        <p><strong>Created:</strong> ${this.formatDateTime(b.created_at)}</p>
                    </div>
                    
                    <div class="booking-detail__section">
                        <h4>Event Details</h4>
                        <p><strong>Date:</strong> ${this.formatDate(b.event_date)} at ${b.event_time}</p>
                        <p><strong>Location:</strong> ${b.city}, ${b.service_state}</p>
                        <p><strong>Venue:</strong> ${b.venue_type || 'N/A'}</p>
                        <p><strong>Address:</strong> ${b.venue_address || 'N/A'}</p>
                    </div>
                    
                    <div class="booking-detail__section">
                        <h4>Party Details</h4>
                        <p><strong>Package:</strong> ${b.package}</p>
                        <p><strong>Adults:</strong> ${b.num_adults}</p>
                        <p><strong>Children:</strong> ${b.num_children || 0}</p>
                        <p><strong>Dietary Notes:</strong> ${b.dietary_notes || 'None'}</p>
                        <p><strong>Special Requests:</strong> ${b.special_requests || 'None'}</p>
                    </div>
                    
                    <div class="booking-detail__section">
                        <h4>Contact</h4>
                        <p><strong>Name:</strong> ${this.escapeHtml(b.contact_name)}</p>
                        <p><strong>Email:</strong> <a href="mailto:${b.contact_email}">${b.contact_email}</a></p>
                        <p><strong>Phone:</strong> <a href="tel:${b.contact_phone}">${b.contact_phone}</a></p>
                    </div>
                    
                    <div class="booking-detail__section">
                        <h4>Pricing</h4>
                        <p><strong>Base:</strong> ${this.formatCurrency(b.base_amount)}</p>
                        <p><strong>Add-ons:</strong> ${this.formatCurrency(b.addons_total)}</p>
                        <p><strong>Travel Fee:</strong> ${this.formatCurrency(b.travel_fee)}</p>
                        <p><strong>Total:</strong> <strong>${this.formatCurrency(b.total)}</strong></p>
                    </div>
                    
                    ${data.payments && data.payments.length > 0 ? `
                    <div class="booking-detail__section">
                        <h4>Payments</h4>
                        ${data.payments.map(p => `
                            <p>${this.formatDateTime(p.created_at)}: ${this.formatCurrency(p.amount / 100)} - ${p.status}</p>
                        `).join('')}
                    </div>
                    ` : ''}
                </div>
            `;

            document.getElementById('bookingModal').classList.add('modal--open');

        } catch (error) {
            console.error('View booking error:', error);
            alert('Failed to load booking details');
        }
    },

    /**
     * Load contacts list
     */
    async loadContacts() {
        if (!await this.checkAuth()) return;

        const status = document.getElementById('filterContactStatus')?.value;
        const params = new URLSearchParams();
        if (status) params.set('status', status);

        try {
            const response = await this.apiRequest(`/api/admin/contacts?${params}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            this.renderContactsTable(data.contacts);

        } catch (error) {
            console.error('Contacts load error:', error);
            document.getElementById('contactsBody').innerHTML = 
                '<tr><td colspan="7" class="admin-table__error">Failed to load contacts</td></tr>';
        }
    },

    /**
     * Render contacts table
     */
    renderContactsTable(contacts) {
        const tbody = document.getElementById('contactsBody');
        if (!tbody) return;

        if (!contacts || contacts.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="admin-table__empty">No contact inquiries</td></tr>';
            return;
        }

        tbody.innerHTML = contacts.map(c => `
            <tr>
                <td>${this.formatDateTime(c.created_at)}</td>
                <td>${this.escapeHtml(c.name)}</td>
                <td><a href="mailto:${c.email}">${c.email}</a></td>
                <td>${c.reason || '-'}</td>
                <td>${this.escapeHtml(c.subject || '-')}</td>
                <td><span class="status-badge status-badge--${c.status}">${this.formatStatus(c.status)}</span></td>
                <td>
                    <button class="btn btn--sm btn--outline" onclick="AdminApp.viewContact('${c.id}')">View</button>
                </td>
            </tr>
        `).join('');
    },

    /**
     * View contact details
     */
    async viewContact(id) {
        this.currentContactId = id;
        
        try {
            const response = await this.apiRequest(`/api/contact/${id}`);
            const c = await response.json();

            if (!response.ok) throw new Error(c.error);

            const detail = document.getElementById('contactDetail');
            detail.innerHTML = `
                <div class="contact-detail">
                    <p><strong>From:</strong> ${this.escapeHtml(c.name)}</p>
                    <p><strong>Email:</strong> <a href="mailto:${c.email}">${c.email}</a></p>
                    <p><strong>Phone:</strong> ${c.phone || 'Not provided'}</p>
                    <p><strong>Reason:</strong> ${c.reason || 'General'}</p>
                    <p><strong>Subject:</strong> ${this.escapeHtml(c.subject || 'No subject')}</p>
                    <p><strong>Received:</strong> ${this.formatDateTime(c.created_at)}</p>
                    <p><strong>Status:</strong> <span class="status-badge status-badge--${c.status}">${this.formatStatus(c.status)}</span></p>
                    
                    <div class="contact-detail__message">
                        <h4>Message:</h4>
                        <p>${this.escapeHtml(c.message)}</p>
                    </div>
                </div>
            `;

            // Update reply link
            const replyLink = document.getElementById('replyEmailLink');
            if (replyLink) {
                replyLink.href = `mailto:${c.email}?subject=Re: ${encodeURIComponent(c.subject || 'Your inquiry to POP Habachi')}`;
            }

            // Reset status dropdown
            document.getElementById('updateContactStatus').value = '';

            document.getElementById('contactModal').classList.add('modal--open');

        } catch (error) {
            console.error('View contact error:', error);
            alert('Failed to load contact details');
        }
    },

    /**
     * Update contact status
     */
    async updateContactStatus(id, status) {
        try {
            const response = await this.apiRequest(`/api/contact/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status })
            });

            if (!response.ok) throw new Error('Failed to update');

            // Refresh the view
            this.viewContact(id);
            this.loadContacts();

        } catch (error) {
            console.error('Update contact error:', error);
            alert('Failed to update status');
        }
    },

    /**
     * Close modal
     */
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('modal--open');
        }
    },

    // ============================================
    // Utility Functions
    // ============================================

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount || 0);
    },

    formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    },

    formatDateTime(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    },

    formatStatus(status) {
        if (!status) return '-';
        return status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    },

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    AdminApp.init();
});

// Export for use in HTML
window.AdminApp = AdminApp;
