import SessionManager from '../sessions/sessionManager';
import SessionRefreshManager from '../sessions/sessionRefreshManager';
import { SessionCredentials } from '../sessions/types';
import {
  CredentialStore,
  LncConfig,
  UnlockMethod,
  UnlockOptions,
} from '../types/lnc';
import { AuthStrategy } from './authStrategy';
import { PasskeyStrategy } from './passkeyStrategy';
import { PasswordStrategy } from './passwordStrategy';
import { SessionStrategy } from './sessionStrategy';

export interface AuthenticationInfo {
    isUnlocked: boolean;
    hasStoredCredentials: boolean;
    hasActiveSession: boolean;
    supportsPasskeys: boolean;
    hasPasskey: boolean;
    preferredUnlockMethod: 'password' | 'passkey' | 'session';
}

/**
 * Unified credential store that uses the strategy pattern for authentication.
 * Maintains the same CredentialStore interface for backward compatibility.
 */
export default class UnifiedCredentialStore implements CredentialStore {
    private authStrategies = new Map<UnlockMethod, AuthStrategy>();
    private sessionManager?: SessionManager;
    private sessionRestored = false;
    private initializeCachePromise?: Promise<void>;

    // Hold credentials in memory in order to connect to the server after a session
    // restoration is complete.
    private credentialCache: Map<string, string> = new Map();

    // Track the currently active strategy (unlocked)
    private activeStrategy?: AuthStrategy = undefined;

    constructor(config: LncConfig, sessionManager?: SessionManager) {
        this.sessionManager = sessionManager;

        // Register authentication strategies based on configuration
        this.registerStrategies(config);

        // Store the promise so we can wait for it later
        this.initializeCachePromise = this.initializeCache();
    }

    /**
     * Register authentication strategies based on configuration.
     * This replaces the repository switching logic with strategy registration.
     */
    private registerStrategies(config: LncConfig): void {
        const namespace = config.namespace || 'default';

        // Always register password strategy (available in all configurations)
        this.authStrategies.set('password', new PasswordStrategy(namespace));

        // Register passkey strategy if passkeys are enabled
        if (config.allowPasskeys) {
            this.authStrategies.set('passkey', new PasskeyStrategy(namespace));
        }

        // Register session strategy if sessions are available
        if (this.sessionManager) {
            this.authStrategies.set(
                'session',
                new SessionStrategy(this.sessionManager)
            );
        }

        console.log(
            `[UnifiedCredentialStore] Registered strategies: ${Array.from(
                this.authStrategies.keys()
            ).join(', ')}`
        );
    }

    //
    // CredentialStore interface implementation
    //

    get password(): string | undefined {
        // Password is only available during unlock, not stored
        return undefined;
    }

    set password(value: string | undefined) {
        // Password is handled during unlock, not stored directly
    }

    get pairingPhrase(): string {
        return this.credentialCache.get('pairingPhrase') || '';
    }

    set pairingPhrase(value: string) {
        this.credentialCache.set('pairingPhrase', value);
        // Don't save immediately - wait for unlock to establish active strategy
    }

    get serverHost(): string {
        return this.credentialCache.get('serverHost') || '';
    }

    set serverHost(value: string) {
        this.credentialCache.set('serverHost', value);
        // Don't save immediately - wait for unlock to establish active strategy
    }

    get localKey(): string {
        return this.credentialCache.get('localKey') || '';
    }

    set localKey(value: string) {
        this.credentialCache.set('localKey', value);
        // Don't save immediately - wait for unlock to establish active strategy
    }

    get remoteKey(): string {
        return this.credentialCache.get('remoteKey') || '';
    }

    set remoteKey(value: string) {
        this.credentialCache.set('remoteKey', value);
        // Don't save immediately - wait for unlock to establish active strategy
    }

    get isPaired(): boolean {
        const localKey = this.credentialCache.get('localKey');
        const remoteKey = this.credentialCache.get('remoteKey');
        return !!(localKey && remoteKey);
    }

