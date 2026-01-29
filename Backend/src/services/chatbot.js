/**
 * Chatbot Service - Intent Classification & Response Generation
 * 
 * This service provides natural language understanding for the chatbot,
 * using pattern matching, keyword analysis, and confidence scoring
 * to determine user intent and generate appropriate responses.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load response templates
let responseData = null;

/**
 * Load chatbot responses from JSON file
 * Cached in memory for performance
 */
function loadResponses() {
    if (!responseData) {
        try {
            const dataPath = join(__dirname, '..', 'data', 'chatbot-responses.json');
            const rawData = readFileSync(dataPath, 'utf8');
            responseData = JSON.parse(rawData);
        } catch (error) {
            console.error('Failed to load chatbot responses:', error);
            responseData = { intents: {}, fallback: { responses: ['I apologize, but I encountered an error. Please try again.'] } };
        }
    }
    return responseData;
}

/**
 * Preprocess user message for intent matching
 * - Lowercase
 * - Remove punctuation
 * - Normalize whitespace
 * - Handle common contractions
 * 
 * @param {string} message - Raw user input
 * @returns {string} - Normalized message
 */
function preprocessMessage(message) {
    if (!message || typeof message !== 'string') return '';
    
    let normalized = message.toLowerCase().trim();
    
    // Expand common contractions
    const contractions = {
        "what's": "what is",
        "where's": "where is",
        "how's": "how is",
        "i'm": "i am",
        "you're": "you are",
        "it's": "it is",
        "that's": "that is",
        "there's": "there is",
        "don't": "do not",
        "doesn't": "does not",
        "didn't": "did not",
        "can't": "cannot",
        "couldn't": "could not",
        "won't": "will not",
        "wouldn't": "would not",
        "i'd": "i would",
        "you'd": "you would",
        "he'd": "he would",
        "she'd": "she would",
        "we'd": "we would",
        "they'd": "they would",
        "i'll": "i will",
        "you'll": "you will",
        "we'll": "we will",
        "they'll": "they will",
        "i've": "i have",
        "you've": "you have",
        "we've": "we have",
        "they've": "they have"
    };
    
    for (const [contraction, expansion] of Object.entries(contractions)) {
        normalized = normalized.replace(new RegExp(contraction, 'gi'), expansion);
    }
    
    // Remove special characters but keep spaces and basic punctuation
    normalized = normalized.replace(/[^a-z0-9\s?!.,]/g, ' ');
    
    // Normalize multiple spaces
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
}

/**
 * Calculate match score between message and intent patterns
 * Uses multiple strategies:
 * 1. Exact pattern match (highest weight)
 * 2. Pattern word overlap (medium weight)
 * 3. Keyword density (lower weight)
 * 
 * @param {string} message - Preprocessed user message
 * @param {string[]} patterns - Intent patterns to match
 * @returns {number} - Match score (0-1)
 */
function calculateMatchScore(message, patterns) {
    if (!message || !patterns || !patterns.length) return 0;
    
    const messageWords = new Set(message.split(' ').filter(w => w.length > 1));
    let maxScore = 0;
    
    for (const pattern of patterns) {
        let score = 0;
        const patternLower = pattern.toLowerCase();
        
        // Strategy 1: Exact substring match (highest confidence)
        if (message.includes(patternLower)) {
            // Weight by pattern length relative to message length
            const lengthRatio = patternLower.length / message.length;
            score = Math.max(score, 0.6 + (lengthRatio * 0.4));
        }
        
        // Strategy 2: Word-level match
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
 * Detect intent from user message
 * Returns the best matching intent with confidence score
 * 
 * @param {string} message - Raw user message
 * @returns {object} - { intent, confidence, patterns }
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
    
    // Score each intent
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
    // If score is too low, fall back to fallback intent
    const confidenceThreshold = 0.3;
    if (bestScore < confidenceThreshold) {
        return { intent: 'fallback', confidence: bestScore, matchedPattern: null };
    }
    
    return { 
        intent: bestIntent, 
        confidence: Math.min(bestScore, 0.99), // Cap at 0.99 to indicate room for improvement
        matchedPattern 
    };
}

/**
 * Select a random response from available responses
 * 
 * @param {string[]} responses - Array of possible responses
 * @returns {string} - Selected response
 */
function selectResponse(responses) {
    if (!responses || !responses.length) {
        return "I'm here to help! What would you like to know about our hibachi service?";
    }
    return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Generate chatbot response for user message
 * 
 * @param {string} message - User's message
 * @returns {object} - { response, intent, confidence, quickReplies }
 */
export function generateResponse(message) {
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
        debug: process.env.NODE_ENV !== 'production' ? {
            normalizedMessage: preprocessMessage(message),
            matchedPattern
        } : undefined
    };
}

/**
 * Get all available intents for documentation/testing
 * 
 * @returns {string[]} - Array of intent names
 */
export function getAvailableIntents() {
    const data = loadResponses();
    return Object.keys(data.intents);
}

/**
 * Test a message against all intents (debugging)
 * 
 * @param {string} message - Message to test
 * @returns {object[]} - Array of { intent, score } sorted by score
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

export default {
    generateResponse,
    detectIntent,
    getAvailableIntents,
    testMessage
};
