/**
 * Large Event Quote Form Logic
 * - Form validation
 * - Minimum guest count enforcement (50+)
 * - Form submission handling
 */

document.addEventListener('DOMContentLoaded', () => {
    initLargeEventForm();
    setMinDate();
});

function initLargeEventForm() {
    const form = document.getElementById('largeEventForm');
    const guestCountInput = document.getElementById('guestCount');
    
    if (!form) return;

    // Validate guest count minimum on input
    if (guestCountInput) {
        guestCountInput.addEventListener('input', (e) => {
            const count = parseInt(e.target.value);
            if (count && count < 50) {
                e.target.setCustomValidity('Minimum 50 guests for large event quotes');
            } else {
                e.target.setCustomValidity('');
            }
        });
        
        // Clear validation on blur if empty
        guestCountInput.addEventListener('blur', (e) => {
            if (!e.target.value) {
                e.target.setCustomValidity('');
            }
        });
    }

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validate consent
        const consent = document.getElementById('consent');
        if (consent && !consent.checked) {
            alert('Please agree to be contacted regarding your quote');
            consent.focus();
            return;
        }

        // Validate guest count
        const guestCount = parseInt(document.getElementById('guestCount')?.value || 0);
        if (!guestCount || guestCount < 50) {
            alert('Minimum 50 guests required. For smaller events, please use our standard booking form.');
            if (guestCountInput) {
                guestCountInput.focus();
                guestCountInput.setCustomValidity('Minimum 50 guests required');
                guestCountInput.reportValidity();
            }
            return;
        }

        // Collect form data
        const formData = {
            contactName: document.getElementById('contactName')?.value,
            company: document.getElementById('company')?.value,
            email: document.getElementById('email')?.value,
            phone: document.getElementById('phone')?.value,
            eventDate: document.getElementById('eventDate')?.value,
            eventTime: document.getElementById('eventTime')?.value,
            guestCount: guestCount,
            eventType: document.getElementById('eventType')?.value,
            state: document.getElementById('state')?.value,
            city: document.getElementById('city')?.value,
            venueType: document.getElementById('venueType')?.value,
            serviceStyle: document.getElementById('serviceStyle')?.value,
            packagePreference: document.getElementById('packagePreference')?.value,
            budget: document.getElementById('budget')?.value,
            specialRequests: document.getElementById('specialRequests')?.value,
            consent: consent?.checked,
            submittedAt: new Date().toISOString()
        };

        // In production, this would submit to backend
        console.log('Large event quote request:', formData);

        // Show success message
        alert('Thank you for your quote request! Our events team will contact you within 4 business hours to discuss your custom package.');

        // Redirect to homepage
        window.location.href = '../index.html';
    });
}

function setMinDate() {
    const dateInput = document.getElementById('eventDate');
    if (!dateInput) return;

    // Set minimum date to 7 days from now (large events need more planning time)
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const minDate = today.toISOString().split('T')[0];
    dateInput.min = minDate;
}
