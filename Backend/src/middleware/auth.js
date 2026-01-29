/**
 * Admin Authentication Middleware
 * Simple API key-based authentication for admin endpoints
 */
import { query, isPostgres, getMemoryDb, createId } from '../db/index.js';
import crypto from 'crypto';

const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const SESSION_DURATION_HOURS = 24;

/**
 * Generate a secure random token
 */
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate admin API key and create session
 * @param {string} apiKey - The admin API key to validate
 * @returns {object} Session info or null
 */
export async function validateAdminKey(apiKey) {
    if (!ADMIN_API_KEY) {
        console.warn('⚠️ ADMIN_API_KEY not set - admin login disabled');
        return null;
    }

    if (apiKey !== ADMIN_API_KEY) {
        return null;
    }

    // Create session token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

    if (isPostgres()) {
        await query(`
            INSERT INTO admin_sessions (token, expires_at)
            VALUES ($1, $2)
        `, [token, expiresAt]);
    } else {
        if (!getMemoryDb().adminSessions) {
            getMemoryDb().adminSessions = new Map();
        }
        getMemoryDb().adminSessions.set(token, {
            token,
            expiresAt: expiresAt.toISOString(),
            createdAt: new Date().toISOString()
        });
    }

    return { token, expiresAt: expiresAt.toISOString() };
}

/**
 * Validate session token
 * @param {string} token - The session token to validate
 * @returns {boolean} Whether the token is valid
 */
export async function validateSession(token) {
    if (!token) return false;

    if (isPostgres()) {
        const result = await query(`
            SELECT * FROM admin_sessions 
            WHERE token = $1 AND expires_at > NOW()
        `, [token]);

        if (result.rows.length === 0) {
            return false;
        }

        // Update last activity
        await query(`
            UPDATE admin_sessions SET last_activity = NOW()
            WHERE token = $1
        `, [token]);

        return true;
    } else {
        const sessions = getMemoryDb().adminSessions || new Map();
        const session = sessions.get(token);
        
        if (!session) return false;
        if (new Date(session.expiresAt) < new Date()) {
            sessions.delete(token);
            return false;
        }
        
        session.lastActivity = new Date().toISOString();
        return true;
    }
}

/**
 * Invalidate session (logout)
 * @param {string} token - The session token to invalidate
 */
export async function invalidateSession(token) {
    if (isPostgres()) {
        await query('DELETE FROM admin_sessions WHERE token = $1', [token]);
    } else {
        const sessions = getMemoryDb().adminSessions || new Map();
        sessions.delete(token);
    }
}

/**
 * Clean up expired sessions (run periodically)
 */
export async function cleanupSessions() {
    if (isPostgres()) {
        const result = await query('DELETE FROM admin_sessions WHERE expires_at < NOW()');
        if (result.rowCount > 0) {
            console.log(`🧹 Cleaned up ${result.rowCount} expired admin sessions`);
        }
    } else {
        const sessions = getMemoryDb().adminSessions || new Map();
        const now = new Date();
        for (const [token, session] of sessions) {
            if (new Date(session.expiresAt) < now) {
                sessions.delete(token);
            }
        }
    }
}

/**
 * Middleware to require admin authentication
 * Checks for Bearer token in Authorization header
 */
export function requireAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized - Missing authentication token' });
    }

    const token = authHeader.substring(7);
    
    validateSession(token)
        .then(valid => {
            if (!valid) {
                return res.status(401).json({ error: 'Unauthorized - Invalid or expired token' });
            }
            req.adminToken = token;
            next();
        })
        .catch(err => {
            console.error('Auth validation error:', err);
            return res.status(500).json({ error: 'Authentication error' });
        });
}

/**
 * Optional admin auth - allows unauthenticated access but marks if authenticated
 */
export function optionalAdmin(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.isAdmin = false;
        return next();
    }

    const token = authHeader.substring(7);
    
    validateSession(token)
        .then(valid => {
            req.isAdmin = valid;
            req.adminToken = valid ? token : null;
            next();
        })
        .catch(() => {
            req.isAdmin = false;
            next();
        });
}
