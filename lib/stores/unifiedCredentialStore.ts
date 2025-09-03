import SessionManager from '../sessions/sessionManager';
import { SessionCredentials } from '../sessions/types';
import {
  CredentialStore,
  LncConfig,
  UnlockMethod,
  UnlockOptions,
} from '../types/lnc';
import { AuthenticationCoordinator } from './authenticationCoordinator';
import { CredentialCache } from './credentialCache';
import { SessionCoordinator } from './sessionCoordinator';
import { StrategyManager } from './strategyManager';

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
 * Now uses composition with specialized coordinator classes for better separation of concerns.
 */
export default class UnifiedCredentialStore implements CredentialStore {
    private strategyManager: StrategyManager;
    private credentialCache: CredentialCache;
    private sessionCoordinator: SessionCoordinator;
    private authCoordinator: AuthenticationCoordinator;

    constructor(config: LncConfig, sessionManager?: SessionManager) {
        // Create specialized coordinators for different responsibilities
        this.strategyManager = new StrategyManager(config, sessionManager);
        this.credentialCache = new CredentialCache();
        this.sessionCoordinator = new SessionCoordinator(sessionManager);
        this.authCoordinator = new AuthenticationCoordinator(
            this.strategyManager,
            this.credentialCache,
            this.sessionCoordinator
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
        return this.strategyManager.hasAnyCredentials();
    }

    clear(memoryOnly?: boolean): void {
        this.credentialCache.clear();

        if (!memoryOnly) {
            // Clear all strategies
            this.strategyManager.clearAll();
        }

        // Reset authentication state
        this.authCoordinator.clearSession();
    }

    //
    // Enhanced authentication methods
    //

    clearSession(): void {
        this.authCoordinator.clearSession();
    }

    /**
     * Check if any strategy is currently unlocked
     */
    isUnlocked(): boolean {
        return this.authCoordinator.isUnlocked();
    }

    async unlock(options: UnlockOptions): Promise<boolean> {
        return this.authCoordinator.unlock(options);
    }

    async getAuthenticationInfo(): Promise<AuthenticationInfo> {
        return this.authCoordinator.getAuthenticationInfo();
    }

    getSupportedUnlockMethods(): UnlockMethod[] {
        return this.strategyManager.getSupportedMethods();
    }

    async canAutoRestore(): Promise<boolean> {
        return this.sessionCoordinator.canAutoRestore();
    }

    async tryAutoRestore(): Promise<boolean> {
        return this.authCoordinator.tryAutoRestore();
    }

    //
    // Session management
    //

    async createSession(): Promise<void> {
        if (!this.isUnlocked()) {
            return;
        }

        const credentials: SessionCredentials = {
            localKey: this.localKey,
            remoteKey: this.remoteKey,
            pairingPhrase: this.pairingPhrase,
            serverHost: this.serverHost,
            expiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours default
        };

        await this.sessionCoordinator.createSession(credentials);
    }

    async refreshSession(): Promise<boolean> {
        return this.sessionCoordinator.refreshSession();
    }

    hasActiveSession(): boolean {
        return this.sessionCoordinator.hasActiveSession();
    }

    async getSessionTimeRemaining(): Promise<number> {
        return this.sessionCoordinator.getTimeRemaining();
    }

    /**
     * Creates a session after connection is confirmed to be working.
     * This saves any credentials received during connection to persistent storage.
     * Should be called after successful connection, not during credential setting.
     */
    async createSessionAfterConnection(): Promise<void> {
        await this.authCoordinator.createSessionAfterConnection();
    }

    //
    // Session refresh management
    //

    /**
     * Check if automatic session refresh is currently active
     */
    isAutoRefreshActive(): boolean {
        return this.sessionCoordinator.isAutoRefreshActive();
    }

    /**
     * Get time since last user activity (for monitoring purposes)
     */
    getTimeSinceLastActivity(): number {
        const refreshManager = this.sessionCoordinator.getRefreshManager();
        return refreshManager?.getTimeSinceLastActivity() ?? 0;
    }

    /**
     * Manually record user activity (useful for custom activity tracking)
     */
    recordActivity(): void {
        const refreshManager = this.sessionCoordinator.getRefreshManager();
        refreshManager?.recordActivity();
    }
}
