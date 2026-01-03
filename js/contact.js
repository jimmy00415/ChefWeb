/**
 * Contact Page Logic
 * - Form validation and submission
 * - Reason-based form helpers
 */

document.addEventListener('DOMContentLoaded', () => {
    initContactForm();
});

function initContactForm() {
    const form = document.getElementById('contactForm');
    const reasonSelect = document.getElementById('contactReason');
    const subjectInput = document.getElementById('contactSubject');
    
    if (!form) return;

    // Auto-populate subject based on reason
    if (reasonSelect && subjectInput) {
        reasonSelect.addEventListener('change', (e) => {
            const reason = e.target.value;
            const subjectSuggestions = {
                'booking': 'Question about booking a chef',
                'existing': 'Changes to my existing booking',
                'pricing': 'Question about pricing',
                'dietary': 'Dietary restrictions inquiry',
                'large-event': 'Large event quote request (50+ guests)',
                'feedback': 'Feedback about my experience',
                'other': ''
            };
            
            if (reason && !subjectInput.value) {
                subjectInput.value = subjectSuggestions[reason] || '';
            }
        });
    }

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validate consent
        const consent = document.getElementById('contactConsent');
        if (consent && !consent.checked) {
            alert('Please agree to receive follow-up communication');
            return;
        }

        // Get form data
        const formData = {
            name: document.getElementById('contactName')?.value,
            email: document.getElementById('contactEmail')?.value,
            phone: document.getElementById('contactPhone')?.value,
            reason: document.getElementById('contactReason')?.value,
            subject: document.getElementById('contactSubject')?.value,
            message: document.getElementById('contactMessage')?.value,
            consent: consent?.checked,
            timestamp: new Date().toISOString()
        };

        // In production, this would submit to backend
        console.log('Contact form submission:', formData);

        // Show success message
        alert('Thank you for contacting us! We\'ll respond within 2 hours during business hours.');
        
        // Reset form
        form.reset();
    });
}
