import {
  AuthenticationInfo,
  CredentialStore,
  UnlockOptions
} from '../types/lnc';
import { createLogger } from '../util/log';
import { AuthStrategy } from './authStrategy';
import { CredentialCache } from './credentialCache';
import { SessionCoordinator } from './sessionCoordinator';
import { StrategyManager } from './strategyManager';

const log = createLogger('AuthenticationCoordinator');

/**
 * The keys that will be persisted to the credential store.
 */
const KEYS_TO_PERSIST: (keyof CredentialStore)[] = [
  'localKey',
  'remoteKey',
  'pairingPhrase',
  'serverHost'
];

/**
 * Coordinates authentication operations across strategies, cache, and sessions.
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
    this.initializeCachePromise = this.initializeCache();
  }

  /**
   * Check if the credential store is currently unlocked
   */
  get isUnlocked(): boolean {
    return !!this.activeStrategy && this.activeStrategy.isUnlocked;
  }

  /**
   * Get the active strategy used for authentication
   */
  getActiveStrategy(): AuthStrategy | undefined {
    return this.activeStrategy;
  }

  /**
   * Clear the auth state
   */
  clearSession(): void {
    this.credentialCache.clear();
    this.sessionCoordinator.clearSession();
    this.sessionRestored = false;
    this.activeStrategy = undefined;
    log.info('Cleared session state');
  }

  /**
   * Unlock the credential store using the specified method
   */
  async unlock(options: UnlockOptions): Promise<boolean> {
    try {
      const strategy = this.strategyManager.getStrategy(options.method);
      if (!strategy) {
        log.error(`Authentication method '${options.method}' not supported`);
        return false;
      }

      const success = await strategy.unlock(options);
      if (!success) {
        log.error(`Failed to unlock with ${options.method}`);
        return false;
      }

      this.activeStrategy = strategy;

      await this.loadCredentialsFromStrategy(strategy);
      await this.persistCachedCredentials(strategy);

      await this.tryCreateSession(strategy);

      return true;
    } catch (error) {
      log.error('Unlock failed:', error);
      return false;
    }
  }

  /**
   * Get authentication information based on the current state of the credential store
   */
  async getAuthenticationInfo(): Promise<AuthenticationInfo> {
    await this.waitForSessionRestoration();

    const hasStoredCredentials = this.strategyManager.hasAnyCredentials;
    const hasActiveSession = this.sessionCoordinator.hasActiveSession;
    const sessionTimeRemaining =
      await this.sessionCoordinator.getTimeRemaining();

    const passkeyStrategy = this.strategyManager.getStrategy('passkey');
    const supportsPasskeys = !!passkeyStrategy && passkeyStrategy.isSupported;
    const hasPasskey =
      supportsPasskeys && passkeyStrategy?.hasStoredAuthData?.() === true;

    return {
      isUnlocked: this.isUnlocked,
      hasStoredCredentials,
      hasActiveSession,
      sessionTimeRemaining,
      supportsPasskeys,
      hasPasskey,
      preferredUnlockMethod: this.strategyManager.preferredMethod
    };
  }

  /**
   * Try to automatically restore the credential store from the session.
   * Delegates the actual restore to SessionCoordinator which performs a
   * single restoreSession call and starts the refresh manager on success.
   */
  async tryAutoRestore(): Promise<boolean> {
    if (!this.sessionCoordinator.isSessionAvailable || this.sessionRestored) {
      return false;
    }

    const sessionStrategy = this.strategyManager.getStrategy('session');
    if (!sessionStrategy) {
      return false;
    }

    try {
      // Delegate the restore to SessionCoordinator, which calls
      // restoreSession exactly once and starts the refresh manager.
      const credentials = await this.sessionCoordinator.tryAutoRestore();
      if (!credentials) {
        return false;
      }

      this.credentialCache.hydrateFromSession(credentials);
      this.sessionRestored = true;
      this.activeStrategy = sessionStrategy;

      return true;
    } catch (error) {
      log.error('Auto-restore failed:', error);
    }

    return false;
  }

  /**
   * Create a new session after a connection is established
   */
  async createSessionAfterConnection(): Promise<void> {
    for (const key of KEYS_TO_PERSIST) {
      const value = this.credentialCache.get(key);
      if (value) {
        await this.saveCredentialToStrategy(key, value);
      }
    }

    // if sessions are enabled, create a new session
    if (this.sessionCoordinator.isSessionAvailable) {
      await this.sessionCoordinator.createSession({
        localKey: this.getCachedCredential('localKey'),
        remoteKey: this.getCachedCredential('remoteKey'),
        pairingPhrase: this.getCachedCredential('pairingPhrase'),
        serverHost: this.getCachedCredential('serverHost')
      });
    }
  }

  /**
   * Best-effort session creation after a successful unlock. Session creation
   * is an optimization layer (enables auto-refresh and tab-resume) rather
   * than a prerequisite for authentication, so failures are logged but do not
   * propagate to the caller.
   */
  private async tryCreateSession(strategy: AuthStrategy): Promise<void> {
    if (
      !this.sessionCoordinator.isSessionAvailable ||
      strategy.method === 'session' ||
      !this.isUnlocked
    ) {
      return;
    }

    try {
      await this.sessionCoordinator.createSession({
        localKey: this.getCachedCredential('localKey'),
        remoteKey: this.getCachedCredential('remoteKey'),
        pairingPhrase: this.getCachedCredential('pairingPhrase'),
        serverHost: this.getCachedCredential('serverHost')
      });
    } catch (error) {
      log.error(
        'Session creation failed after ' +
          'successful unlock; session-based refresh will be unavailable:',
        error
      );
    }
  }

  /**
   * Get the cached credential
   */
  private getCachedCredential(key: string): string {
    return this.credentialCache.get(key) || '';
  }

  /**
   * Initialize the credential cache
   */
  private async initializeCache(): Promise<void> {
    await this.tryAutoRestore();

    if (!this.sessionRestored && this.activeStrategy) {
      await this.loadCredentialsFromStrategy(this.activeStrategy);
    }
  }

  /**
   * Wait for the session to be restored
   */
  private async waitForSessionRestoration(): Promise<void> {
    if (!this.sessionCoordinator.isSessionAvailable || this.sessionRestored) {
      return;
    }

    if (this.initializeCachePromise) {
      await this.initializeCachePromise;
    } else {
      await this.tryAutoRestore();
    }
  }

  /**
   * Persist the cached credentials to the strategy. Attempts all keys even if
   * some fail, then throws an aggregate error if any persistence failed so the
   * caller can handle partial persistence appropriately.
   */
  private async persistCachedCredentials(
    strategy: AuthStrategy
  ): Promise<void> {
    if (strategy.method === 'session') {
      return;
    }

    const failures: string[] = [];

    for (const key of KEYS_TO_PERSIST) {
      const value = this.credentialCache.get(key);
      if (value) {
        try {
          await strategy.setCredential(key, value);
        } catch (error) {
          log.error(`Failed to persist ${key}:`, error);
          failures.push(key);
        }
      }
    }

    if (failures.length > 0) {
      throw new Error(`Failed to persist credentials: ${failures.join(', ')}`);
    }
  }

  /**
   * Load the credentials from the strategy
   */
  private async loadCredentialsFromStrategy(
    strategy: AuthStrategy
  ): Promise<void> {
    for (const key of KEYS_TO_PERSIST) {
      try {
        const value = await strategy.getCredential(key);
        if (value) {
          this.credentialCache.set(key, value);
        }
      } catch (error) {
        log.error(`Failed to load credential ${key}:`, error);
      }
    }
  }

  /**
   * Save the credential to the strategy
   */
  private async saveCredentialToStrategy(
    key: string,
    value: string
  ): Promise<void> {
    if (!this.activeStrategy || this.activeStrategy.method === 'session') {
      return;
    }

    try {
      await this.activeStrategy.setCredential(key, value);
    } catch (error) {
      log.error(`Failed to save credential ${key}:`, error);
      throw error;
    }
  }
}
