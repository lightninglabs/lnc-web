import {
  CredentialStore,
  LncConfig,
  UnlockMethod,
  UnlockOptions
} from '../types/lnc';
import { log } from '../util/log';
import { AuthStrategy } from './authStrategy';
import { CredentialCache } from './credentialCache';
import { StrategyManager } from './strategyManager';

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
 * Authentication information returned by getAuthenticationInfo()
 */
export interface AuthenticationInfo {
  isUnlocked: boolean;
  hasStoredCredentials: boolean;
  supportsPasskeys: boolean;
  hasPasskey: boolean;
  preferredUnlockMethod: UnlockMethod;
}

/**
 * Unified credential store that uses the strategy pattern for authentication.
 * Maintains the same CredentialStore interface for backward compatibility.
 */
export default class UnifiedCredentialStore implements CredentialStore {
  private strategyManager: StrategyManager;
  private credentialCache: CredentialCache;

  // These two fields are temporary and will be removed in a future PR when Passkeys are
  // implemented. They are used to track the current unlock method and whether the store
  // is unlocked for the demo application to work.
  private _isUnlocked = false;
  private activeMethod?: UnlockMethod;

  constructor(config: LncConfig) {
    this.strategyManager = new StrategyManager(config);
    this.credentialCache = new CredentialCache();

    log.info('[UnifiedCredentialStore] Initialized with strategy manager');
  }

  //
  // CredentialStore interface implementation.
  // We must maintain the same interface as the old LncCredentialStore for backward
  // compatibility since this class will replace the old one and we do not want to break
  // existing consumers code.
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
  }

  get serverHost(): string {
    return this.credentialCache.get('serverHost') || '';
  }

  set serverHost(value: string) {
    this.credentialCache.set('serverHost', value);
  }

  get localKey(): string {
    return this.credentialCache.get('localKey') || '';
  }

  set localKey(value: string) {
    this.credentialCache.set('localKey', value);
  }

  get remoteKey(): string {
    return this.credentialCache.get('remoteKey') || '';
  }

  set remoteKey(value: string) {
    this.credentialCache.set('remoteKey', value);
  }

  get isPaired(): boolean {
    return this.strategyManager.hasAnyCredentials;
  }

  clear(memoryOnly?: boolean): void {
    this.credentialCache.clear();
    this._isUnlocked = false;
    this.activeMethod = undefined;

    if (!memoryOnly) {
      this.strategyManager.clearAll();
    }

    log.info('[UnifiedCredentialStore] Cleared', { memoryOnly });
  }

  //
  // Enhanced authentication methods which are not part of the CredentialStore interface.
  // The getters/functions above are maintained for backward compatibility with the old
  // LncCredentialStore.
  //

  /**
   * Check if any strategy is currently unlocked
   */
  get isUnlocked(): boolean {
    return this._isUnlocked;
  }

  /**
   * Unlock the credential store using the specified method
   */
  async unlock(options: UnlockOptions): Promise<boolean> {
    const strategy = this.strategyManager.getStrategy(options.method);

    if (!strategy) {
      log.error(
        `[UnifiedCredentialStore] Unknown unlock method: ${options.method}`
      );
      return false;
    }

    if (!strategy.isSupported) {
      log.error(
        `[UnifiedCredentialStore] Unlock method not supported: ${options.method}`
      );
      return false;
    }

    try {
      const success = await strategy.unlock(options);

      if (success) {
        this._isUnlocked = true;
        this.activeMethod = options.method;

        // Load credentials from strategy into cache
        await this.loadCredentialsToCache(strategy);

        log.info('[UnifiedCredentialStore] Unlocked successfully', {
          method: options.method
        });
      }

      return success;
    } catch (error) {
      log.error('[UnifiedCredentialStore] Unlock failed:', error);
      return false;
    }
  }

  /**
   * Get authentication information
   */
  async getAuthenticationInfo(): Promise<AuthenticationInfo> {
    const passkeyStrategy = this.strategyManager.getStrategy('passkey');
    const supportsPasskeys = passkeyStrategy?.isSupported ?? false;
    const hasPasskey = passkeyStrategy?.hasStoredAuthData?.() ?? false;

    return {
      isUnlocked: this._isUnlocked,
      hasStoredCredentials: this.strategyManager.hasAnyCredentials,
      supportsPasskeys,
      hasPasskey,
      preferredUnlockMethod: this.strategyManager.preferredMethod
    };
  }

  /**
   * Get supported unlock methods
   */
  get supportedUnlockMethods(): UnlockMethod[] {
    return this.strategyManager.supportedMethods;
  }

  /**
   * Persist current credentials using the active strategy.
   * Should be called after successful connection to save credentials.
   */
  async persistCredentials(): Promise<void> {
    if (!this._isUnlocked || !this.activeMethod) {
      log.warn(
        '[UnifiedCredentialStore] Cannot persist credentials - not unlocked'
      );
      return;
    }

    const strategy = this.strategyManager.getStrategy(this.activeMethod);
    if (!strategy) {
      log.error('[UnifiedCredentialStore] Active strategy not found');
      return;
    }

    try {
      // Persist all cached credentials to the active strategy
      for (const key of KEYS_TO_PERSIST) {
        const value = this.credentialCache.get(key);
        if (value) {
          await strategy.setCredential(key, value);
        } else {
          log.warn(
            `[UnifiedCredentialStore] Credential ${key} not found in cache`
          );
        }
      }

      log.info('[UnifiedCredentialStore] Credentials persisted', {
        method: this.activeMethod
      });
    } catch (error) {
      log.error(
        '[UnifiedCredentialStore] Failed to persist credentials:',
        error
      );
      throw error;
    }
  }

  //
  // Internal methods
  //

  /**
   * Load credentials from the strategy into the cache
   */
  private async loadCredentialsToCache(strategy: AuthStrategy): Promise<void> {
    for (const key of KEYS_TO_PERSIST) {
      const value = await strategy.getCredential(key);
      if (value) {
        this.credentialCache.set(key, value);
      }
    }

    log.info('[UnifiedCredentialStore] Credentials loaded to cache');
  }
}
