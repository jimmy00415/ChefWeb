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
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate consent
        const consent = document.getElementById('contactConsent');
        if (consent && !consent.checked) {
            alert('Please agree to receive follow-up communication');
            return;
        }

        // Get form data
        const formData = {
            name: document.getElementById('contactName')?.value?.trim(),
            email: document.getElementById('contactEmail')?.value?.trim(),
            phone: document.getElementById('contactPhone')?.value?.trim(),
            reason: document.getElementById('contactReason')?.value,
            subject: document.getElementById('contactSubject')?.value?.trim(),
            message: document.getElementById('contactMessage')?.value?.trim()
        };

        // Basic validation
        if (!formData.name || !formData.email || !formData.message) {
            alert('Please fill in all required fields (name, email, and message)');
            return;
        }

        // Email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Disable submit button to prevent double submission
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }

        try {
            // Submit to backend API
            const response = await window.apiRequest('/api/contact', {
                method: 'POST',
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                // Show success message
                alert('Thank you for contacting us! We\'ll respond within 2 hours during business hours.');
                form.reset();
            } else {
                // Show error
                alert(result.error || 'Failed to submit. Please try again or call us directly.');
            }
        } catch (error) {
            console.error('Contact form error:', error);
            alert('Unable to connect to server. Please try again later or call us at (555) 123-4567.');
        } finally {
            // Re-enable submit button
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        }
    });
}
