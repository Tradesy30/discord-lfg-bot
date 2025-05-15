// src/services/sessionManager.js
class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.activeLFG = new Map();
        this.userLFGMap = new Map(); // Tracks which users have active LFGs
        this.sessionTimeout = 10 * 60 * 1000; // 10 minutes
    }

    createSession(userId, user) {
        const session = {
            user,
            createdAt: Date.now()
        };
        this.sessions.set(userId, session);

        // Set timeout to clean up abandoned sessions
        setTimeout(() => this.cleanupSession(userId), this.sessionTimeout);

        return session;
    }

    getSession(userId) {
        return this.sessions.get(userId);
    }

    updateSession(userId, data) {
        const session = this.sessions.get(userId);
        if (!session) return null;

        const updatedSession = { ...session, ...data };
        this.sessions.set(userId, updatedSession);
        return updatedSession;
    }

    cleanupSession(userId) {
        if (this.sessions.has(userId)) {
            this.sessions.delete(userId);
        }
    }

    // Check if user has an active LFG
    userHasActiveLFG(userId) {
        return this.userLFGMap.has(userId);
    }

    // Get message ID of user's active LFG
    getUserActiveLFG(userId) {
        return this.userLFGMap.get(userId);
    }

    createLFG(messageId, data) {
        this.activeLFG.set(messageId, data);
        // Track which user created this LFG
        if (data.host && data.host.id) {
            this.userLFGMap.set(data.host.id, messageId);
        }
    }

    getLFG(messageId) {
        return this.activeLFG.get(messageId);
    }

    updateLFG(messageId, data) {
        const lfg = this.activeLFG.get(messageId);
        if (!lfg) return null;

        const updatedLFG = { ...lfg, ...data };
        this.activeLFG.set(messageId, updatedLFG);
        return updatedLFG;
    }

    deleteLFG(messageId) {
        const lfg = this.activeLFG.get(messageId);
        if (lfg && lfg.host && lfg.host.id) {
            // Remove the user's LFG tracking when post is deleted
            this.userLFGMap.delete(lfg.host.id);
        }
        this.activeLFG.delete(messageId);
    }

    // Admin function to clear a user's LFG lock
    clearUserLFGLock(userId) {
        if (this.userLFGMap.has(userId)) {
            // Note: This doesn't delete the actual LFG post,
            // just removes the user's association with it
            this.userLFGMap.delete(userId);
            return true;
        }
        return false;
    }
}

module.exports = new SessionManager();
