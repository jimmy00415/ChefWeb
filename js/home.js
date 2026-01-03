// Home Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Quick Booking Form Handler
    const quickBookingForm = document.getElementById('quickBookingForm');
    
    if (quickBookingForm) {
        // Set minimum date to tomorrow
        const dateInput = document.getElementById('quickDate');
        if (dateInput) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dateInput.min = tomorrow.toISOString().split('T')[0];
        }
        
        quickBookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const location = document.getElementById('quickLocation').value;
            const date = document.getElementById('quickDate').value;
            const adults = document.getElementById('quickAdults').value;
            const children = document.getElementById('quickChildren').value;
            
            // Validate
            if (!location || !date || !adults) {
                alert('Please fill in all required fields');
                return;
            }
            
            // Store in sessionStorage for booking page
            // Map 'location' to 'serviceState' to match booking.js expectations
            const bookingData = {
                serviceState: location,
                eventDate: date,
                numAdults: parseInt(adults),
                numChildren: parseInt(children) || 0
            };
            
            sessionStorage.setItem('quickBookingData', JSON.stringify(bookingData));
            
            // Redirect to booking page
            window.location.href = 'pages/booking.html';
        });
        
        // Real-time party size validation
        const adultsInput = document.getElementById('quickAdults');
        const childrenInput = document.getElementById('quickChildren');
        
        function validatePartySize() {
            const adults = parseInt(adultsInput.value) || 0;
            const children = parseInt(childrenInput.value) || 0;
            
            // Basic validation: at least 1 adult
            // Minimum spend validation happens in booking funnel Step 2
            if (adults < 1) {
                adultsInput.setCustomValidity('At least 1 adult required');
            } else {
                adultsInput.setCustomValidity('');
            }
        }
        
        if (adultsInput) {
            adultsInput.addEventListener('input', validatePartySize);
        }
        
        if (childrenInput) {
            childrenInput.addEventListener('input', validatePartySize);
        }
    }
    
    // Animate "How It Works" steps on scroll
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    const steps = document.querySelectorAll('.how-it-works__step');
    steps.forEach((step, index) => {
        // Initial state
        step.style.opacity = '0';
        step.style.transform = 'translateY(30px)';
        step.style.transition = `all 0.6s ease ${index * 0.2}s`;
        
        observer.observe(step);
    });
});

// Calculate quick estimate (for display purposes)
function calculateQuickEstimate(adults, children) {
    const adultPrice = 75; // Base price per adult
    const childPrice = 50; // Base price per child
    const minimumSpend = 500;
    
    const subtotal = (adults * adultPrice) + (children * childPrice);
    const total = Math.max(subtotal, minimumSpend);
    
    return {
        adults,
        children,
        adultPrice,
        childPrice,
        subtotal,
        minimumSpend,
        total,
        meetsMinimum: subtotal >= minimumSpend
    };
}
