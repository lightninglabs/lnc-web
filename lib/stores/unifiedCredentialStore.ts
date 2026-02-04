import SessionManager from '../sessions/sessionManager';
import { SessionCredentials } from '../sessions/types';
import {
  AuthenticationInfo,
  CredentialStore,
  LncConfig,
  UnlockMethod,
  UnlockOptions
} from '../types/lnc';
import { log } from '../util/log';
import { AuthenticationCoordinator } from './authenticationCoordinator';
import { CredentialCache } from './credentialCache';
import { SessionCoordinator } from './sessionCoordinator';
import { StrategyManager } from './strategyManager';

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
    // Password is only available during unlock, not stored. This field is required by
    // the CredentialStore interface.
    log.warn(
      '[UnifiedCredentialStore] Direct access to password is not supported. Use the unlock method instead.'
    );
    return undefined;
  }

  set password(_value: string | undefined) {
    // Password is handled during unlock, not stored directly. This field is required by
    // the CredentialStore interface.
    log.warn(
      '[UnifiedCredentialStore] Setting password directly is not supported. Use the unlock method instead.'
    );
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
    return this.strategyManager.hasAnyCredentials;
  }

  clear(memoryOnly?: boolean): void {
    this.credentialCache.clear();

    if (!memoryOnly) {
      // Clear all strategies
      this.strategyManager.clearAll();
    }

    // Reset authentication/session state
    this.authCoordinator.clearSession();
  }

  //
  // Enhanced authentication methods
  //

  clearSession(): void {
    // Ensure in-memory credential cache is cleared on session clear/logout.
    this.credentialCache.clear();
    this.authCoordinator.clearSession();
  }

  /**
   * Check if any strategy is currently unlocked
   */
  get isUnlocked(): boolean {
    return this.authCoordinator.isUnlocked;
  }

  /**
   * Get supported unlock methods
   */
  get supportedUnlockMethods(): UnlockMethod[] {
    return this.strategyManager.supportedMethods;
  }

  /**
   * Unlock the credential store using the specified method
   */
  async unlock(options: UnlockOptions): Promise<boolean> {
    return this.authCoordinator.unlock(options);
  }

  /**
   * Get authentication information based on the current state of the credential store
   */
  async getAuthenticationInfo(): Promise<AuthenticationInfo> {
    return this.authCoordinator.getAuthenticationInfo();
  }

  /**
   * Check if the session can be automatically restored
   */
  async canAutoRestore(): Promise<boolean> {
    return this.sessionCoordinator.canAutoRestore();
  }

  /**
   * Try to automatically restore the credential store
   */
  async tryAutoRestore(): Promise<boolean> {
    return this.authCoordinator.tryAutoRestore();
  }

  //
  // Session management
  //

  /**
   * Check if there is an active session
   */
  get hasActiveSession(): boolean {
    return this.sessionCoordinator.hasActiveSession;
  }

  /**
   * Create a new session
   */
  async createSession(): Promise<void> {
    if (!this.isUnlocked) {
      log.warn('[UnifiedCredentialStore] Cannot create session - not unlocked');
      return;
    }

    const credentials: SessionCredentials = {
      localKey: this.localKey,
      remoteKey: this.remoteKey,
      pairingPhrase: this.pairingPhrase,
      serverHost: this.serverHost
    };

    await this.sessionCoordinator.createSession(credentials);
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<boolean> {
    return this.sessionCoordinator.refreshSession();
  }

  /**
   * Get the time remaining until the session expires
   */
  async getSessionTimeRemaining(): Promise<number> {
    return this.sessionCoordinator.getTimeRemaining();
  }

  /**
   * Create a session after connection is confirmed to be working.
   * This saves any credentials received during connection to persistent storage.
   */
  async createSessionAfterConnection(): Promise<void> {
    await this.authCoordinator.createSessionAfterConnection();
  }
}
