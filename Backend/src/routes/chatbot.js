/**
 * Chatbot API Routes
 * Handles chat messages with Gemini AI (primary) and pattern matching (fallback)
 * Supports conversation history for contextual responses
 */
import { Router } from 'express';
import { generateResponse, getAvailableIntents, testMessage, getChatbotStatus } from '../services/chatbot.js';
import { chatbotLimiter } from '../middleware/rateLimit.js';
import logger from '../services/logger.js';

const router = Router();

/**
 * POST /api/chatbot/message - Process a chat message
 * Rate limited to 30 messages per 15 minutes per IP
 * 
 * Request body: { 
 *   message: string,
 *   history?: Array<{ role: 'user'|'assistant', content: string }> 
 * }
 * Response: { 
 *   response: string, 
 *   intent: string, 
 *   confidence: number, 
 *   quickReplies: string[],
 *   source: 'gemini'|'pattern'|'validation'
 * }
 */
router.post('/message', chatbotLimiter, async (req, res) => {
    try {
        const { message, history } = req.body || {};
        
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                error: 'Message is required',
                response: "I didn't catch that. Could you please try again?",
                intent: 'error',
                confidence: 0,
                quickReplies: ['View packages', 'Book now', 'Contact us'],
                source: 'validation'
            });
        }
        
        // Limit message length to prevent abuse
        const trimmedMessage = message.trim().substring(0, 1000);
        
        if (!trimmedMessage) {
            return res.json({
                response: "I'm here to help! What would you like to know about our hibachi service?",
                intent: 'empty_message',
                confidence: 0,
                quickReplies: ['View packages', 'Check pricing', 'Book now'],
                source: 'validation'
            });
        }
        
        // Validate and limit conversation history
        let validHistory = [];
        if (Array.isArray(history)) {
            // Keep last 10 messages max to stay within context limits
            validHistory = history
                .filter(msg => 
                    msg && 
                    typeof msg.role === 'string' && 
                    typeof msg.content === 'string' &&
                    (msg.role === 'user' || msg.role === 'assistant')
                )
                .slice(-10)
                .map(msg => ({
                    role: msg.role,
                    content: msg.content.substring(0, 500) // Limit each message
                }));
        }
        
        // Generate response using Gemini (primary) or pattern matching (fallback)
        const result = await generateResponse(trimmedMessage, validHistory);
        
        return res.json(result);
        
    } catch (error) {
        logger.logError(error, { context: 'Chatbot message' });
        return res.status(500).json({ 
            error: 'Failed to process message',
            code: 'CHATBOT_ERROR',
            response: "I'm having a bit of trouble right now. Please try again or contact our team directly at info@pophabachi.com.",
            intent: 'error',
            confidence: 0,
            quickReplies: ['Contact us', 'Try again'],
            source: 'error'
        });
    }
});

/**
 * GET /api/chatbot/status - Chatbot service status and configuration
 */
router.get('/status', (req, res) => {
    try {
        const status = getChatbotStatus();
        return res.json({ 
            ok: true, 
            ...status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.logError(error, { context: 'Chatbot status' });
        return res.status(500).json({ 
            ok: false, 
            error: 'Chatbot service error',
            code: 'STATUS_CHECK_FAILED'
        });
    }
});

/**
 * GET /api/chatbot/intents - List available intents (for debugging/testing)
 * Only available in non-production environments
 */
router.get('/intents', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
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
        const status = getChatbotStatus();
        return res.json({ 
            ok: true, 
            intentsLoaded: intents.length,
            mode: status.mode,
            geminiAvailable: status.geminiAvailable,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logger.logError(error, { context: 'Chatbot health' });
        return res.status(500).json({ 
            ok: false, 
            error: 'Chatbot service error'
        });
    }
});

export default router;
