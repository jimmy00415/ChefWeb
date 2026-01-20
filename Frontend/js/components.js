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

// Chatbot UI (structure + open/close interactions only)
function initChatbotUI() {
    if (document.getElementById('chatbotBubble') || document.getElementById('chatbotWindow')) {
        return;
    }

    const chatbotMarkup = `
        <button class="chatbot-bubble" id="chatbotBubble" aria-label="Open ChefWeb Assistant" aria-expanded="false">
            <span class="chatbot-bubble__icon" aria-hidden="true">💬</span>
            <span class="chatbot-bubble__badge hidden" id="chatbotBadge">1</span>
        </button>
        <section class="chatbot chatbot--hidden" id="chatbotWindow" aria-label="ChefWeb Assistant" role="dialog" aria-modal="false">
            <header class="chatbot__header">
                <div class="chatbot__avatar" aria-hidden="true">🤖</div>
                <div class="chatbot__header-text">
                    <p class="chatbot__title">ChefWeb Assistant</p>
                    <p class="chatbot__status">Online</p>
                </div>
                <button class="chatbot__close" id="chatbotClose" aria-label="Close chat">×</button>
            </header>
            <div class="chatbot__messages" aria-live="polite">
                <div class="chatbot__message chatbot__message--bot">
                    <div class="chatbot__bubble">
                        Hi! 👋 I'm the ChefWeb Assistant. Ask me about pricing, packages, or booking.
                    </div>
                </div>
            </div>
            <div class="chatbot__quick-replies">
                <button class="chatbot__quick-reply" type="button">How much does it cost?</button>
                <button class="chatbot__quick-reply" type="button">What areas do you serve?</button>
                <button class="chatbot__quick-reply" type="button">Tell me about packages</button>
            </div>
            <form class="chatbot__input" aria-label="Chat input">
                <label class="sr-only" for="chatbotInput">Type your message</label>
                <textarea id="chatbotInput" class="chatbot__textarea" rows="1" placeholder="Ask about booking..."></textarea>
                <button class="chatbot__send" type="submit" aria-label="Send message">
                    ➤
                </button>
            </form>
        </section>
    `;

    document.body.insertAdjacentHTML('beforeend', chatbotMarkup);

    const bubble = document.getElementById('chatbotBubble');
    const windowEl = document.getElementById('chatbotWindow');
    const closeBtn = document.getElementById('chatbotClose');
    const input = document.getElementById('chatbotInput');
    let lastFocused = null;

    const openChat = () => {
        lastFocused = document.activeElement;
        windowEl.classList.remove('chatbot--hidden');
        bubble.classList.add('hidden');
        bubble.setAttribute('aria-expanded', 'true');
        input.focus();
    };

    const closeChat = () => {
        windowEl.classList.add('chatbot--hidden');
        bubble.classList.remove('hidden');
        bubble.setAttribute('aria-expanded', 'false');
        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
    };

    bubble.addEventListener('click', openChat);
    closeBtn.addEventListener('click', closeChat);

    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !windowEl.classList.contains('chatbot--hidden')) {
            closeChat();
        }
    });

    // Prevent form submission for now (logic added in next step)
    windowEl.querySelector('.chatbot__input').addEventListener('submit', (event) => {
        event.preventDefault();
    });

    initChatbotLogic({
        windowEl,
        bubble,
        input
    });
}

