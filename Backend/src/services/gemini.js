/**
 * Gemini AI Service
 * 
 * Provides integration with Google's Gemini 2.0 Flash model via Vertex AI.
 * Handles chat completions with conversation history and knowledge base context.
 */

import { VertexAI } from '@google-cloud/vertexai';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================
// CONFIGURATION
// ============================================

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-001';
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
const LOCATION = process.env.VERTEX_AI_LOCATION || 'us-central1';

// Model parameters for optimal chatbot responses
const GENERATION_CONFIG = {
    maxOutputTokens: 1024,      // Keep responses concise
    temperature: 0.7,            // Balance creativity and consistency
    topP: 0.9,                   // Nucleus sampling
    topK: 40                     // Top-K sampling
};

// Safety settings - allow business-appropriate content
const SAFETY_SETTINGS = [
    {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
];

// ============================================
// KNOWLEDGE BASE LOADING
// ============================================

let knowledgeBase = null;
let systemPrompt = null;

/**
 * Load knowledge base from JSON file
 * Cached in memory for performance
 */
function loadKnowledgeBase() {
    if (!knowledgeBase) {
        try {
            const kbPath = join(__dirname, '..', 'data', 'knowledge-base.json');
            const rawData = readFileSync(kbPath, 'utf8');
            knowledgeBase = JSON.parse(rawData);
            logger.logInfo('Knowledge base loaded successfully');
        } catch (error) {
            logger.logError(error, { context: 'Load knowledge base' });
            knowledgeBase = {};
        }
    }
    return knowledgeBase;
}

/**
 * Build system prompt with knowledge base context
 * This instructs the model on how to behave and what it knows
 */
function buildSystemPrompt() {
    if (systemPrompt) {
        return systemPrompt;
    }

    const kb = loadKnowledgeBase();
    
    systemPrompt = `You are the POP Habachi virtual assistant, helping customers plan private hibachi dining experiences.

## YOUR IDENTITY
- Name: POP Habachi Assistant
- Role: Customer service chatbot for a private hibachi catering company
- Personality: Friendly, helpful, professional, and enthusiastic about hibachi cuisine

## YOUR KNOWLEDGE BASE
Here is everything you know about POP Habachi. Use ONLY this information to answer questions:

### Business Information
- Company: ${kb.business?.name || 'POP Habachi'}
- Tagline: ${kb.business?.tagline || 'Private Hibachi Dining Experience'}
- Website: ${kb.business?.website || 'https://jimmy00415.github.io/ChefWeb/'}
- Booking Page: ${kb.business?.bookingUrl || 'https://jimmy00415.github.io/ChefWeb/pages/booking.html'}
- Check Booking: ${kb.business?.checkBookingUrl || 'https://jimmy00415.github.io/ChefWeb/pages/check-booking.html'}
- Contact Email: ${kb.business?.contact?.email || 'info@pophabachi.com'}
- Contact Phone: ${kb.business?.contact?.phone || '(555) 123-4567'}

### Packages & Pricing
${formatPackages(kb.packages)}

### Requirements
- Minimum Spend: $${kb.requirements?.minimumSpend || 500}
- Minimum Guests: ${kb.requirements?.minimumGuests || 6} adults
- Maximum Guests: ${kb.requirements?.maximumGuests || 50} (larger events contact us)
- Deposit: ${kb.requirements?.depositPercent || 50}% at booking
- Balance: Remaining 50% due on event day
- Children: Under 12 at 50% rate, under 3 free

### Service Areas
- Primary Area: ${kb.serviceAreas?.primary || 'San Francisco Bay Area'}
- States Served: ${kb.serviceAreas?.states?.join(', ') || 'CA, NY, TX, FL, IL, PA, OH, GA, NC, MI'}
- Maximum Travel: ${kb.serviceAreas?.maxTravelMiles || 300} miles
- Travel Fees: May apply beyond 50 miles (${kb.serviceAreas?.travelFeeRange || '$50-$200'})

### Cancellation Policy
- More than 7 days before: 100% refund
- 3-7 days before: 50% refund
- Less than 3 days: No refund
- Modifications: Must be made 3+ days before event

### Event Timeline
- Chef Arrival: 30-45 minutes before event
- Cooking Duration: 1-1.5 hours
- Cleanup: 30 minutes (we handle it!)
- Total Time: 2.5-3 hours on-site

### What Guests Provide
- Outdoor patio or well-ventilated indoor space (10x10 ft minimum)
- Tables and chairs for guests
- Standard electrical outlet within 25 feet
- Water access for cleanup

### What We Provide
${kb.weProvide?.map(item => `- ${item}`).join('\n') || '- All equipment, ingredients, and cleanup'}

### Dietary Accommodations
${kb.dietaryAccommodations?.available?.map(item => `- ${item}`).join('\n') || '- Vegetarian, vegan, gluten-free, allergy-safe options available'}

### Event Types We Serve
${kb.eventTypes?.popular?.map(e => `- ${e.type}: ${e.note}`).join('\n') || '- Birthdays, weddings, corporate events, and more'}

### Payment Methods
- Accepted: ${kb.payment?.methods?.join(', ') || 'Visa, Mastercard, Amex, Apple Pay, Google Pay'}
- Processor: Stripe (secure & encrypted)
- Tipping: Not required but appreciated (100% goes to chef)

### Frequently Asked Questions
${kb.faq?.map(item => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n') || ''}

## YOUR RESPONSE GUIDELINES
1. Keep responses CONCISE - under 150 words unless detailed info requested
2. Use 1-2 emojis per response for warmth (🍳 🔥 👨‍🍳 ✨)
3. Format with markdown: **bold** for emphasis, bullet points for lists
4. End with a follow-up question OR a call-to-action
5. Suggest 2-3 quick reply options when helpful

## YOUR RESTRICTIONS
1. ONLY answer questions about POP Habachi services
2. For off-topic questions, politely redirect: "I specialize in hibachi catering questions! How can I help with your event?"
3. NEVER make up information not in your knowledge base
4. For specific date availability, say: "I can't check live availability, but you can see open dates on our booking page!"
5. For complex issues (refunds, disputes, complaints), say: "For that, I'd recommend contacting our team directly at info@pophabachi.com or (555) 123-4567"
6. Never claim to be human - you're an AI assistant
7. Don't discuss competitors or other catering services

## RESPONSE FORMAT
Always structure responses like this:
1. Direct answer to the question
2. Additional helpful context (if relevant)
3. Follow-up question OR call-to-action
4. [Optional] Quick reply suggestions

Now respond to customer messages helpfully and naturally!`;

    return systemPrompt;
}

/**
 * Format packages for system prompt
 */
function formatPackages(packages) {
    if (!packages) return 'Package information not available';
    
    let formatted = '';
    for (const [key, pkg] of Object.entries(packages)) {
        formatted += `\n**${pkg.name || key}** - $${pkg.price}/person${pkg.popular ? ' (Most Popular!)' : ''}\n`;
        formatted += `Includes: ${pkg.includes?.join(', ') || 'See menu for details'}\n`;
        formatted += `Proteins: ${pkg.proteinOptions?.join(', ') || 'Various options'}\n`;
    }
    return formatted;
}

// ============================================
// VERTEX AI CLIENT
// ============================================

let vertexAI = null;
let generativeModel = null;

/**
 * Initialize Vertex AI client
 * Uses Application Default Credentials on Cloud Run
 */
function initializeVertexAI() {
    if (generativeModel) {
        return generativeModel;
    }

    if (!PROJECT_ID) {
        logger.logWarn('GOOGLE_CLOUD_PROJECT not set - Gemini unavailable');
        return null;
    }

    try {
        vertexAI = new VertexAI({
            project: PROJECT_ID,
            location: LOCATION
        });

        generativeModel = vertexAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: GENERATION_CONFIG,
            safetySettings: SAFETY_SETTINGS,
            // Pass system instruction as string (simpler format)
            systemInstruction: buildSystemPrompt()
        });

        logger.logInfo('Gemini model initialized', { model: GEMINI_MODEL, project: PROJECT_ID });
        return generativeModel;
    } catch (error) {
        logger.logError(error, { context: 'Initialize Vertex AI' });
        return null;
    }
}

