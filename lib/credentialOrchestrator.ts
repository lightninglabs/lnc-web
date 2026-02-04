import { PasskeyEncryptionService } from './encryption/passkeyEncryptionService';
import SessionManager from './sessions/sessionManager';
import { DEFAULT_SESSION_DURATION } from './stores/authenticationCoordinator';
import UnifiedCredentialStore from './stores/unifiedCredentialStore';
import {
  ClearOptions,
  CredentialStore,
  LncConfig,
  SessionConfig,
  UnlockOptions
} from './types/lnc';
import LncCredentialStore from './util/credentialStore';
import { log } from './util/log';

/**
 * Orchestrates credential management and authentication operations.
 * Handles credential store creation, authentication, and persistence.
 */
export class CredentialOrchestrator {
  private currentCredentialStore: CredentialStore;

  constructor(config: LncConfig) {
    this.currentCredentialStore = this.createCredentialStore(config);
  }

  /**
   * Get the credential store (for public access via LNC getter)
   */
  get credentialStore(): CredentialStore {
    return this.currentCredentialStore;
  }

  /**
   * Check if credentials are unlocked
   */
  get isUnlocked(): boolean {
    const unifiedStore = this.getUnifiedStore();
    if (unifiedStore) {
      return unifiedStore.isUnlocked;
    }
    // Fallback: check if password is set (legacy credential store)
    return !!this.currentCredentialStore.password;
  }

  /**
   * Check if credentials are paired
   */
  get isPaired(): boolean {
    return this.currentCredentialStore.isPaired;
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

    // Use UnifiedCredentialStore for advanced features
    if (config.enableSessions || config.allowPasskeys) {
      return this.createUnifiedStore(config);
    }

    // Use legacy credential store for basic functionality
    return this.createLegacyStore(config);
  }

  /**
   * Create a UnifiedCredentialStore with session management
   */
  private createUnifiedStore(config: LncConfig): UnifiedCredentialStore {
    // Create session manager if sessions are enabled
    let sessionManager: SessionManager | undefined;
    if (config.enableSessions) {
      const namespace = config.namespace || 'default';
      const duration = config.sessionDuration ?? DEFAULT_SESSION_DURATION;

      const sessionConfig: SessionConfig = {
        sessionDuration: duration,
        enableActivityRefresh: true,
        activityThreshold: 30,
        activityThrottleInterval: 30,
        refreshTrigger: 4,
        refreshCheckInterval: 5,
        pauseOnHidden: true,
        maxRefreshes: 10,
        maxSessionAge: 7 * 24 * 60 * 60 * 1000
      };

      sessionManager = new SessionManager(namespace, sessionConfig);
    }

    const store = new UnifiedCredentialStore(config, sessionManager);

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
   * Perform auto-login if possible
   */
  async performAutoLogin(): Promise<boolean> {
    const unifiedStore = this.getUnifiedStore();
    if (unifiedStore) {
      return (
        (await unifiedStore.canAutoRestore()) &&
        (await unifiedStore.tryAutoRestore())
      );
    }
    return false;
  }

  /**
   * Clear stored credentials
   */
  clear(options?: ClearOptions): void {
    const { session = true, persisted = false } = options || {};
    const unifiedStore = this.getUnifiedStore();
    let clearedLegacyViaSession = false;

    if (session) {
      log.info('[CredentialOrchestrator] clearing session credentials');
      if (unifiedStore) {
        unifiedStore.clearSession();
      } else {
        this.currentCredentialStore.clear();
        clearedLegacyViaSession = true;
      }
    }

    if (persisted) {
      log.info('[CredentialOrchestrator] clearing persisted credentials');
      if (!clearedLegacyViaSession) {
        this.currentCredentialStore.clear();
      }
    }
  }

  /**
   * Get authentication information
   */
  async getAuthenticationInfo() {
    const unifiedStore = this.getUnifiedStore();
    if (unifiedStore) {
      return await unifiedStore.getAuthenticationInfo();
    }
    // Fallback for legacy credential store
    return {
      isUnlocked: !!this.currentCredentialStore.password,
      hasStoredCredentials: this.currentCredentialStore.isPaired,
      hasActiveSession: false,
      sessionTimeRemaining: 0,
      supportsPasskeys: false,
      hasPasskey: false,
      preferredUnlockMethod: 'password' as const
    };
  }

  /**
   * Unlock the credential store
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
   * Check if passkeys are supported
   */
  async supportsPasskeys(): Promise<boolean> {
    const unifiedStore = this.getUnifiedStore();
    if (unifiedStore) {
      const authInfo = await unifiedStore.getAuthenticationInfo();
      return authInfo.supportsPasskeys;
    }
    return false;
  }

  /**
   * Persist credentials with password encryption
   */
  async persistWithPassword(password: string): Promise<void> {
    if (!this.currentCredentialStore) {
      throw new Error('No credentials store available');
    }

    const store = this.currentCredentialStore;
    if (store instanceof UnifiedCredentialStore) {
      const unlocked = await store.unlock({
        method: 'password',
        password
      });

      if (!unlocked) {
        throw new Error('Failed to unlock credentials with password');
      }

      // Save credentials and create session
      await store.createSessionAfterConnection();
    } else {
      // Legacy LncCredentialStore - just set password (it auto-persists)
      store.password = password;
    }
  }

  /**
   * Persist credentials with passkey encryption
   */
  async persistWithPasskey(): Promise<void> {
    if (!this.currentCredentialStore) {
      throw new Error('No credentials store available');
    }

    const store = this.currentCredentialStore;
    if (store instanceof UnifiedCredentialStore) {
      const unlocked = await store.unlock({
        method: 'passkey',
        createIfMissing: true
      });

      if (!unlocked) {
        throw new Error('Failed to create/use passkey for credentials');
      }

      // Save credentials and create session
      await store.createSessionAfterConnection();
    } else {
      throw new Error(
        'Passkey authentication requires the new credential store (enable sessions or passkeys)'
      );
    }
  }

  /**
   * Check if passkeys are supported in the current environment
   */
  static async isPasskeySupported(): Promise<boolean> {
    return await PasskeyEncryptionService.isSupported();
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
