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
    log.info('[AuthenticationCoordinator] Cleared session state');
  }

  /**
   * Unlock the credential store using the specified method
   */
  async unlock(options: UnlockOptions): Promise<boolean> {
    try {
      const strategy = this.strategyManager.getStrategy(options.method);
      if (!strategy) {
        log.error(
          `[AuthenticationCoordinator] Authentication method '${options.method}' not supported`
        );
        return false;
      }

      const success = await strategy.unlock(options);
      if (!success) {
        log.error(
          `[AuthenticationCoordinator] Failed to unlock with ${options.method}`
        );
        return false;
      }

      this.activeStrategy = strategy;

      await this.loadCredentialsFromStrategy(strategy);
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
      const restored = await sessionStrategy.unlock({ method: 'session' });
      if (!restored) {
        return false;
      }

      const sessionCredentials = await this.sessionCoordinator
        .getSessionManager()
        ?.restoreSession();

      if (sessionCredentials) {
        this.credentialCache.hydrateFromSession(sessionCredentials);
        this.sessionRestored = true;
        this.activeStrategy = sessionStrategy;
        return true;
      }
    } catch (error) {
      log.error('[AuthenticationCoordinator] Auto-restore failed:', error);
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
        log.error(
          `[AuthenticationCoordinator] Failed to load credential ${key}:`,
          error
        );
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
      log.error(
        `[AuthenticationCoordinator] Failed to save credential ${key}:`,
        error
      );
      throw error;
    }
  }
}