// ============================================
// CHAT FUNCTIONALITY
// ============================================

/**
 * Convert conversation history to Vertex AI format
 * @param {Array} history - Array of { role: 'user'|'assistant', content: string }
 * @returns {Array} - Vertex AI formatted history
 */
function formatHistory(history) {
    if (!history || !Array.isArray(history)) {
        return [];
    }

    return history.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
    }));
}

/**
 * Generate a chat response using Gemini
 * 
 * @param {string} userMessage - The user's message
 * @param {Array} conversationHistory - Previous messages in the conversation
 * @returns {Promise<object>} - { response, success, error }
 */
export async function generateGeminiResponse(userMessage, conversationHistory = []) {
    const model = initializeVertexAI();
    
    if (!model) {
        return {
            response: null,
            success: false,
            error: 'Gemini model not available'
        };
    }

    try {
        // Start a chat session with history
        const chat = model.startChat({
            history: formatHistory(conversationHistory)
        });

        // Send message and get response
        const result = await chat.sendMessage(userMessage);
        const response = result.response;

        // Extract text from response
        const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!responseText) {
            logger.logWarn('Empty response from Gemini', { userMessage });
            return {
                response: null,
                success: false,
                error: 'Empty response from model'
            };
        }

        logger.logChatbot({
            action: 'gemini_response',
            inputLength: userMessage.length,
            outputLength: responseText.length,
            historyLength: conversationHistory.length
        });

        return {
            response: responseText,
            success: true,
            error: null
        };

    } catch (error) {
        // Log detailed error information
        const userMsgPreview = typeof userMessage === 'string' 
            ? userMessage.substring(0, 100) 
            : JSON.stringify(userMessage).substring(0, 100);
        
        const errorDetails = {
            context: 'Gemini chat',
            userMessage: userMsgPreview,
            errorMessage: error.message,
            errorName: error.name,
            errorCode: error.code,
            errorStack: error.stack?.split('\n').slice(0, 5).join(' -> ')
        };
        
        logger.logError(error, errorDetails);
        
        // Log to console for Cloud Run visibility
        console.error('[GEMINI ERROR]', JSON.stringify({
            message: error.message,
            code: error.code,
            name: error.name,
            statusCode: error.statusCode,
            details: error.details,
            stack: error.stack?.split('\n').slice(0, 5)
        }, null, 2));

        // Check for specific error types
        if (error.message?.includes('SAFETY')) {
            return {
                response: null,
                success: false,
                error: 'Content filtered by safety settings'
            };
        }

        if (error.message?.includes('QUOTA') || error.message?.includes('429')) {
            return {
                response: null,
                success: false,
                error: 'Rate limit exceeded'
            };
        }
        
        if (error.message?.includes('404') || error.message?.includes('not found')) {
            return {
                response: null,
                success: false,
                error: 'Model not found - check model name'
            };
        }
        
        if (error.message?.includes('403') || error.message?.includes('permission')) {
            return {
                response: null,
                success: false,
                error: 'Permission denied - check IAM roles'
            };
        }

        return {
            response: null,
            success: false,
            error: error.message || 'Unknown error'
        };
    }
}

