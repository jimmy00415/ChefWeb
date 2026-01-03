// Accordion Component JavaScript

class Accordion {
    constructor(element) {
        this.accordion = element;
        this.items = this.accordion.querySelectorAll('.accordion__item');
        this.init();
        this.initResizeHandler();
    }

    init() {
        this.items.forEach((item, index) => {
            const header = item.querySelector('.accordion__header, .accordion-header');
            const content = item.querySelector('.accordion__content, .accordion-content');
            
            header.addEventListener('click', () => this.toggle(item));
            
            // Initialize ARIA attributes
            const isOpen = header.classList.contains('accordion__header--active') || header.classList.contains('accordion-header--active');
            header.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            content.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
            
            // Set initial state
            if (isOpen) {
                content.style.maxHeight = content.scrollHeight + 'px';
            }
        });
    }
    
    initResizeHandler() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.recalculateHeights();
            }, 150);
        });
    }
    
    recalculateHeights() {
        this.items.forEach(item => {
            const header = item.querySelector('.accordion__header, .accordion-header');
            const content = item.querySelector('.accordion__content, .accordion-content');
            
            const isActive = header.classList.contains('accordion__header--active') || header.classList.contains('accordion-header--active');
            if (isActive) {
                // Temporarily remove maxHeight to get true scrollHeight
                const currentMaxHeight = content.style.maxHeight;
                content.style.maxHeight = 'none';
                const newHeight = content.scrollHeight;
                content.style.maxHeight = currentMaxHeight;
                
                // Animate to new height
                content.style.maxHeight = newHeight + 'px';
            }
        });
    }

    toggle(item) {
        const header = item.querySelector('.accordion__header, .accordion-header');
        const content = item.querySelector('.accordion__content, .accordion-content');
        const icon = header.querySelector('.accordion__icon, .accordion-icon');
        const isActive = header.classList.contains('accordion__header--active') || header.classList.contains('accordion-header--active');

        if (isActive) {
            // Close
            header.classList.remove('accordion__header--active', 'accordion-header--active');
            content.classList.remove('accordion__content--active', 'accordion-content--active');
            if (icon) icon.classList.remove('accordion__icon--active', 'accordion-icon--active');
            content.style.maxHeight = '0';
            
            // Update ARIA
            header.setAttribute('aria-expanded', 'false');
            content.setAttribute('aria-hidden', 'true');
        } else {
            // Open
            header.classList.add('accordion__header--active', 'accordion-header--active');
            content.classList.add('accordion__content--active', 'accordion-content--active');
            if (icon) icon.classList.add('accordion__icon--active', 'accordion-icon--active');
            content.style.maxHeight = content.scrollHeight + 'px';
            
            // Update ARIA
            header.setAttribute('aria-expanded', 'true');
            content.setAttribute('aria-hidden', 'false');
        }
    }

    openAll() {
        this.items.forEach(item => {
            const header = item.querySelector('.accordion__header');
            if (!header.classList.contains('accordion__header--active')) {
                this.toggle(item);
            }
        });
    }

    closeAll() {
        this.items.forEach(item => {
            const header = item.querySelector('.accordion__header');
            if (header.classList.contains('accordion__header--active')) {
                this.toggle(item);
            }
        });
    }
}

// Modal Component JavaScript

class Modal {
    constructor(element) {
        this.modal = element;
        this.closeBtn = this.modal.querySelector('.modal__close');
        this.modalId = element.id || 'modal_' + Math.random().toString(36).substr(2, 9);
        this.triggerElement = null; // Store element that opened modal
        this.keydownHandler = null; // Store handler reference for cleanup
        this.init();
    }

    init() {
        // Close on X button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }

        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });

        // Create keydown handler (will be added/removed dynamically)
        this.keydownHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        };
    }

    open() {
        this.triggerElement = document.activeElement; // Store focus
        this.modal.classList.add('modal--active');
        
        // Use modal stack manager
        if (typeof ModalStack !== 'undefined') {
            ModalStack.push(this.modalId);
        } else {
            document.body.style.overflow = 'hidden';
        }
        
        // Add keydown listener only when open
        document.addEventListener('keydown', this.keydownHandler);
        
        // Focus first focusable element in modal
        this.setInitialFocus();
    }

    close() {
        this.modal.classList.remove('modal--active');
        
        // Use modal stack manager
        if (typeof ModalStack !== 'undefined') {
            ModalStack.pop(this.modalId);
        } else {
            document.body.style.overflow = '';
        }
        
        // Remove keydown listener
        document.removeEventListener('keydown', this.keydownHandler);
        
        // Return focus to trigger element
        if (this.triggerElement && typeof this.triggerElement.focus === 'function') {
            this.triggerElement.focus();
        }
    }

    isOpen() {
        return this.modal.classList.contains('modal--active');
    }
    
    setInitialFocus() {
        // Focus first input or button in modal
        const focusable = this.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length > 0) {
            focusable[0].focus();
        }
    }
}

// Lightbox Component JavaScript

