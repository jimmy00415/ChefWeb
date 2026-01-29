/**
 * Chatbot Service - Gemini AI + Pattern Matching Fallback
 * 
 * This service provides intelligent chat responses using:
 * 1. Primary: Gemini 2.0 Flash via Vertex AI (when available)
 * 2. Fallback: Pattern matching with predefined responses (when Gemini unavailable)
 * 
 * The fallback ensures the chatbot always works, even if:
 * - Gemini quota is exceeded
 * - API is temporarily unavailable
 * - Running in local development without GCP credentials
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { 
    generateGeminiResponse, 
    isGeminiAvailable, 
    extractQuickReplies,
    getGeminiConfig 
} from './gemini.js';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// PATTERN MATCHING FALLBACK
// ============================================

let responseData = null;

/**
 * Load chatbot responses from JSON file (for fallback mode)
 * Cached in memory for performance
 */
function loadResponses() {
    if (!responseData) {
        try {
            const dataPath = join(__dirname, '..', 'data', 'chatbot-responses.json');
            const rawData = readFileSync(dataPath, 'utf8');
            responseData = JSON.parse(rawData);
        } catch (error) {
            logger.logError(error, { context: 'Load chatbot responses' });
            responseData = { 
                intents: {}, 
                fallback: { 
                    responses: ['I apologize, but I encountered an error. Please try again or contact us at info@pophabachi.com.'],
                    quickReplies: ['Contact us', 'Book now']
                } 
            };
        }
    }
    return responseData;
}

/**
 * Preprocess user message for intent matching
 */
function preprocessMessage(message) {
    if (!message || typeof message !== 'string') return '';
    
    let normalized = message.toLowerCase().trim();
    
    // Expand common contractions
    const contractions = {
        "what's": "what is", "where's": "where is", "how's": "how is",
        "i'm": "i am", "you're": "you are", "it's": "it is",
        "don't": "do not", "doesn't": "does not", "can't": "cannot",
        "won't": "will not", "i'd": "i would", "i'll": "i will",
        "i've": "i have", "we'll": "we will", "they'll": "they will"
    };
    
    for (const [contraction, expansion] of Object.entries(contractions)) {
        normalized = normalized.replace(new RegExp(contraction, 'gi'), expansion);
    }
    
    // Remove special characters but keep spaces
    normalized = normalized.replace(/[^a-z0-9\s?!.,]/g, ' ');
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
}

/**
 * Calculate match score between message and intent patterns
 */
function calculateMatchScore(message, patterns) {
    if (!message || !patterns || !patterns.length) return 0;
    
    const messageWords = new Set(message.split(' ').filter(w => w.length > 1));
    let maxScore = 0;
    
    for (const pattern of patterns) {
        let score = 0;
        const patternLower = pattern.toLowerCase();
        
        // Exact substring match (highest confidence)
        if (message.includes(patternLower)) {
            const lengthRatio = patternLower.length / message.length;
            score = Math.max(score, 0.6 + (lengthRatio * 0.4));
        }
        
        // Word-level match
        const patternWords = patternLower.split(' ').filter(w => w.length > 1);
        let matchedWords = 0;
        for (const word of patternWords) {
            if (messageWords.has(word) || message.includes(word)) {
                matchedWords++;
            }
        }
        
        if (patternWords.length > 0) {
            const wordMatchRatio = matchedWords / patternWords.length;
            score = Math.max(score, wordMatchRatio * 0.8);
        }
        
        maxScore = Math.max(maxScore, score);
    }
    
    return maxScore;
}

/**
 * Detect intent from user message using pattern matching
 */
function detectIntent(message) {
    const data = loadResponses();
    const normalized = preprocessMessage(message);
    
    if (!normalized) {
        return { intent: 'fallback', confidence: 0, matchedPattern: null };
    }
    
    let bestIntent = 'fallback';
    let bestScore = 0;
    let matchedPattern = null;
    
    for (const [intentName, intentData] of Object.entries(data.intents)) {
        if (!intentData.patterns) continue;
        
        const score = calculateMatchScore(normalized, intentData.patterns);
        
        if (score > bestScore) {
            bestScore = score;
            bestIntent = intentName;
            matchedPattern = intentData.patterns.find(p => 
                normalized.includes(p.toLowerCase()) || 
                p.toLowerCase().split(' ').some(w => normalized.includes(w))
            );
        }
    }
    
    // Apply confidence threshold
    const confidenceThreshold = 0.3;
    if (bestScore < confidenceThreshold) {
        return { intent: 'fallback', confidence: bestScore, matchedPattern: null };
    }
    
    return { 
        intent: bestIntent, 
        confidence: Math.min(bestScore, 0.99),
        matchedPattern 
    };
}