    clear(memoryOnly?: boolean): void {
        this.credentialCache.clear();

        if (!memoryOnly) {
            // Clear all strategies
            Array.from(this.authStrategies.values()).forEach((strategy) => {
                strategy.clear();
            });
        }

        // Reset active strategy
        this.activeStrategy = undefined;
        this.sessionRestored = false;
    }

    //
    // Enhanced authentication methods
    //

    clearSession(): void {
        this.authStrategies.get('session')?.clear();
        this.sessionRestored = false;
        console.log('[UnifiedCredentialStore] Cleared session strategy state');
    }

    /**
     * Check if any strategy is currently unlocked
     */
    isUnlocked(): boolean {
        return !!this.activeStrategy && this.activeStrategy.isUnlocked();
    }

    async unlock(options: UnlockOptions): Promise<boolean> {
        try {
            // Get the appropriate strategy for this unlock method
            const strategy = this.authStrategies.get(options.method);
            if (!strategy) {
                console.error(
                    `[UnifiedCredentialStore] Authentication method '${options.method}' not supported`
                );
                return false;
            }

            // Unlock the strategy
            const success = await strategy.unlock(options);
            if (!success) {
                console.error(
                    `[UnifiedCredentialStore] Failed to unlock with ${options.method}`
                );
                return false;
            }

            // Set this as the active strategy
            this.activeStrategy = strategy;
            console.log(
                `[UnifiedCredentialStore] Successfully unlocked with ${options.method} strategy`
            );

            // Load existing credentials from the strategy's storage
            await this.loadCredentialsFromStrategy(strategy);
            console.log(
                '[UnifiedCredentialStore] loaded credentials from strategy',
                this.credentialCache
            );

            // Persist any cached credentials (from initial connection) to the strategy
            await this.persistCachedCredentials(strategy);

            // If sessions are enabled and we're unlocked, create/update session
            if (this.sessionManager && this.isUnlocked()) {
                await this.createSession();
            }

            return true;
        } catch (error) {
            console.error('[UnifiedCredentialStore] Unlock failed:', error);
            return false;
        }
    }

