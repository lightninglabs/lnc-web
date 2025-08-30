import SessionManager from '../sessions/sessionManager';
import { UnlockOptions } from '../types/lnc';
import { AuthStrategy } from './authStrategy';

/**
 * Session-based authentication strategy.
 * Handles session restoration and temporary credential access.
 */
export class SessionStrategy implements AuthStrategy {
    readonly method = 'session' as const;
    private sessionValidated = false;

    constructor(private sessionManager: SessionManager) {}

    isSupported(): boolean {
        return true; // Session auth is always supported if sessions are enabled
    }

    isUnlocked(): boolean {
        return this.sessionValidated && this.sessionManager.hasActiveSession();
    }

    async unlock(options: UnlockOptions): Promise<boolean> {
        if (options.method !== 'session') {
            return false;
        }

        try {
            // Try to restore the session
            const session = await this.sessionManager.tryRestore();
            this.sessionValidated = !!session;
            return this.sessionValidated;
        } catch (error) {
            console.error('[SessionStrategy] Session restore failed:', error);
            this.sessionValidated = false;
            return false;
        }
    }

    hasAnyCredentials(): boolean {
        return this.sessionValidated && this.sessionManager.hasActiveSession();
    }

    async canAutoRestore(): Promise<boolean> {
        if (!this.sessionManager.canAutoRestore()) {
            return false;
        }

        // Actually validate the session can be restored
        return await this.sessionManager.hasValidSession();
    }

    async getCredential(key: string): Promise<string | undefined> {
        if (!this.isUnlocked()) {
            console.warn(
                '[SessionStrategy] Cannot get credential - no active session'
            );
            return undefined;
        }

        try {
            // Session credentials are accessed through the session manager
            const session = await this.sessionManager.tryRestore();
            if (session && key in session) {
                return (session as any)[key];
            }
            return undefined;
        } catch (error) {
            console.error(
                `[SessionStrategy] Failed to get credential ${key}:`,
                error
            );
            return undefined;
        }
    }

    async setCredential(key: string, value: string): Promise<void> {
        // Session strategy doesn't directly store credentials
        // This is handled by the session manager when creating sessions
        console.warn(
            '[SessionStrategy] setCredential not supported - use createSession instead'
        );
        throw new Error(
            'SessionStrategy does not support direct credential storage'
        );
    }

    clear(): void {
        this.sessionValidated = false;
        this.sessionManager.clearSession();
    }
}
