/**
 * POP Habachi Chatbot Widget
 * Interactive AI-powered chat assistant for customer support
 * 
 * Features:
 * - Floating toggle button with notification badge
 * - Smooth animations and transitions
 * - Quick reply buttons
 * - Typing indicators
 * - Message history
 * - Mobile responsive
 * - Keyboard accessibility
 */

(function() {
    'use strict';

    // ==========================================================================
    // CONFIGURATION
    // ==========================================================================
    const CONFIG = {
        welcomeMessage: "Hi there! 👋 I'm your POP Habachi assistant. I can help with packages, pricing, booking, dietary questions, and more. What would you like to know?",
        welcomeQuickReplies: ['View packages', 'Check pricing', 'How to book', 'Service areas'],
        typingDelay: 500, // ms to show typing indicator
        storageKey: 'pophabachi_chat_history',
        maxMessages: 50, // Keep only last N messages in storage
    };

    // ==========================================================================
    // STATE
    // ==========================================================================
    let chatState = {
        isOpen: false,
        isTyping: false,
        messages: [],
        unreadCount: 0
    };

    // ==========================================================================
    // HTML TEMPLATES
    // ==========================================================================
    function createChatHTML() {
        return `
            <!-- Chat Toggle Button -->
            <button class="chat-toggle" id="chatToggle" aria-label="Open chat" aria-expanded="false">
                <span class="chat-toggle__icon chat-toggle__icon--chat">💬</span>
                <span class="chat-toggle__icon chat-toggle__icon--close">✕</span>
            </button>

            <!-- Chat Window -->
            <div class="chat-window" id="chatWindow" role="dialog" aria-labelledby="chatTitle" aria-hidden="true">
                <!-- Header -->
                <div class="chat-header">
                    <div class="chat-header__avatar">🍳</div>
                    <div class="chat-header__info">
                        <h2 class="chat-header__title" id="chatTitle">POP Habachi Assistant</h2>
                        <div class="chat-header__status">Online • Here to help</div>
                    </div>
                    <button class="chat-header__close" id="chatClose" aria-label="Close chat">✕</button>
                </div>

                <!-- Messages Container -->
                <div class="chat-messages" id="chatMessages" role="log" aria-live="polite">
                    <!-- Messages will be inserted here -->
                </div>

                <!-- Input Area -->
                <div class="chat-input">
                    <input 
                        type="text" 
                        class="chat-input__field" 
                        id="chatInput" 
                        placeholder="Type your message..." 
                        aria-label="Chat message"
                        autocomplete="off"
                    >
                    <button class="chat-input__send" id="chatSend" aria-label="Send message">➤</button>
                </div>
            </div>
        `;
    }

    // ==========================================================================
    // MESSAGE RENDERING
    // ==========================================================================
    function formatMessage(text) {
        // Convert **bold** to <strong>
        text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        
        // Convert line breaks to <br>
        text = text.replace(/\n/g, '<br>');
        
        // Convert bullet points
        text = text.replace(/^• /gm, '&bull; ');
        
        return text;
    }

    function formatTime(date) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    function createMessageElement(message) {
        const div = document.createElement('div');
        div.className = `chat-message chat-message--${message.type}`;
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-message__bubble';
        bubble.innerHTML = formatMessage(message.text);
        
        const time = document.createElement('div');
        time.className = 'chat-message__time';
        time.textContent = formatTime(new Date(message.timestamp));
        
        div.appendChild(bubble);
        div.appendChild(time);
        
        // Add quick replies if present (only for last bot message)
        if (message.type === 'bot' && message.quickReplies && message.quickReplies.length > 0) {
            const quickRepliesContainer = document.createElement('div');
            quickRepliesContainer.className = 'chat-quick-replies';
            
            message.quickReplies.forEach(reply => {
                const btn = document.createElement('button');
                btn.className = 'chat-quick-reply';
                btn.textContent = reply;
                btn.addEventListener('click', () => handleQuickReply(reply));
                quickRepliesContainer.appendChild(btn);
            });
            
            div.appendChild(quickRepliesContainer);
        }
        
        return div;
    }

    function createTypingIndicator() {
        const div = document.createElement('div');
        div.className = 'chat-message chat-message--bot chat-message--typing';
        div.id = 'typingIndicator';
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-message__bubble';
        
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        
        bubble.appendChild(indicator);
        div.appendChild(bubble);
        
        return div;
    }

    // ==========================================================================
    // CHAT OPERATIONS
    // ==========================================================================
    function addMessage(text, type, quickReplies = []) {
        const message = {
            text,
            type,
            quickReplies: type === 'bot' ? quickReplies : [],
            timestamp: Date.now()
        };
        
        chatState.messages.push(message);
        
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        // Remove previous quick replies (only show on last bot message)
        const previousReplies = messagesContainer.querySelectorAll('.chat-quick-replies');
        previousReplies.forEach(el => el.remove());
        
        const messageEl = createMessageElement(message);
        messagesContainer.appendChild(messageEl);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Save to storage
        saveMessages();
        
        // Update unread count if chat is closed
        if (!chatState.isOpen && type === 'bot') {
            chatState.unreadCount++;
            updateUnreadBadge();
        }
    }

    function showTyping() {
        chatState.isTyping = true;
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        const typingEl = createTypingIndicator();
        messagesContainer.appendChild(typingEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTyping() {
        chatState.isTyping = false;
        const typingEl = document.getElementById('typingIndicator');
        if (typingEl) {
            typingEl.remove();
        }
    }

    async function sendMessage(text) {
        if (!text || !text.trim()) return;
        
        const trimmedText = text.trim();
        
        // Add user message
        addMessage(trimmedText, 'user');
        
        // Clear input
        const input = document.getElementById('chatInput');
        if (input) input.value = '';
        
        // Show typing indicator
        showTyping();
        
        try {
            // Send to backend
            const response = await window.apiRequest('/api/chatbot/message', {
                method: 'POST',
                body: JSON.stringify({ message: trimmedText })
            });
            
            // Hide typing with delay for natural feel
            await new Promise(resolve => setTimeout(resolve, CONFIG.typingDelay));
            hideTyping();
            
            if (response.ok) {
                const data = await response.json();
                addMessage(data.response, 'bot', data.quickReplies || []);
            } else if (response.status === 429) {
                addMessage("I'm getting a lot of messages right now. Please wait a moment before sending more. 🙏", 'bot');
            } else {
                throw new Error('API error');
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            hideTyping();
            addMessage("Oops! Something went wrong. Please try again or contact us directly.", 'bot', ['Contact us', 'Try again']);
        }
    }

    function handleQuickReply(text) {
        sendMessage(text);
    }

    // ==========================================================================
    // UI OPERATIONS
    // ==========================================================================
    function openChat() {
        chatState.isOpen = true;
        chatState.unreadCount = 0;
        updateUnreadBadge();
        
        const toggle = document.getElementById('chatToggle');
        const window = document.getElementById('chatWindow');
        const input = document.getElementById('chatInput');
        
        if (toggle) {
            toggle.classList.add('active');
            toggle.setAttribute('aria-expanded', 'true');
        }
        
        if (window) {
            window.classList.add('open');
            window.setAttribute('aria-hidden', 'false');
        }
        
        // Focus input after animation
        setTimeout(() => {
            if (input) input.focus();
        }, 300);
        
        // Show welcome message if first time
        if (chatState.messages.length === 0) {
            showWelcomeMessage();
        }
    }

    function closeChat() {
        chatState.isOpen = false;
        
        const toggle = document.getElementById('chatToggle');
        const window = document.getElementById('chatWindow');
        
        if (toggle) {
            toggle.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
        }
        
        if (window) {
            window.classList.remove('open');
            window.setAttribute('aria-hidden', 'true');
        }
    }

    function toggleChat() {
        if (chatState.isOpen) {
            closeChat();
        } else {
            openChat();
        }
    }

    function updateUnreadBadge() {
        const toggle = document.getElementById('chatToggle');
        if (!toggle) return;
        
        // Remove existing badge
        const existingBadge = toggle.querySelector('.chat-toggle__badge');
        if (existingBadge) existingBadge.remove();
        
        // Add badge if unread messages
        if (chatState.unreadCount > 0 && !chatState.isOpen) {
            const badge = document.createElement('span');
            badge.className = 'chat-toggle__badge';
            badge.textContent = chatState.unreadCount > 9 ? '9+' : chatState.unreadCount;
            toggle.appendChild(badge);
        }
    }

    function showWelcomeMessage() {
        addMessage(CONFIG.welcomeMessage, 'bot', CONFIG.welcomeQuickReplies);
    }

    // ==========================================================================
    // STORAGE
    // ==========================================================================
    function saveMessages() {
        try {
            // Keep only last N messages
            const messagesToSave = chatState.messages.slice(-CONFIG.maxMessages);
            localStorage.setItem(CONFIG.storageKey, JSON.stringify(messagesToSave));
        } catch (error) {
            console.warn('Could not save chat history:', error);
        }
    }

    function loadMessages() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKey);
            if (saved) {
                chatState.messages = JSON.parse(saved);
                
                const messagesContainer = document.getElementById('chatMessages');
                if (messagesContainer) {
                    // Clear any existing messages
                    messagesContainer.innerHTML = '';
                    
                    // Render saved messages (without quick replies except last)
                    chatState.messages.forEach((msg, index) => {
                        const isLast = index === chatState.messages.length - 1;
                        const msgCopy = { ...msg };
                        if (!isLast) msgCopy.quickReplies = [];
                        
                        const messageEl = createMessageElement(msgCopy);
                        messagesContainer.appendChild(messageEl);
                    });
                    
                    // Scroll to bottom
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }
        } catch (error) {
            console.warn('Could not load chat history:', error);
            chatState.messages = [];
        }
    }

    function clearHistory() {
        chatState.messages = [];
        localStorage.removeItem(CONFIG.storageKey);
        
        const messagesContainer = document.getElementById('chatMessages');
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
        }
        
        showWelcomeMessage();
    }

    // ==========================================================================
    // EVENT HANDLERS
    // ==========================================================================
    function setupEventListeners() {
        // Toggle button
        const toggleBtn = document.getElementById('chatToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', toggleChat);
        }
        
        // Close button
        const closeBtn = document.getElementById('chatClose');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeChat);
        }
        
        // Send button
        const sendBtn = document.getElementById('chatSend');
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const input = document.getElementById('chatInput');
                if (input) sendMessage(input.value);
            });
        }
        
        // Input field
        const input = document.getElementById('chatInput');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(input.value);
                }
            });
        }
        
        // Close on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && chatState.isOpen) {
                closeChat();
            }
        });
        
        // Close on outside click (optional - can be annoying)
        // document.addEventListener('click', (e) => {
        //     if (chatState.isOpen && !e.target.closest('.chat-window') && !e.target.closest('.chat-toggle')) {
        //         closeChat();
        //     }
        // });
    }

    // ==========================================================================
    // INITIALIZATION
    // ==========================================================================
    function init() {
        // Check if already initialized
        if (document.getElementById('chatToggle')) return;
        
        // Create container
        const container = document.createElement('div');
        container.id = 'chatbotWidget';
        container.innerHTML = createChatHTML();
        document.body.appendChild(container);
        
        // Setup event listeners
        setupEventListeners();
        
        // Load saved messages
        loadMessages();
        
        // Expose API for external use
        window.ChatbotWidget = {
            open: openChat,
            close: closeChat,
            toggle: toggleChat,
            send: sendMessage,
            clearHistory: clearHistory
        };
        
        console.log('[Chatbot] Widget initialized');
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
