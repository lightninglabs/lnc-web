import SessionManager from '../sessions/sessionManager';
import SessionRefreshManager from '../sessions/sessionRefreshManager';
import { SessionCredentials } from '../sessions/types';

/**
 * Coordinates session-related operations and lifecycle management.
 * Acts as a bridge between the credential store and session manager.
 */
export class SessionCoordinator {
    private refreshManager?: SessionRefreshManager;

    constructor(private sessionManager?: SessionManager) {
        // Initialize refresh manager if session manager is available
        if (this.sessionManager) {
            this.refreshManager = new SessionRefreshManager(
                this.sessionManager
            );
        }
    }

    /**
     * Check if auto-restore is available
     */
    async canAutoRestore(): Promise<boolean> {
        if (!this.sessionManager) {
            return false;
        }
        return this.sessionManager.hasValidSession();
    }

    /**
     * Attempt to auto-restore from session
     */
    async tryAutoRestore(): Promise<boolean> {
        if (!this.sessionManager) {
            return false;
        }

        try {
            const credentials = await this.sessionManager.tryRestore();
            const success = !!credentials;

            if (success) {
                console.log(
                    '[SessionCoordinator] Session auto-restoration successful'
                );
                // Start refresh manager after successful auto-restoration
                this.startRefreshManager();
            } else {
                console.log(
                    '[SessionCoordinator] Session auto-restoration failed - no valid session'
                );
            }

            return success;
        } catch (error) {
            console.error(
                '[SessionCoordinator] Session auto-restoration error:',
                error
            );
            return false;
        }
    }

    /**
     * Create a new session with credentials
     */
    async createSession(credentials: SessionCredentials): Promise<void> {
        if (!this.sessionManager) {
            console.warn(
                '[SessionCoordinator] No session manager available - skipping session creation'
            );
            return;
        }

        try {
            await this.sessionManager.createSession(credentials);
            console.log('[SessionCoordinator] Session created successfully');

            // Start automatic refresh monitoring after successful session creation
            this.startRefreshManager();
        } catch (error) {
            console.error(
                '[SessionCoordinator] Failed to create session:',
                error
            );
            throw error;
        }
    }

    /**
     * Refresh the current session
     */
    async refreshSession(): Promise<boolean> {
        if (!this.sessionManager) {
            return false;
        }

        try {
            const success = await this.sessionManager.refreshSession();
            if (success) {
                console.log(
                    '[SessionCoordinator] Session refreshed successfully'
                );
            } else {
                console.log('[SessionCoordinator] Session refresh failed');
            }
            return success;
        } catch (error) {
            console.error('[SessionCoordinator] Session refresh error:', error);
            return false;
        }
    }

    /**
     * Check if there's an active session
     */
    hasActiveSession(): boolean {
        return this.sessionManager?.hasActiveSession() ?? false;
    }

    /**
     * Get time remaining until session expiry
     */
    async getTimeRemaining(): Promise<number> {
        if (!this.sessionManager) {
            return 0;
        }

        return this.sessionManager.getSessionTimeRemaining();
    }

    /**
     * Clear the current session
     */
    clearSession(): void {
        if (this.sessionManager) {
            // Stop refresh manager before clearing session
            this.stopRefreshManager();
            this.sessionManager.clearSession();
            console.log('[SessionCoordinator] Session cleared');
        }
    }

    /**
     * Get the session manager instance (for direct access if needed)
     */
    getSessionManager(): SessionManager | undefined {
        return this.sessionManager;
    }

    /**
     * Check if session functionality is available
     */
    isSessionAvailable(): boolean {
        return !!this.sessionManager;
    }

    /**
     * Get session expiry time (for coordination with other components)
     */
    getSessionExpiry(): Date | undefined {
        if (!this.sessionManager) {
            return undefined;
        }

        const timeRemaining = this.sessionManager.getSessionTimeRemaining();
        if (timeRemaining > 0) {
            return new Date(Date.now() + timeRemaining);
        }
        return undefined;
    }

    /**
     * Start the refresh manager for automatic session refresh
     */
    private startRefreshManager(): void {
        if (this.refreshManager && !this.refreshManager.isActive()) {
            this.refreshManager.start();
            console.log(
                '[SessionCoordinator] Automatic session refresh started'
            );
        }
    }

    /**
     * Stop the refresh manager
     */
    private stopRefreshManager(): void {
        if (this.refreshManager && this.refreshManager.isActive()) {
            this.refreshManager.stop();
            console.log(
                '[SessionCoordinator] Automatic session refresh stopped'
            );
        }
    }

    /**
     * Get the refresh manager instance (for access to refresh state)
     */
    getRefreshManager(): SessionRefreshManager | undefined {
        return this.refreshManager;
    }

    /**
     * Check if automatic refresh is active
     */
    isAutoRefreshActive(): boolean {
        return this.refreshManager?.isActive() ?? false;
    }
}
