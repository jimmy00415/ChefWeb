/**
 * Booking Management JavaScript
 * Handles lookup, modify, and cancel booking flows
 */

document.addEventListener('DOMContentLoaded', () => {
    // Detect which page we're on
    const isLookupPage = document.getElementById('lookupForm') !== null;
    const isModifyPage = document.getElementById('modifyForm') !== null;
    const isCancelPage = document.getElementById('cancelForm') !== null;

    if (isLookupPage) {
        initLookupPage();
    } else if (isModifyPage) {
        initModifyPage();
    } else if (isCancelPage) {
        initCancelPage();
    }
});

// ============================================
// LOOKUP PAGE
// ============================================

function initLookupPage() {
    const form = document.getElementById('lookupForm');
    const confirmationInput = document.getElementById('confirmation');
    const emailInput = document.getElementById('email');
    const errorDiv = document.getElementById('lookupError');
    const lookupBtn = document.getElementById('lookupBtn');
    const lookupSection = document.getElementById('lookupSection');
    const bookingDetails = document.getElementById('bookingDetails');

    // Auto-format confirmation number
    confirmationInput.addEventListener('input', (e) => {
        let value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        // Auto-add CHF- prefix if user starts typing numbers
        if (value && !value.startsWith('CHF-') && /^\d/.test(value)) {
            value = 'CHF-' + value;
        }
        e.target.value = value;
    });

    // Pre-fill from URL params or sessionStorage
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('confirmation')) {
        confirmationInput.value = urlParams.get('confirmation').toUpperCase();
    }
    if (urlParams.get('email')) {
        emailInput.value = urlParams.get('email');
    }

    // Check sessionStorage for saved booking data
    const savedBooking = sessionStorage.getItem('currentBooking');
    if (savedBooking) {
        const data = JSON.parse(savedBooking);
        displayBookingDetails(data.booking, data.permissions, lookupSection, bookingDetails);
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const confirmation = confirmationInput.value.trim();
        const email = emailInput.value.trim();

        if (!confirmation || !email) {
            showError(errorDiv, 'Please enter both confirmation number and email.');
            return;
        }

        setButtonLoading(lookupBtn, true);
        hideError(errorDiv);

        try {
            const response = await apiRequest(`/api/bookings/lookup?confirmation=${encodeURIComponent(confirmation)}&email=${encodeURIComponent(email)}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Booking not found');
            }

            // Save to session for modify/cancel pages
            sessionStorage.setItem('currentBooking', JSON.stringify(data));
            sessionStorage.setItem('lookupEmail', email);

            // Display booking details
            displayBookingDetails(data.booking, data.permissions, lookupSection, bookingDetails);

        } catch (error) {
            showError(errorDiv, error.message);
        } finally {
            setButtonLoading(lookupBtn, false);
        }
    });
}

function displayBookingDetails(booking, permissions, lookupSection, bookingDetails) {
    lookupSection.style.display = 'none';
    bookingDetails.style.display = 'block';

    const statusBadge = getStatusBadge(booking.status);
    const paymentBadge = getPaymentBadge(booking.payment_status || booking.paymentStatus);
    const eventDate = formatDate(booking.event_date || booking.eventDate);
    const eventTime = formatTime(booking.event_time || booking.eventTime);

    bookingDetails.innerHTML = `
        <div class="booking-details-header">
            <a href="booking-lookup.html" class="back-link" onclick="sessionStorage.removeItem('currentBooking')">← Look Up Another Booking</a>
            <h1 class="heading-2">Your Booking</h1>
        </div>

        <div class="card booking-card">
            <div class="card__header">
                <div class="confirmation-display">
                    <span class="confirmation-label">Confirmation Number</span>
                    <span class="confirmation-number">${booking.confirmation_number || booking.confirmationNumber}</span>
                </div>
                <div class="status-badges">
                    ${statusBadge}
                    ${paymentBadge}
                </div>
            </div>
            <div class="card__body">
                <div class="booking-grid">
                    <div class="booking-section">
                        <h4 class="booking-section__title">Event Details</h4>
                        <div class="detail-row">
                            <span class="detail-label">📅 Date</span>
                            <span class="detail-value">${eventDate}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">🕐 Time</span>
                            <span class="detail-value">${eventTime}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">📍 Location</span>
                            <span class="detail-value">${booking.city}, ${booking.service_state || booking.serviceState}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">🍽️ Package</span>
                            <span class="detail-value">${capitalizeFirst(booking.package)}</span>
                        </div>
                    </div>
                    <div class="booking-section">
                        <h4 class="booking-section__title">Guest Information</h4>
                        <div class="detail-row">
                            <span class="detail-label">👤 Name</span>
                            <span class="detail-value">${booking.contact_name || booking.contactName}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">👥 Adults</span>
                            <span class="detail-value">${booking.num_adults || booking.numAdults}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">👶 Children</span>
                            <span class="detail-value">${booking.num_children || booking.numChildren || 0}</span>
                        </div>
                        <div class="detail-row detail-row--total">
                            <span class="detail-label">💰 Total</span>
                            <span class="detail-value">${formatCurrency(booking.total)}</span>
                        </div>
                    </div>
                </div>

                ${booking.dietary_notes || booking.dietaryNotes ? `
                <div class="notes-section">
                    <strong>Dietary Notes:</strong> ${booking.dietary_notes || booking.dietaryNotes}
                </div>
                ` : ''}

                ${booking.special_requests || booking.specialRequests ? `
                <div class="notes-section">
                    <strong>Special Requests:</strong> ${booking.special_requests || booking.specialRequests}
                </div>
                ` : ''}
            </div>
        </div>

        ${booking.status !== 'cancelled' ? `
        <div class="action-cards">
            ${permissions.canModify ? `
            <div class="action-card action-card--modify">
                <div class="action-card__icon">📝</div>
                <h3 class="action-card__title">Modify Booking</h3>
                <p class="action-card__description">Change date, time, or guest count</p>
                <a href="booking-modify.html" class="btn btn--secondary btn--full">Modify</a>
            </div>
            ` : `
            <div class="action-card action-card--disabled">
                <div class="action-card__icon">📝</div>
                <h3 class="action-card__title">Modify Booking</h3>
                <p class="action-card__description">${permissions.modifyDeadline || 'Not available'}</p>
                <button class="btn btn--secondary btn--full" disabled>Modify</button>
            </div>
            `}

            ${permissions.canCancel ? `
            <div class="action-card action-card--cancel">
                <div class="action-card__icon">❌</div>
                <h3 class="action-card__title">Cancel Booking</h3>
                <p class="action-card__description">${permissions.refundPercentage}% refund available</p>
                <a href="booking-cancel.html" class="btn btn--danger-outline btn--full">Cancel</a>
            </div>
            ` : `
            <div class="action-card action-card--disabled">
                <div class="action-card__icon">❌</div>
                <h3 class="action-card__title">Cancel Booking</h3>
                <p class="action-card__description">${permissions.cancelDeadline || 'Not available'}</p>
                <button class="btn btn--danger-outline btn--full" disabled>Cancel</button>
            </div>
            `}
        </div>

        <div class="help-section">
            <p>Need help with your booking? <a href="contact.html">Contact us</a></p>
        </div>
        ` : `
        <div class="cancelled-notice">
            <h3>This Booking Has Been Cancelled</h3>
            <p>Cancelled on: ${booking.cancelled_at ? formatDate(booking.cancelled_at) : 'N/A'}</p>
            ${booking.refund_amount > 0 ? `<p>Refund amount: ${formatCurrency(booking.refund_amount)}</p>` : ''}
            <a href="booking.html" class="btn btn--primary">Book Again</a>
        </div>
        `}
    `;
}

// ============================================
// MODIFY PAGE
// ============================================

function initModifyPage() {
    const savedBooking = sessionStorage.getItem('currentBooking');
    const savedEmail = sessionStorage.getItem('lookupEmail');

    if (!savedBooking || !savedEmail) {
        window.location.href = 'booking-lookup.html';
        return;
    }

    const { booking, permissions } = JSON.parse(savedBooking);
    const form = document.getElementById('modifyForm');
    const modifyCard = document.getElementById('modifyCard');
    const notAllowedCard = document.getElementById('notAllowedCard');
    const currentBookingInfo = document.getElementById('currentBookingInfo');
    const confirmationBadge = document.getElementById('confirmationBadge');

    // Show confirmation number
    confirmationBadge.textContent = booking.confirmation_number || booking.confirmationNumber;

    // Display current booking info
    currentBookingInfo.innerHTML = `
        <div class="current-info-grid">
            <div class="current-info-item">
                <span class="label">Date</span>
                <span class="value">${formatDate(booking.event_date || booking.eventDate)}</span>
            </div>
            <div class="current-info-item">
                <span class="label">Time</span>
                <span class="value">${formatTime(booking.event_time || booking.eventTime)}</span>
            </div>
            <div class="current-info-item">
                <span class="label">Adults</span>
                <span class="value">${booking.num_adults || booking.numAdults}</span>
            </div>
            <div class="current-info-item">
                <span class="label">Children</span>
                <span class="value">${booking.num_children || booking.numChildren || 0}</span>
            </div>
            <div class="current-info-item">
                <span class="label">Package</span>
                <span class="value">${capitalizeFirst(booking.package)}</span>
            </div>
            <div class="current-info-item">
                <span class="label">Total</span>
                <span class="value">${formatCurrency(booking.total)}</span>
            </div>
        </div>
    `;

    // Check if modification is allowed
    if (!permissions.canModify) {
        modifyCard.style.display = 'none';
        notAllowedCard.style.display = 'block';
        document.getElementById('notAllowedReason').textContent = permissions.modifyDeadline || 'Modifications are not available for this booking.';
        return;
    }

    modifyCard.style.display = 'block';

    // Pre-fill form with current values
    document.getElementById('bookingId').value = booking.id;
    document.getElementById('bookingEmail').value = savedEmail;

    // Set date with minimum 3 days from now
    const dateInput = document.getElementById('eventDate');
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    dateInput.min = minDate.toISOString().split('T')[0];
    dateInput.value = (booking.event_date || booking.eventDate).split('T')[0];

    // Set time
    const timeInput = document.getElementById('eventTime');
    const eventTime = booking.event_time || booking.eventTime;
    if (eventTime) {
        timeInput.value = eventTime.substring(0, 5);
    }

    // Set guest counts
    document.getElementById('numAdults').value = booking.num_adults || booking.numAdults;
    document.getElementById('numChildren').value = booking.num_children || booking.numChildren || 0;

    // Set notes
    document.getElementById('dietaryNotes').value = booking.dietary_notes || booking.dietaryNotes || '';
    document.getElementById('specialRequests').value = booking.special_requests || booking.specialRequests || '';

    // Store original values for price calculation
    const originalValues = {
        numAdults: parseInt(booking.num_adults || booking.numAdults),
        numChildren: parseInt(booking.num_children || booking.numChildren || 0),
        total: parseFloat(booking.total),
        packagePrice: getPackagePrice(booking.package)
    };

    // Price preview on guest count change
    const numAdultsInput = document.getElementById('numAdults');
    const numChildrenInput = document.getElementById('numChildren');
    const pricePreview = document.getElementById('pricePreview');

    function updatePricePreview() {
        const newAdults = parseInt(numAdultsInput.value) || 0;
        const newChildren = parseInt(numChildrenInput.value) || 0;

        if (newAdults !== originalValues.numAdults || newChildren !== originalValues.numChildren) {
            const newBase = newAdults * originalValues.packagePrice;
            const newChildrenTotal = newChildren * (originalValues.packagePrice * 0.5);
            const addonsTotal = parseFloat(booking.addons_total || booking.addonsTotal || 0);
            const travelFee = parseFloat(booking.travel_fee || booking.travelFee || 0);
            const newSubtotal = newBase + newChildrenTotal + addonsTotal;
            const newTotal = newSubtotal + travelFee;

            document.getElementById('originalTotal').textContent = formatCurrency(originalValues.total);
            document.getElementById('newTotal').textContent = formatCurrency(newTotal);

            const diff = newTotal - originalValues.total;
            const priceDiffRow = document.getElementById('priceDiffRow');
            const priceDiff = document.getElementById('priceDiff');
            
            if (diff !== 0) {
                priceDiffRow.style.display = 'flex';
                priceDiff.textContent = (diff > 0 ? '+' : '') + formatCurrency(diff);
                priceDiff.className = diff > 0 ? 'price-increase' : 'price-decrease';
            } else {
                priceDiffRow.style.display = 'none';
            }

            pricePreview.style.display = 'block';
        } else {
            pricePreview.style.display = 'none';
        }
    }

    numAdultsInput.addEventListener('input', updatePricePreview);
    numChildrenInput.addEventListener('input', updatePricePreview);

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const modifyBtn = document.getElementById('modifyBtn');
        const errorDiv = document.getElementById('modifyError');

        setButtonLoading(modifyBtn, true);
        hideError(errorDiv);

        const payload = {
            email: savedEmail,
            eventDate: dateInput.value,
            eventTime: timeInput.value + ':00',
            numAdults: parseInt(numAdultsInput.value),
            numChildren: parseInt(numChildrenInput.value),
            dietaryNotes: document.getElementById('dietaryNotes').value,
            specialRequests: document.getElementById('specialRequests').value
        };

        try {
            const response = await apiRequest(`/api/bookings/${booking.id}/modify`, {
                method: 'PATCH',
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to modify booking');
            }

            // Update session storage with new booking data
            sessionStorage.setItem('currentBooking', JSON.stringify({
                booking: data.booking,
                permissions: permissions
            }));

            // Show success and redirect
            alert('Your booking has been successfully modified!');
            window.location.href = 'booking-lookup.html';

        } catch (error) {
            showError(errorDiv, error.message);
        } finally {
            setButtonLoading(modifyBtn, false);
        }
    });
}

// ============================================
// CANCEL PAGE
// ============================================

function initCancelPage() {
    const savedBooking = sessionStorage.getItem('currentBooking');
    const savedEmail = sessionStorage.getItem('lookupEmail');

    if (!savedBooking || !savedEmail) {
        window.location.href = 'booking-lookup.html';
        return;
    }

    const { booking, permissions } = JSON.parse(savedBooking);
    const form = document.getElementById('cancelForm');
    const cancelSection = document.getElementById('cancelSection');
    const successSection = document.getElementById('successSection');
    const bookingSummary = document.getElementById('bookingSummary');
    const confirmationBadge = document.getElementById('confirmationBadge');
    const refundCard = document.getElementById('refundCard');
    const cancelFormCard = document.getElementById('cancelFormCard');
    const notAllowedCard = document.getElementById('notAllowedCard');

    // Show confirmation number
    confirmationBadge.textContent = booking.confirmation_number || booking.confirmationNumber;

    // Display booking summary
    bookingSummary.innerHTML = `
        <div class="summary-grid">
            <div class="summary-item">
                <span class="label">Date</span>
                <span class="value">${formatDate(booking.event_date || booking.eventDate)}</span>
            </div>
            <div class="summary-item">
                <span class="label">Time</span>
                <span class="value">${formatTime(booking.event_time || booking.eventTime)}</span>
            </div>
            <div class="summary-item">
                <span class="label">Location</span>
                <span class="value">${booking.city}, ${booking.service_state || booking.serviceState}</span>
            </div>
            <div class="summary-item">
                <span class="label">Guests</span>
                <span class="value">${booking.num_adults || booking.numAdults} Adults, ${booking.num_children || booking.numChildren || 0} Children</span>
            </div>
            <div class="summary-item summary-item--total">
                <span class="label">Total</span>
                <span class="value">${formatCurrency(booking.total)}</span>
            </div>
        </div>
    `;

    // Check if cancellation is allowed
    if (!permissions.canCancel) {
        refundCard.style.display = 'none';
        cancelFormCard.style.display = 'none';
        notAllowedCard.style.display = 'block';
        document.getElementById('notAllowedReason').textContent = permissions.cancelDeadline || 'Cancellation is not available for this booking.';
        return;
    }

    refundCard.style.display = 'block';
    cancelFormCard.style.display = 'block';

    // Fill hidden form fields
    document.getElementById('bookingId').value = booking.id;
    document.getElementById('bookingEmail').value = savedEmail;

    // Highlight current refund tier
    const daysUntil = permissions.daysUntilEvent;
    document.getElementById('daysUntilEvent').textContent = daysUntil + ' days';

    if (daysUntil > 7) {
        document.getElementById('policy7days').classList.add('active');
        document.getElementById('refundTier').innerHTML = '<span class="badge badge--green">100% Refund</span>';
    } else if (daysUntil >= 3) {
        document.getElementById('policy3to7days').classList.add('active');
        document.getElementById('refundTier').innerHTML = '<span class="badge badge--yellow">50% Refund</span>';
    } else {
        document.getElementById('policy1to3days').classList.add('active');
        document.getElementById('refundTier').innerHTML = '<span class="badge badge--red">No Refund</span>';
    }

    // Calculate estimated refund (assuming full payment)
    const estimatedRefund = parseFloat(booking.total) * (permissions.refundPercentage / 100);
    document.getElementById('estimatedRefund').textContent = formatCurrency(estimatedRefund);

    // Show/hide other reason field
    const cancelReasonSelect = document.getElementById('cancelReason');
    const otherReasonGroup = document.getElementById('otherReasonGroup');

    cancelReasonSelect.addEventListener('change', () => {
        otherReasonGroup.style.display = cancelReasonSelect.value === 'other' ? 'block' : 'none';
    });

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cancelBtn = document.getElementById('cancelBtn');
        const errorDiv = document.getElementById('cancelError');

        // Confirm cancellation
        if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
            return;
        }

        setButtonLoading(cancelBtn, true);
        hideError(errorDiv);

        let reason = cancelReasonSelect.value;
        if (reason === 'other') {
            reason = document.getElementById('otherReason').value || 'Other';
        }

        try {
            const response = await apiRequest(`/api/bookings/${booking.id}/cancel`, {
                method: 'POST',
                body: JSON.stringify({
                    email: savedEmail,
                    reason: reason
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to cancel booking');
            }

            // Clear session storage
            sessionStorage.removeItem('currentBooking');
            sessionStorage.removeItem('lookupEmail');

            // Show success section
            cancelSection.style.display = 'none';
            successSection.style.display = 'block';

            // Display cancellation summary
            document.getElementById('cancelledBookingInfo').innerHTML = `
                <div class="cancelled-summary">
                    <div class="cancelled-item">
                        <span class="label">Confirmation</span>
                        <span class="value">${booking.confirmation_number || booking.confirmationNumber}</span>
                    </div>
                    <div class="cancelled-item">
                        <span class="label">Original Date</span>
                        <span class="value">${formatDate(booking.event_date || booking.eventDate)}</span>
                    </div>
                    ${data.refund.eligible ? `
                    <div class="cancelled-item cancelled-item--refund">
                        <span class="label">Refund Amount</span>
                        <span class="value">${formatCurrency(data.refund.amount)}</span>
                    </div>
                    <p class="refund-note">${data.refund.note}</p>
                    ` : `
                    <p class="refund-note">${data.refund.note}</p>
                    `}
                </div>
            `;

        } catch (error) {
            showError(errorDiv, error.message);
        } finally {
            setButtonLoading(cancelBtn, false);
        }
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeStr) {
    if (!timeStr) return 'N/A';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount || 0);
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getPackagePrice(packageName) {
    const prices = { signature: 75, premium: 95, deluxe: 125 };
    return prices[packageName] || 75;
}

function getStatusBadge(status) {
    const badges = {
        'pending_payment': '<span class="status-badge status-badge--warning">⏳ Pending Payment</span>',
        'confirmed': '<span class="status-badge status-badge--success">✅ Confirmed</span>',
        'fulfilled': '<span class="status-badge status-badge--info">✓ Completed</span>',
        'cancelled': '<span class="status-badge status-badge--danger">❌ Cancelled</span>'
    };
    return badges[status] || `<span class="status-badge">${status}</span>`;
}

function getPaymentBadge(paymentStatus) {
    const badges = {
        'paid': '<span class="payment-badge payment-badge--success">💳 Paid</span>',
        'deposit_paid': '<span class="payment-badge payment-badge--warning">💳 Deposit Paid</span>',
        'unpaid': '<span class="payment-badge payment-badge--danger">💳 Unpaid</span>',
        'pending_refund': '<span class="payment-badge payment-badge--info">🔄 Refund Pending</span>',
        'refunded': '<span class="payment-badge payment-badge--info">↩️ Refunded</span>'
    };
    return badges[paymentStatus] || '';
}

function setButtonLoading(button, isLoading) {
    const textSpan = button.querySelector('.btn-text');
    const loaderSpan = button.querySelector('.btn-loader');
    
    if (isLoading) {
        textSpan.style.display = 'none';
        loaderSpan.style.display = 'inline-flex';
        button.disabled = true;
    } else {
        textSpan.style.display = 'inline';
        loaderSpan.style.display = 'none';
        button.disabled = false;
    }
}

function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

function hideError(element) {
    element.style.display = 'none';
}