/**
 * Select a random response from available responses
 */
function selectResponse(responses) {
    if (!responses || !responses.length) {
        return "I'm here to help! What would you like to know about our hibachi service?";
    }
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Generate response using pattern matching (fallback mode)
 */
function generatePatternResponse(message) {
    const data = loadResponses();
    const { intent, confidence, matchedPattern } = detectIntent(message);
    
    let responseText;
    let quickReplies = [];
    
    if (intent === 'fallback') {
        responseText = selectResponse(data.fallback.responses);
        quickReplies = data.fallback.quickReplies || [];
    } else {
        const intentData = data.intents[intent];
        responseText = selectResponse(intentData.responses);
        quickReplies = intentData.quickReplies || [];
    }
    
    return {
        response: responseText,
        intent,
        confidence: Math.round(confidence * 100) / 100,
        quickReplies,
        source: 'pattern',
        debug: process.env.NODE_ENV !== 'production' ? {
            normalizedMessage: preprocessMessage(message),
            matchedPattern
        } : undefined
    };
}

// ============================================
// MAIN CHAT FUNCTION (GEMINI + FALLBACK)
// ============================================

/**
 * Generate chatbot response for user message
 * Uses Gemini when available, falls back to pattern matching
 * 
 * @param {string} message - User's message
 * @param {Array} history - Conversation history [{ role: 'user'|'assistant', content: string }]
 * @returns {Promise<object>} - { response, intent, confidence, quickReplies, source }
 */
export async function generateResponse(message, history = []) {
    // Input validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return {
            response: "I didn't catch that. How can I help you with your hibachi event?",
            intent: 'invalid_input',
            confidence: 0,
            quickReplies: ['View packages', 'Book now', 'Contact us'],
            source: 'validation'
        };
    }

    const trimmedMessage = message.trim();
    
    // Check message length
    if (trimmedMessage.length > 1000) {
        return {
            response: "That's quite a long message! Could you break it down into smaller questions? I'm happy to help with each one.",
            intent: 'message_too_long',
            confidence: 0,
            quickReplies: ['Ask about pricing', 'Ask about booking', 'Contact us'],
            source: 'validation'
        };
    }

    // Try Gemini first if available
    if (isGeminiAvailable()) {
        try {
            const geminiResult = await generateGeminiResponse(trimmedMessage, history);
            
            if (geminiResult.success && geminiResult.response) {
                const quickReplies = extractQuickReplies(geminiResult.response);
                
                logger.logChatbot({
                    action: 'response_generated',
                    source: 'gemini',
                    messageLength: trimmedMessage.length,
                    responseLength: geminiResult.response.length
                });
                
                return {
                    response: geminiResult.response,
                    intent: 'gemini',
                    confidence: 0.95,
                    quickReplies,
                    source: 'gemini'
                };
            }
            
            // Gemini failed, log and fall through to pattern matching
            logger.logWarn('Gemini response failed, using fallback', { 
                error: geminiResult.error 
            });
            
        } catch (error) {
            logger.logError(error, { context: 'Gemini chat' });
            // Fall through to pattern matching
        }
    }

    // Fallback to pattern matching
    const patternResult = generatePatternResponse(trimmedMessage);
    
    logger.logChatbot({
        action: 'response_generated',
        source: 'pattern',
        intent: patternResult.intent,
        confidence: patternResult.confidence
    });
    
    return patternResult;
}

/**
 * Get all available intents (for documentation/testing)
 */
export function getAvailableIntents() {
    const data = loadResponses();
    return Object.keys(data.intents);
}

/**
 * Test a message against all intents (debugging)
 */
export function testMessage(message) {
    const data = loadResponses();
    const normalized = preprocessMessage(message);
    
    const results = [];
    
    for (const [intentName, intentData] of Object.entries(data.intents)) {
        if (!intentData.patterns) continue;
        
        const score = calculateMatchScore(normalized, intentData.patterns);
        results.push({ intent: intentName, score: Math.round(score * 100) / 100 });
    }
    
    return results.sort((a, b) => b.score - a.score);
}

/**
 * Get chatbot status and configuration
 */
export function getChatbotStatus() {
    const geminiConfig = getGeminiConfig();
    
    return {
        geminiAvailable: geminiConfig.available,
        geminiModel: geminiConfig.model,
        geminiLocation: geminiConfig.location,
        fallbackAvailable: true,
        intentsLoaded: getAvailableIntents().length,
        mode: geminiConfig.available ? 'gemini' : 'pattern'
    };
}

export default {
    generateResponse,
    detectIntent,
    getAvailableIntents,
    testMessage,
    getChatbotStatus
};
