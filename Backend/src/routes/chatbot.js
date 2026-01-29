/**
 * Chatbot API Routes
 * Handles chat messages with intelligent intent classification
 * and contextual responses for the POP Habachi assistant
 */
import { Router } from 'express';
import { generateResponse, getAvailableIntents, testMessage } from '../services/chatbot.js';
import { chatbotLimiter } from '../middleware/rateLimit.js';
import logger from '../services/logger.js';

const router = Router();

/**
 * POST /api/chatbot/message - Process a chat message
 * Rate limited to 30 messages per 15 minutes per IP
 * 
 * Request body: { message: string }
 * Response: { response: string, intent: string, confidence: number, quickReplies: string[] }
 */
router.post('/message', chatbotLimiter, (req, res) => {
    try {
        const message = req.body?.message;
        
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                error: 'Message is required',
                response: "I didn't catch that. Could you please try again?",
                intent: 'error',
                confidence: 0,
                quickReplies: ['View packages', 'Book now', 'Contact us']
            });
        }
        
        // Limit message length to prevent abuse
        const trimmedMessage = message.trim().substring(0, 500);
        
        if (!trimmedMessage) {
            return res.json({
                response: "I'm here to help! What would you like to know about our hibachi service?",
                intent: 'empty_message',
                confidence: 0,
                quickReplies: ['View packages', 'Check pricing', 'Book now']
            });
        }
        
        // Generate response using NLP service
        const result = generateResponse(trimmedMessage);
        
        return res.json(result);
        
    } catch (error) {
        console.error('Chatbot message error:', error);
        return res.status(500).json({ 
            error: 'Failed to process message',
            response: "I'm having a bit of trouble right now. Please try again or contact our team directly.",
            intent: 'error',
            confidence: 0,
            quickReplies: ['Contact us', 'Try again']
        });
    }
});

/**
 * GET /api/chatbot/intents - List available intents (for debugging/testing)
 * Only available in non-production environments
 */
router.get('/intents', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found' });
    }
    
    const intents = getAvailableIntents();
    return res.json({ intents, count: intents.length });
});

/**
 * POST /api/chatbot/test - Test message against all intents (for debugging)
 * Only available in non-production environments
 */
router.post('/test', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found' });
    }
    
    const message = req.body?.message;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }
    
    const results = testMessage(message);
    return res.json({ 
        message, 
        results: results.slice(0, 5) // Top 5 matches
    });
});

/**
 * GET /api/chatbot/health - Chatbot service health check
 */
router.get('/health', (req, res) => {
    try {
        const intents = getAvailableIntents();
        return res.json({ 
            ok: true, 
            intentsLoaded: intents.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        return res.status(500).json({ 
            ok: false, 
            error: 'Chatbot service error'
        });
    }
});

export default router;