    async getAuthenticationInfo(): Promise<AuthenticationInfo> {
        // Wait for session restoration to complete before returning auth info
        await this.waitForSessionRestoration();

        // Check if any strategy has stored credentials
        const hasStoredCredentials = Array.from(
            this.authStrategies.values()
        ).some((strategy) => strategy.hasAnyCredentials());

        const sessionStrategy = this.authStrategies.get('session');
        const hasActiveSession = sessionStrategy?.isUnlocked() ?? false;
        const isUnlocked = this.isUnlocked();

        // Check passkey support and availability
        const passkeyStrategy = this.authStrategies.get('passkey');
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
            preferredUnlockMethod: this.getPreferredUnlockMethod()
        };
    }

    getSupportedUnlockMethods(): UnlockMethod[] {
        const methods: UnlockMethod[] = [];

        // Add supported strategies
        Array.from(this.authStrategies.entries()).forEach(
            ([method, strategy]) => {
                if (strategy.isSupported()) {
                    methods.push(method);
                }
            }
        );

        return methods;
    }

    async canAutoRestore(): Promise<boolean> {
        if (this.sessionManager) {
            return this.sessionManager.hasValidSession();
        }
        return false;
    }

    async tryAutoRestore(): Promise<boolean> {
        if (!this.sessionManager || this.sessionRestored) {
            return false;
        }

        const sessionStrategy = this.authStrategies.get('session');
        if (!sessionStrategy) {
            return false;
        }

        try {
            // Use the session strategy to validate and restore
            const restored = await sessionStrategy.unlock({
                method: 'session'
            });
            if (restored) {
                // Get the session data through the strategy
                const session = await this.sessionManager.tryRestore();
                if (session) {
                    this.hydrateFromSession(session);
                    this.sessionRestored = true;
                    // Set the session strategy as active since restoration succeeded
                    this.activeStrategy = sessionStrategy;
                    return true;
                }
            }
        } catch (error) {
            console.error('Auto-restore failed:', error);
        }

        return false;
    }

    /**
     * Wait for session restoration to complete (if sessions are enabled)
     * This is used internally by getAuthenticationInfo to ensure up-to-date state
     */
    private async waitForSessionRestoration(): Promise<void> {
        if (!this.sessionManager || this.sessionRestored) {
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

    //
    // Session management
    //

    async createSession(): Promise<void> {
        if (!this.sessionManager || !this.isUnlocked()) {
            return;
        }

        const credentials: SessionCredentials = {
            localKey: this.localKey,
            remoteKey: this.remoteKey,
            pairingPhrase: this.pairingPhrase,
            serverHost: this.serverHost,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours default
        };

        await this.sessionManager.createSession(credentials);
    }

    async refreshSession(): Promise<boolean> {
        if (!this.sessionManager) {
            return false;
        }

        return this.sessionManager.refreshSession();
    }

    hasActiveSession(): boolean {
        return this.sessionManager?.hasActiveSession() ?? false;
    }

    async getSessionTimeRemaining(): Promise<number> {
        if (!this.sessionManager) {
            return 0;
        }

        return this.sessionManager.getSessionTimeRemaining();
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
     * Persist any cached credentials (from initial connection) to the active strategy.
     * This handles the initial pairing scenario where keys are set before unlock.
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
                        `[UnifiedCredentialStore] Persisted ${key} to ${strategy.method} storage`
                    );
                } catch (error) {
                    console.error(
                        `[UnifiedCredentialStore] Failed to persist ${key}:`,
                        error
                    );
                }
            }
        }
    }

    /**
     * Load credentials from a strategy's storage into the cache.
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
                    `[UnifiedCredentialStore] Failed to load credential ${key}:`,
                    error
                );
            }
        }
        console.log(
            '[UnifiedCredentialStore] loaded credentials from strategy',
            this.activeStrategy?.method,
            this.credentialCache
        );
    }

    private async saveCredentialAsync(
        key: string,
        value: string
    ): Promise<void> {
        if (!this.activeStrategy) {
            return; // No active strategy yet - will be saved when unlocked
        }

        try {
            await this.activeStrategy.setCredential(key, value);
        } catch (error) {
            console.error(`Failed to save credential ${key}:`, error);
        }
    }

    private hydrateFromSession(credentials: SessionCredentials): void {
        this.credentialCache.set('localKey', credentials.localKey);
        this.credentialCache.set('remoteKey', credentials.remoteKey);
        this.credentialCache.set('pairingPhrase', credentials.pairingPhrase);
        this.credentialCache.set('serverHost', credentials.serverHost);
    }

    private getPreferredUnlockMethod(): 'password' | 'passkey' | 'session' {
        if (this.hasActiveSession()) {
            return 'session';
        }

        // Prefer passkey if available and has stored data
        const passkeyStrategy = this.authStrategies.get('passkey');
        if (
            passkeyStrategy?.isSupported() &&
            passkeyStrategy.hasStoredAuthData?.()
        ) {
            return 'passkey';
        }

        return 'password';
    }

    /**
     * Creates a session after connection is confirmed to be working.
     * This saves any credentials received during connection to persistent storage.
     * Should be called after successful connection, not during credential setting.
     */
    async createSessionAfterConnection(): Promise<void> {
        console.log(
            '[UnifiedCredentialStore] Creating session after connection...'
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
                    `[UnifiedCredentialStore] Saving ${key} to repository...`
                );
                await this.saveCredentialAsync(key, value);
            }
        }

        // Create a session with the current credentials
        if (this.sessionManager) {
            console.log('[UnifiedCredentialStore] Creating session...');
            await this.createSession();
        }

        console.log(
            '[UnifiedCredentialStore] Session creation after connection complete'
        );
    }
}