class Lightbox {
    constructor() {
        this.lightboxId = 'lightbox_component';
        this.triggerElement = null;
        this.keydownHandler = null;
        this.createLightbox();
        this.initTriggers();
    }

    createLightbox() {
        if (document.querySelector('.lightbox')) return;

        const lightbox = document.createElement('div');
        lightbox.className = 'lightbox';
        lightbox.innerHTML = `
            <button class="lightbox__close" aria-label="Close lightbox">&times;</button>
            <img class="lightbox__image" src="" alt="">
        `;
        document.body.appendChild(lightbox);

        this.lightbox = lightbox;
        this.image = lightbox.querySelector('.lightbox__image');
        this.closeBtn = lightbox.querySelector('.lightbox__close');

        this.closeBtn.addEventListener('click', () => this.close());
        this.lightbox.addEventListener('click', (e) => {
            if (e.target === this.lightbox) {
                this.close();
            }
        });

        // Create keydown handler for cleanup
        this.keydownHandler = (e) => {
            if (e.key === 'Escape' && this.isOpen()) {
                this.close();
            }
        };
    }

    initTriggers() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('lightbox-trigger')) {
                e.preventDefault();
                const src = e.target.getAttribute('href') || e.target.src;
                this.open(src);
            }
        });
    }

    open(src) {
        this.triggerElement = document.activeElement;
        this.image.src = src;
        this.lightbox.classList.add('lightbox--active');
        
        // Use modal stack manager
        if (typeof ModalStack !== 'undefined') {
            ModalStack.push(this.lightboxId);
        } else {
            document.body.style.overflow = 'hidden';
        }
        
        // Add keydown listener only when open
        document.addEventListener('keydown', this.keydownHandler);
    }

    close() {
        this.lightbox.classList.remove('lightbox--active');
        
        // Use modal stack manager
        if (typeof ModalStack !== 'undefined') {
            ModalStack.pop(this.lightboxId);
        } else {
            document.body.style.overflow = '';
        }
        
        // Remove keydown listener
        document.removeEventListener('keydown', this.keydownHandler);
        
        setTimeout(() => {
            this.image.src = '';
        }, 300);
        
        // Return focus
        if (this.triggerElement && typeof this.triggerElement.focus === 'function') {
            this.triggerElement.focus();
        }
    }

    isOpen() {
        return this.lightbox.classList.contains('lightbox--active');
    }
}

// Review Card "Read More" functionality

function initReviewCards() {
    const reviewCards = document.querySelectorAll('.review-card');
    
    reviewCards.forEach(card => {
        const content = card.querySelector('.review-card__content');
        const readMoreBtn = card.querySelector('.review-card__read-more');
        
        if (!content || !readMoreBtn) return;
        
        // Check if content is truncated
        if (content.scrollHeight <= content.clientHeight) {
            readMoreBtn.style.display = 'none';
        }
        
        readMoreBtn.addEventListener('click', () => {
            const isCollapsed = content.classList.contains('review-card__content--collapsed');
            
            if (isCollapsed) {
                content.classList.remove('review-card__content--collapsed');
                readMoreBtn.textContent = 'Read less';
            } else {
                content.classList.add('review-card__content--collapsed');
                readMoreBtn.textContent = 'Read more';
            }
        });
    });
}

// Chip component with quantity controls

function initChips() {
    const chips = document.querySelectorAll('.chip');
    
    chips.forEach(chip => {
        const qtyDisplay = chip.querySelector('.chip__qty-display');
        const decreaseBtn = chip.querySelector('.chip__qty-btn--decrease');
        const increaseBtn = chip.querySelector('.chip__qty-btn--increase');
        
        if (!qtyDisplay) return;
        
        let quantity = parseInt(qtyDisplay.textContent) || 0;
        
        // Toggle selection on chip click (but not on quantity buttons)
        chip.addEventListener('click', (e) => {
            if (!e.target.closest('.chip__qty-btn')) {
                if (quantity === 0) {
                    quantity = 1;
                    updateChip();
                }
            }
        });
        
        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (quantity > 0) {
                    quantity--;
                    updateChip();
                }
            });
        }
        
        if (increaseBtn) {
            increaseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                quantity++;
                updateChip();
            });
        }
        
        function updateChip() {
            qtyDisplay.textContent = quantity;
            
            if (quantity > 0) {
                chip.classList.add('chip--selected');
            } else {
                chip.classList.remove('chip--selected');
            }
            
            // Trigger custom event for price calculation
            chip.dispatchEvent(new CustomEvent('quantity-change', {
                detail: { quantity },
                bubbles: true
            }));
        }
    });
}

// Initialize all components on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize accordions
    document.querySelectorAll('.accordion').forEach(el => new Accordion(el));
    
    // Initialize modals
    document.querySelectorAll('.modal').forEach(el => new Modal(el));
    
    // Initialize lightbox
    new Lightbox();
    
    // Initialize review cards
    initReviewCards();
    
    // Initialize chips
    initChips();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Accordion, Modal, Lightbox };
}
