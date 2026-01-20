// Main JavaScript File

// Modal Stack Manager (prevents body scroll conflicts)
const ModalStack = {
    modals: [],
    push(modalId) {
        if (this.modals.length === 0) {
            document.body.style.overflow = 'hidden';
        }
        this.modals.push(modalId);
    },
    pop(modalId) {
        this.modals = this.modals.filter(id => id !== modalId);
        if (this.modals.length === 0) {
            document.body.style.overflow = '';
        }
    },
    clear() {
        this.modals = [];
        document.body.style.overflow = '';
    }
};

// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menuToggle');
    const mainNav = document.getElementById('mainNav');
    const header = document.getElementById('header');
    
    // Mobile menu toggle
    if (menuToggle && mainNav) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent immediate close from document listener
            const isOpen = mainNav.classList.contains('header__nav--open');
            
            if (isOpen) {
                mainNav.classList.remove('header__nav--open');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            } else {
                mainNav.classList.add('header__nav--open');
                menuToggle.classList.add('active');
                menuToggle.setAttribute('aria-expanded', 'true');
            }
        });
        
        // Close menu when clicking outside (only if menu is open)
        document.addEventListener('click', function(event) {
            const isOpen = mainNav.classList.contains('header__nav--open');
            if (isOpen && !header.contains(event.target)) {
                mainNav.classList.remove('header__nav--open');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Close menu on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && mainNav.classList.contains('header__nav--open')) {
                mainNav.classList.remove('header__nav--open');
                menuToggle.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
            }
        });
    }
    
    // Header scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', function() {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            header.classList.add('header--scrolled');
        } else {
            header.classList.remove('header--scrolled');
        }
        
        lastScroll = currentScroll;
    });
});

// Utility Functions
const Utils = {
    // Format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    },
    
    // Format date
    formatDate(date) {
        return new Intl.DateFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(new Date(date));
    },
    
    // Validate email
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Validate phone
    validatePhone(phone) {
        const re = /^[\d\s\-\+\(\)]{10,}$/;
        return re.test(phone);
    },
    
    // Show/hide element
    toggleElement(element, show) {
        if (show) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    },
    
    // Smooth scroll to element
    scrollToElement(selector, offset = 0) {
        const element = document.querySelector(selector);
        if (element) {
            const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
    },
    
    // Announce to screen readers
    announceToScreenReader(message, priority = 'polite') {
        const regionId = priority === 'assertive' ? 'ariaLiveAssertive' : 'ariaLivePolite';
        const region = document.getElementById(regionId);
        
        if (region) {
            // Clear then set message (ensures announcement triggers)
            region.textContent = '';
            setTimeout(() => {
                region.textContent = message;
            }, 100);
            
            // Clear after announcement
            setTimeout(() => {
                region.textContent = '';
            }, 3000);
        }
    },
    
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Utils };
}
