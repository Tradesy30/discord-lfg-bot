// src/services/sessionManager.js
class SessionManager {
    constructor() {
        this.sessions = new Map();
        this.activeLFG = new Map();
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

    createLFG(messageId, data) {
        this.activeLFG.set(messageId, data);
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
        this.activeLFG.delete(messageId);
    }
}

module.exports = new SessionManager();