/**
 * Check if Gemini is available and configured
 * @returns {boolean}
 */
export function isGeminiAvailable() {
    return !!PROJECT_ID;
}

/**
 * Get Gemini configuration info (for debugging)
 * @returns {object}
 */
export function getGeminiConfig() {
    return {
        available: isGeminiAvailable(),
        project: PROJECT_ID ? `${PROJECT_ID.substring(0, 8)}...` : null,
        location: LOCATION,
        model: GEMINI_MODEL
    };
}

/**
 * Extract quick reply suggestions from Gemini response
 * Looks for patterns like "Quick replies: ..." or bullet points at end
 * 
 * @param {string} response - Gemini response text
 * @returns {Array<string>} - Extracted quick replies
 */
export function extractQuickReplies(response) {
    if (!response) return [];

    const defaultReplies = ['View packages', 'Book now', 'Contact us'];
    
    // Look for explicit quick replies pattern
    const quickReplyMatch = response.match(/(?:quick replies?|suggestions?|options?):\s*(.+)$/im);
    if (quickReplyMatch) {
        const replies = quickReplyMatch[1]
            .split(/[,|•]/)
            .map(r => r.trim())
            .filter(r => r.length > 0 && r.length < 30);
        
        if (replies.length >= 2) {
            return replies.slice(0, 3);
        }
    }

    // Context-based default replies
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('book') || lowerResponse.includes('ready')) {
        return ['Book now', 'View packages', 'Check availability'];
    }
    
    if (lowerResponse.includes('price') || lowerResponse.includes('package')) {
        return ['Book Essential', 'Book Signature', 'Book Premium'];
    }
    
    if (lowerResponse.includes('cancel') || lowerResponse.includes('modify')) {
        return ['Check my booking', 'Contact support', 'View policy'];
    }
    
    if (lowerResponse.includes('diet') || lowerResponse.includes('allerg')) {
        return ['Book with dietary notes', 'View menu', 'Contact us'];
    }

    return defaultReplies;
}

export default {
    generateGeminiResponse,
    isGeminiAvailable,
    getGeminiConfig,
    extractQuickReplies,
    loadKnowledgeBase
};
