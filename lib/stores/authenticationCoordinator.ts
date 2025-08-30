import { UnlockOptions } from '../types/lnc';
import { AuthStrategy } from './authStrategy';
import { CredentialCache } from './credentialCache';
import { SessionCoordinator } from './sessionCoordinator';
import { StrategyManager } from './strategyManager';
import { AuthenticationInfo } from './unifiedCredentialStore';

/**
 * Coordinates authentication operations across strategies, cache, and sessions.
 * Handles unlock logic, credential persistence, and authentication state management.
 */
export class AuthenticationCoordinator {
    private activeStrategy?: AuthStrategy;
    private sessionRestored = false;
    private initializeCachePromise?: Promise<void>;

    constructor(
        private strategyManager: StrategyManager,
        private credentialCache: CredentialCache,
        private sessionCoordinator: SessionCoordinator
    ) {
        // Store the promise so we can wait for it later
        this.initializeCachePromise = this.initializeCache();
    }

    /**
     * Attempt to unlock using the specified method
     */
    async unlock(options: UnlockOptions): Promise<boolean> {
        try {
            // Get the appropriate strategy for this unlock method
            const strategy = this.strategyManager.getStrategy(options.method);
            if (!strategy) {
                console.error(
                    `[AuthenticationCoordinator] Authentication method '${options.method}' not supported`
                );
                return false;
            }

            // Unlock the strategy
            const success = await strategy.unlock(options);
            if (!success) {
                console.error(
                    `[AuthenticationCoordinator] Failed to unlock with ${options.method}`
                );
                return false;
            }

            // Set this as the active strategy
            this.activeStrategy = strategy;
            console.log(
                `[AuthenticationCoordinator] Successfully unlocked with ${options.method} strategy`
            );

            // Load existing credentials from the strategy's storage
            await this.loadCredentialsFromStrategy(strategy);
            console.log(
                '[AuthenticationCoordinator] loaded credentials from strategy',
                this.credentialCache.snapshot()
            );

            // Persist any cached credentials (from initial connection) to the strategy
            await this.persistCachedCredentials(strategy);

            // If sessions are enabled and we're unlocked, create/update session
            if (
                this.sessionCoordinator.isSessionAvailable() &&
                this.isUnlocked()
            ) {
                await this.sessionCoordinator.createSession({
                    localKey: this.credentialCache.get('localKey') || '',
                    remoteKey: this.credentialCache.get('remoteKey') || '',
                    pairingPhrase:
                        this.credentialCache.get('pairingPhrase') || '',
                    serverHost: this.credentialCache.get('serverHost') || '',
                    expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours default
                });
            }

            return true;
        } catch (error) {
            console.error('[AuthenticationCoordinator] Unlock failed:', error);
            return false;
        }
    }

    /**
     * Check if any strategy is currently unlocked
     */
    isUnlocked(): boolean {
        return !!this.activeStrategy && this.activeStrategy.isUnlocked();
    }

    /**
     * Get authentication information
     */
    async getAuthenticationInfo(): Promise<AuthenticationInfo> {
        // Wait for session restoration to complete before returning auth info
        await this.waitForSessionRestoration();

        // Check if any strategy has stored credentials
        const hasStoredCredentials = this.strategyManager.hasAnyCredentials();

        const sessionStrategy = this.strategyManager.getStrategy('session');
        const hasActiveSession = sessionStrategy?.isUnlocked() ?? false;
        const isUnlocked = this.isUnlocked();

        // Check passkey support and availability
        const passkeyStrategy = this.strategyManager.getStrategy('passkey');
        const supportsPasskeys =
            !!passkeyStrategy && passkeyStrategy.isSupported();
        const hasPasskey =
            supportsPasskeys && passkeyStrategy?.hasStoredAuthData?.() === true;

        return {
            isUnlocked,
            hasStoredCredentials,
            hasActiveSession,
            supportsPasskeys,
            hasPasskey,
            preferredUnlockMethod: this.strategyManager.getPreferredMethod()
        };
    }

    /**
     * Try to auto-restore from session
     */
    async tryAutoRestore(): Promise<boolean> {
        if (
            !this.sessionCoordinator.isSessionAvailable() ||
            this.sessionRestored
        ) {
            return false;
        }

        const sessionStrategy = this.strategyManager.getStrategy('session');
        if (!sessionStrategy) {
            return false;
        }

        try {
            // Use the session strategy to validate and restore
            const restored = await sessionStrategy.unlock({
                method: 'session'
            });
            if (restored) {
                // Get the session data through the coordinator
                const sessionCredentials = await this.sessionCoordinator
                    .getSessionManager()
                    ?.tryRestore();
                if (sessionCredentials) {
                    this.credentialCache.hydrateFromSession(sessionCredentials);
                    this.sessionRestored = true;
                    // Set the session strategy as active since restoration succeeded
                    this.activeStrategy = sessionStrategy;
                    return true;
                }
            }
        } catch (error) {
            console.error(
                '[AuthenticationCoordinator] Auto-restore failed:',
                error
            );
        }

        return false;
    }