function initChatbotLogic({ windowEl, bubble, input }) {
    const messagesContainer = windowEl.querySelector('.chatbot__messages');
    const quickRepliesContainer = windowEl.querySelector('.chatbot__quick-replies');
    const form = windowEl.querySelector('.chatbot__input');
    const badge = document.getElementById('chatbotBadge');
    const conversationKey = 'chefweb_chat_history';

    const quickReplies = [
        'How much does it cost?',
        'What areas do you serve?',
        'Tell me about packages'
    ];

    const cannedResponses = [
        {
            keywords: ['price', 'cost', 'pricing', 'how much'],
            reply: 'Our packages start at $65 per person (Essential), $75 (Signature), and $95 (Premium). Minimum spend is $500.'
        },
        {
            keywords: ['area', 'serve', 'location', 'state'],
            reply: 'We currently serve CA, NY, TX, FL, IL, PA, OH, GA, NC, and MI. Ask about your city and we’ll confirm availability.'
        },
        {
            keywords: ['package', 'packages', 'menu', 'options'],
            reply: 'We offer Essential, Signature, and Premium packages. Signature is most popular for full hibachi experience.'
        },
        {
            keywords: ['book', 'booking', 'reserve', 'date'],
            reply: 'You can start a booking anytime on the Booking page. I can also help prefill details if you tell me your date and party size.'
        }
    ];

    const renderMessage = (text, sender = 'bot') => {
        const message = document.createElement('div');
        message.className = `chatbot__message chatbot__message--${sender}`;
        message.innerHTML = `<div class="chatbot__bubble">${escapeHtml(text)}</div>`;
        messagesContainer.appendChild(message);
        scrollToBottom();
    };

    const showTyping = () => {
        const typing = document.createElement('div');
        typing.className = 'chatbot__message chatbot__message--bot';
        typing.setAttribute('data-typing', 'true');
        typing.innerHTML = '<div class="chatbot__bubble">Typing…</div>';
        messagesContainer.appendChild(typing);
        scrollToBottom();
    };

    const hideTyping = () => {
        const typing = messagesContainer.querySelector('[data-typing="true"]');
        if (typing) typing.remove();
    };

    const setBadge = (count) => {
        if (!badge) return;
        if (count > 0) {
            badge.textContent = count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    };

    const saveHistory = () => {
        const messages = [...messagesContainer.querySelectorAll('.chatbot__bubble')].map(node => node.textContent);
        sessionStorage.setItem(conversationKey, JSON.stringify(messages));
    };

    const restoreHistory = () => {
        const saved = sessionStorage.getItem(conversationKey);
        if (!saved) return;
        const messages = JSON.parse(saved);
        messagesContainer.innerHTML = '';
        messages.forEach((text, index) => {
            renderMessage(text, index === 0 ? 'bot' : index % 2 ? 'user' : 'bot');
        });
    };

    const renderQuickReplies = () => {
        quickRepliesContainer.innerHTML = '';
        quickReplies.forEach(label => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'chatbot__quick-reply';
            btn.textContent = label;
            btn.addEventListener('click', () => sendMessage(label));
            quickRepliesContainer.appendChild(btn);
        });
    };

    const findCannedResponse = (text) => {
        const lower = text.toLowerCase();
        const match = cannedResponses.find(entry => entry.keywords.some(word => lower.includes(word)));
        return match ? match.reply : null;
    };

    const sendMessage = async (text) => {
        if (!text.trim()) return;
        renderMessage(text, 'user');
        input.value = '';
        showTyping();

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 6000);
            const response = await fetch('/api/chatbot/message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, page: window.location.pathname }),
                signal: controller.signal
            });
            clearTimeout(timeout);

            if (!response.ok) {
                throw new Error('Chat API unavailable');
            }

            const data = await response.json();
            hideTyping();
            renderMessage(data.response || 'Thanks! Let me know if you’d like to start a booking.');
        } catch (error) {
            hideTyping();
            const fallback = findCannedResponse(text) || 'I can help with pricing, packages, and booking details. What would you like to know?';
            renderMessage(fallback);
        }

        saveHistory();
    };

    const scrollToBottom = () => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    };

    const escapeHtml = (value) => {
        const div = document.createElement('div');
        div.textContent = value;
        return div.innerHTML;
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        sendMessage(input.value);
    });

    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    });

    bubble.addEventListener('click', () => {
        setBadge(0);
    });

    renderQuickReplies();
    restoreHistory();
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

    // Initialize chatbot UI
    initChatbotUI();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Accordion, Modal, Lightbox };
}
