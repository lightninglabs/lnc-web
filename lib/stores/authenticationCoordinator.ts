import {
  AuthenticationInfo,
  CredentialStore,
  UnlockOptions
} from '../types/lnc';
import { log } from '../util/log';
import { AuthStrategy } from './authStrategy';
import { CredentialCache } from './credentialCache';
import { SessionCoordinator } from './sessionCoordinator';
import { StrategyManager } from './strategyManager';

/**
 * Default session duration in milliseconds (24 hours)
 */
export const DEFAULT_SESSION_DURATION = 24 * 60 * 60 * 1000;

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
    log.info('[AuthenticationCoordinator] Cleared session state');
  }

  /**
   * Unlock the credential store using the specified method
   */
  async unlock(options: UnlockOptions): Promise<boolean> {
    try {
      // Get the appropriate strategy for this unlock method
      const strategy = this.strategyManager.getStrategy(options.method);
      if (!strategy) {
        log.error(
          `[AuthenticationCoordinator] Authentication method '${options.method}' not supported`
        );
        return false;
      }

      // Unlock the strategy
      const success = await strategy.unlock(options);
      if (!success) {
        log.error(
          `[AuthenticationCoordinator] Failed to unlock with ${options.method}`
        );
        return false;
      }

      // Set this as the active strategy
      this.activeStrategy = strategy;
      log.info(
        `[AuthenticationCoordinator] Successfully unlocked with ${options.method} strategy`
      );

      // Load existing credentials from the strategy's storage
      await this.loadCredentialsFromStrategy(strategy);
      log.info(
        '[AuthenticationCoordinator] loaded credentials from strategy',
        this.credentialCache.snapshot()
      );

      // Persist any cached credentials (from initial connection) to the strategy
      await this.persistCachedCredentials(strategy);

      if (
        this.sessionCoordinator.isSessionAvailable &&
        strategy.method !== 'session' &&
        this.isUnlocked
      ) {
        await this.sessionCoordinator.createSession({
          localKey: this.getCachedCredential('localKey'),
          remoteKey: this.getCachedCredential('remoteKey'),
          pairingPhrase: this.getCachedCredential('pairingPhrase'),
          serverHost: this.getCachedCredential('serverHost')
        });
      }

      return true;
    } catch (error) {
      log.error('[AuthenticationCoordinator] Unlock failed:', error);
      return false;
    }
  }

  /**
   * Get authentication information
   */
  async getAuthenticationInfo(): Promise<AuthenticationInfo> {
    // Wait for session restoration to complete before returning auth info
    await this.waitForSessionRestoration();

    // Check if any strategy has stored credentials
    const hasStoredCredentials = this.strategyManager.hasAnyCredentials;

    const sessionStrategy = this.strategyManager.getStrategy('session');
    const hasActiveSession = sessionStrategy?.isUnlocked ?? false;
    const isUnlocked = this.isUnlocked;

    // Check passkey support and availability
    const passkeyStrategy = this.strategyManager.getStrategy('passkey');
    const supportsPasskeys = !!passkeyStrategy && passkeyStrategy.isSupported;
    const hasPasskey =
      supportsPasskeys && passkeyStrategy?.hasStoredAuthData?.() === true;

    return {
      isUnlocked,
      hasStoredCredentials,
      hasActiveSession,
      supportsPasskeys,
      hasPasskey,
      preferredUnlockMethod: this.strategyManager.preferredMethod
    };
  }

  /**
   * Try to automatically restore the credential store from the session
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
      // Use the session strategy to validate and restore
      const restored = await sessionStrategy.unlock({
        method: 'session'
      });
      if (restored) {
        // Get the session data through the coordinator
        const sessionCredentials = await this.sessionCoordinator
          .getSessionManager()
          ?.restoreSession();
        if (sessionCredentials) {
          this.credentialCache.hydrateFromSession(sessionCredentials);
          this.sessionRestored = true;
          // Set the session strategy as active since restoration succeeded
          this.activeStrategy = sessionStrategy;
          return true;
        }
      }
    } catch (error) {
      log.error('[AuthenticationCoordinator] Auto-restore failed:', error);
    }

    return false;
  }

  /**
   * Create session after successful connection
   */
  async createSessionAfterConnection(): Promise<void> {
    log.info(
      '[AuthenticationCoordinator] Creating session after connection...'
    );

    // Save any credentials that were received during connection
    for (const key of KEYS_TO_PERSIST) {
      const value = this.credentialCache.get(key);
      if (value) {
        log.info(`[AuthenticationCoordinator] Saving ${key} to strategy...`);
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

    log.info(
      '[AuthenticationCoordinator] Session creation after connection complete'
    );
  }

  /**
   * Get the cached credential
   */
  private getCachedCredential(key: string): string {
    return this.credentialCache.get(key) || '';
  }

  //
  // Private methods
  //

  /**
   * Initialize the credential cache
   */
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
    if (!this.sessionCoordinator.isSessionAvailable || this.sessionRestored) {
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
   * Persist the cached credentials to the strategy
   */
  private async persistCachedCredentials(
    strategy: AuthStrategy
  ): Promise<void> {
    if (strategy.method === 'session') {
      return;
    }

    for (const key of KEYS_TO_PERSIST) {
      const value = this.credentialCache.get(key);
      if (value) {
        try {
          await strategy.setCredential(key, value);
          log.info(
            `[AuthenticationCoordinator] Persisted ${key} to ${strategy.method} storage`
          );
        } catch (error) {
          log.error(
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
    for (const key of KEYS_TO_PERSIST) {
      try {
        const value = await strategy.getCredential(key);
        if (value) {
          this.credentialCache.set(key, value);
        }
      } catch (error) {
        log.error(
          `[AuthenticationCoordinator] Failed to load credential ${key}:`,
          error
        );
      }
    }
    log.info(
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
      log.error(
        `[AuthenticationCoordinator] Failed to save credential ${key}:`,
        error
      );
      throw error;
    }
  }
}