    /**
     * Clear session and reset authentication state
     */
    clearSession(): void {
        this.sessionCoordinator.clearSession();
        this.sessionRestored = false;
        this.activeStrategy = undefined;
        console.log('[AuthenticationCoordinator] Cleared session state');
    }

    /**
     * Create session after successful connection
     */
    async createSessionAfterConnection(): Promise<void> {
        console.log(
            '[AuthenticationCoordinator] Creating session after connection...'
        );

        // Save any credentials that were received during connection
        const keysToSave = [
            'localKey',
            'remoteKey',
            'pairingPhrase',
            'serverHost'
        ];

        for (const key of keysToSave) {
            const value = this.credentialCache.get(key);
            if (value) {
                console.log(
                    `[AuthenticationCoordinator] Saving ${key} to strategy...`
                );
                await this.saveCredentialToStrategy(key, value);
            }
        }

        // Create a session with the current credentials
        if (this.sessionCoordinator.isSessionAvailable()) {
            console.log('[AuthenticationCoordinator] Creating session...');
            await this.sessionCoordinator.createSession({
                localKey: this.credentialCache.get('localKey') || '',
                remoteKey: this.credentialCache.get('remoteKey') || '',
                pairingPhrase: this.credentialCache.get('pairingPhrase') || '',
                serverHost: this.credentialCache.get('serverHost') || '',
                expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours default
            });
        }

        console.log(
            '[AuthenticationCoordinator] Session creation after connection complete'
        );
    }

    /**
     * Get the active strategy
     */
    getActiveStrategy(): AuthStrategy | undefined {
        return this.activeStrategy;
    }

    //
    // Private methods
    //

    private async initializeCache(): Promise<void> {
        // Try to auto-restore from session first
        await this.tryAutoRestore();

        // If not restored and we have an active strategy, load from strategy
        if (!this.sessionRestored && this.activeStrategy) {
            await this.loadCredentialsFromStrategy(this.activeStrategy);
        }
    }

    /**
     * Wait for session restoration to complete
     */
    private async waitForSessionRestoration(): Promise<void> {
        if (
            !this.sessionCoordinator.isSessionAvailable() ||
            this.sessionRestored
        ) {
            return;
        }

        // If initializeCache is still running, wait for it
        if (this.initializeCachePromise) {
            await this.initializeCachePromise;
        } else {
            // Otherwise, try to restore manually
            await this.tryAutoRestore();
        }
    }

    /**
     * Persist cached credentials to the active strategy
     */
    private async persistCachedCredentials(
        strategy: AuthStrategy
    ): Promise<void> {
        const keysToPersist = [
            'localKey',
            'remoteKey',
            'pairingPhrase',
            'serverHost'
        ];

        for (const key of keysToPersist) {
            const value = this.credentialCache.get(key);
            if (value) {
                try {
                    await strategy.setCredential(key, value);
                    console.log(
                        `[AuthenticationCoordinator] Persisted ${key} to ${strategy.method} storage`
                    );
                } catch (error) {
                    console.error(
                        `[AuthenticationCoordinator] Failed to persist ${key}:`,
                        error
                    );
                }
            }
        }
    }

    /**
     * Load credentials from a strategy's storage into the cache
     */
    private async loadCredentialsFromStrategy(
        strategy: AuthStrategy
    ): Promise<void> {
        const keys = ['pairingPhrase', 'serverHost', 'localKey', 'remoteKey'];

        for (const key of keys) {
            try {
                const value = await strategy.getCredential(key);
                if (value) {
                    this.credentialCache.set(key, value);
                }
            } catch (error) {
                console.error(
                    `[AuthenticationCoordinator] Failed to load credential ${key}:`,
                    error
                );
            }
        }
        console.log(
            '[AuthenticationCoordinator] loaded credentials from strategy',
            this.activeStrategy?.method,
            this.credentialCache.snapshot()
        );
    }

    /**
     * Save a credential to the active strategy
     */
    private async saveCredentialToStrategy(
        key: string,
        value: string
    ): Promise<void> {
        if (!this.activeStrategy) {
            return; // No active strategy yet - will be saved when unlocked
        }

        try {
            await this.activeStrategy.setCredential(key, value);
        } catch (error) {
            console.error(
                `[AuthenticationCoordinator] Failed to save credential ${key}:`,
                error
            );
        }
    }
}
