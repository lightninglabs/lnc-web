import UnifiedCredentialStore, {
  AuthenticationInfo
} from './stores/unifiedCredentialStore';
import { CredentialStore, LncConfig, UnlockOptions } from './types/lnc';
import LncCredentialStore from './util/credentialStore';
import { log } from './util/log';

/**
 * Orchestrates credential management and authentication operations.
 * Handles credential store creation, authentication, and persistence.
 *
 * This is a minimal implementation for password authentication.
 * Session and passkey support will be added in PR 9.
 */
export class CredentialOrchestrator {
  private currentCredentialStore: CredentialStore;

  constructor(config: LncConfig) {
    this.currentCredentialStore = this.createCredentialStore(config);
  }

  /**
   * Get the credential store (for public access via LNC getter)
   */
  getCredentialStore(): CredentialStore {
    return this.currentCredentialStore;
  }

  /**
   * Create the appropriate credential store based on configuration
   */
  private createCredentialStore(config: LncConfig): CredentialStore {
    // If credential store is explicitly provided, use it
    if (config.credentialStore) {
      log.info(
        '[CredentialOrchestrator] Using custom credential store from config'
      );
      return config.credentialStore;
    }

    // Use UnifiedCredentialStore when explicitly requested
    // (Later PRs will add: || config.enableSessions || config.allowPasskeys)
    if (config.useUnifiedStore) {
      return this.createUnifiedStore(config);
    }

    // Use legacy credential store for basic functionality (default)
    return this.createLegacyStore(config);
  }

  /**
   * Create a UnifiedCredentialStore
   */
  private createUnifiedStore(config: LncConfig): UnifiedCredentialStore {
    log.info('[CredentialOrchestrator] Creating UnifiedCredentialStore');

    const store = new UnifiedCredentialStore(config);

    // Set initial values from config
    if (!store.isPaired && config.serverHost) {
      store.serverHost = config.serverHost;
    }
    if (config.pairingPhrase) {
      store.pairingPhrase = config.pairingPhrase;
    }

    return store;
  }

  /**
   * Create a legacy LncCredentialStore
   */
  private createLegacyStore(config: LncConfig): LncCredentialStore {
    log.info('[CredentialOrchestrator] Creating legacy LncCredentialStore');

    const store = new LncCredentialStore(
      config.namespace || 'default',
      config.password
    );

    // Don't overwrite an existing serverHost if we're already paired
    if (!store.isPaired && config.serverHost) {
      store.serverHost = config.serverHost;
    }
    if (config.pairingPhrase) {
      store.pairingPhrase = config.pairingPhrase;
    }

    return store;
  }

  /**
   * Unlock the credential store using the specified method
   */
  async unlock(options: UnlockOptions): Promise<boolean> {
    const unifiedStore = this.getUnifiedStore();
    if (unifiedStore) {
      return await unifiedStore.unlock(options);
    }

    // Legacy fallback: just set password (it auto-persists)
    if (options.method === 'password' && options.password) {
      try {
        this.currentCredentialStore.password = options.password;
        return true;
      } catch (error) {
        log.error('[CredentialOrchestrator] Legacy unlock failed:', error);
        return false;
      }
    }
    log.warn(
      '[CredentialOrchestrator] Legacy unlock failed: missing or empty password for method "password".'
    );
    return false;
  }

  /**
   * Persist credentials with password encryption
   * This is the main method to save credentials after a successful connection.
   */
  async persistWithPassword(password: string): Promise<void> {
    const unifiedStore = this.getUnifiedStore();

    if (unifiedStore) {
      // UnifiedCredentialStore: unlock then persist
      const unlocked = await unifiedStore.unlock({
        method: 'password',
        password
      });

      if (!unlocked) {
        const authInfo = await unifiedStore.getAuthenticationInfo();
        throw new Error(
          `Failed to unlock credentials with password. ` +
            `Authentication state: isUnlocked=${authInfo.isUnlocked}, ` +
            `hasStoredCredentials=${authInfo.hasStoredCredentials}, ` +
            `preferredUnlockMethod=${authInfo.preferredUnlockMethod}`
        );
      }

      await unifiedStore.persistCredentials();
      log.info(
        '[CredentialOrchestrator] Credentials persisted with UnifiedCredentialStore'
      );
    } else {
      // Legacy: just set password (it auto-persists)
      this.currentCredentialStore.password = password;
      log.info(
        '[CredentialOrchestrator] Credentials persisted with legacy store'
      );
    }
  }

  /**
   * Get authentication information
   */
  async getAuthenticationInfo(): Promise<AuthenticationInfo> {
    const unifiedStore = this.getUnifiedStore();
    if (unifiedStore) {
      return await unifiedStore.getAuthenticationInfo();
    }

    // Fallback for legacy credential store
    return {
      isUnlocked: !!this.currentCredentialStore.password,
      hasStoredCredentials: this.currentCredentialStore.isPaired,
      preferredUnlockMethod: 'password' as const
    };
  }

  /**
   * Check if credentials are unlocked
   */
  get isUnlocked(): boolean {
    const unifiedStore = this.getUnifiedStore();
    if (unifiedStore) {
      return unifiedStore.isUnlocked();
    }
    // Legacy: check if password is set
    return !!this.currentCredentialStore.password;
  }

  /**
   * Check if credentials are paired
   */
  get isPaired(): boolean {
    return this.currentCredentialStore.isPaired;
  }

  /**
   * Clear stored credentials
   */
  clear(memoryOnly?: boolean): void {
    this.currentCredentialStore.clear(memoryOnly);
    log.info('[CredentialOrchestrator] Credentials cleared', { memoryOnly });
  }

  /**
   * Get the unified store if available
   */
  private getUnifiedStore(): UnifiedCredentialStore | undefined {
    return this.currentCredentialStore instanceof UnifiedCredentialStore
      ? this.currentCredentialStore
      : undefined;
  }
}
