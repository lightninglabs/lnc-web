import { SessionConfig } from '../types/lnc';
import { log } from '../util/log';
import { CredentialsEncrypter } from './crypto/CredentialsEncrypter';
import { KeyWrapper } from './crypto/KeyWrapper';
import CryptoService from './cryptoService';
import { DeviceBinder } from './device/DeviceBinder';
import { OriginKeyManager } from './origin/OriginKeyManager';
import { SessionStorage } from './storage/sessionStorage';
import { SessionCredentials, SessionData } from './types';

// Default session configuration
const DEFAULT_CONFIG: Required<SessionConfig> = {
  sessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  enableActivityRefresh: true,
  activityThreshold: 30, // minutes
  activityThrottleInterval: 30, // seconds
  refreshTrigger: 4, // hours
  refreshCheckInterval: 5, // minutes
  pauseOnHidden: true,
  maxRefreshes: 10,
  maxSessionAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Session manager handles creation, restoration, and management of passwordless sessions.
 * Uses device binding and origin keys for secure session storage.
 * Single responsibility: orchestrating session lifecycle using specialized services.
 */
export default class SessionManager {
  private encrypter: CredentialsEncrypter;
  private keyWrapper: KeyWrapper;
  private deviceBinder: DeviceBinder;
  private originKeyManager: OriginKeyManager;
  private storage: SessionStorage;
  private cryptoService: CryptoService;
  private namespace: string;

  config: Required<SessionConfig>;

  constructor(namespace: string, config?: SessionConfig) {
    this.namespace = namespace;
    this.cryptoService = new CryptoService();

    // Initialize services with dependency injection
    this.encrypter = new CredentialsEncrypter(this.cryptoService);
    this.keyWrapper = new KeyWrapper(this.cryptoService);
    this.deviceBinder = new DeviceBinder();
    this.originKeyManager = new OriginKeyManager(namespace);
    this.storage = new SessionStorage(namespace);

    // Apply defaults for config and override with provided config
    this.config = Object.assign({}, DEFAULT_CONFIG, config);
  }

  /**
   * Check if auto-restore is available
   */
  get canAutoRestore(): boolean {
    return this.storage.hasData();
  }

  /**
   * Get time until session expiry in milliseconds
   */
  get sessionTimeRemaining(): number {
    const sessionData = this.storage.load();
    if (!sessionData) {
      return 0;
    }

    return Math.max(0, sessionData.expiresAt - Date.now());
  }

  /**
   * Check if there's an active session
   */
  get hasActiveSession(): boolean {
    const sessionData = this.storage.load();
    return sessionData != null && Date.now() < sessionData.expiresAt;
  }

  /**
   * Get the namespace for this session manager
   */
  getNamespace(): string {
    return this.namespace;
  }

  /**
   * Clear the current session
   */
  clearSession(): void {
    this.storage.clear();
  }

  /**
   * Create a new password-less session
   */
  async createSession(credentials: SessionCredentials): Promise<void> {
    const createdAt = Date.now();
    const expiresAt = createdAt + this.config.sessionDuration;

    // 1. Generate session ID and device fingerprint
    const sessionId = this.generateSecureSessionId();
    const deviceFingerprint = await this.deviceBinder.generateFingerprint();

    // 2. Encrypt credentials using the dedicated service
    const encrypted = await this.encrypter.encrypt(credentials);

    // 3. Derive device session key
    const deviceKey = await this.deviceBinder.deriveSessionKey(
      deviceFingerprint,
      sessionId
    );

    // 4. Get or create origin key
    const originKeyData = await this.originKeyManager.getOrCreateOriginKey();

    // 5. Double-wrap the credentials key using the dedicated service
    const wrappedKeys = await this.keyWrapper.wrapCredentialsKey(
      encrypted.credentialsKey,
      deviceKey,
      originKeyData.originKey
    );

    // 6. Create session data
    const sessionData: SessionData = {
      sessionId,
      deviceFingerprint,
      createdAt,
      expiresAt,
      refreshCount: 0,
      encryptedCredentials: encrypted.ciphertextB64,
      credentialsIV: encrypted.ivB64,
      device: {
        keyB64: wrappedKeys.deviceWrap.keyB64,
        ivB64: wrappedKeys.deviceWrap.ivB64
      },
      origin: {
        keyB64: wrappedKeys.originWrap.keyB64,
        ivB64: wrappedKeys.originWrap.ivB64
      }
    };

    // 7. Store in sessionStorage using the dedicated service
    this.storage.save(sessionData);
    log.info('[SessionManager] Session created successfully');
  }

  /**
   * Restore a session without password
   */
  async restoreSession(): Promise<SessionCredentials | undefined> {
    log.info('[SessionManager] Starting session restoration...');
    try {
      // 1. Load session data using dedicated service
      const sessionData = this.storage.load();
      if (!sessionData) {
        log.info('[SessionManager] No session data found');
        return undefined;
      }

      // 2. Check expiry
      if (Date.now() > sessionData.expiresAt) {
        log.info('[SessionManager] Session expired');
        this.storage.clear();
        return undefined;
      }

      // 3. Verify device fingerprint using dedicated service
      const currentFingerprint = await this.deviceBinder.generateFingerprint();
      if (currentFingerprint !== sessionData.deviceFingerprint) {
        this.storage.clear();
        throw new Error('Device fingerprint mismatch');
      }

      // 4. Derive device session key using dedicated service
      const deviceKey = await this.deviceBinder.deriveSessionKey(
        sessionData.deviceFingerprint,
        sessionData.sessionId
      );

      // 5. Load origin key using dedicated service
      const originKeyData = await this.originKeyManager.loadOriginKey();
      if (!originKeyData) {
        this.storage.clear();
        throw new Error('Origin key missing');
      }
      if (this.originKeyManager.isExpired(originKeyData.expiresAt)) {
        this.storage.clear();
        throw new Error('Origin key expired');
      }

      // 6. Unwrap and verify credentials key using dedicated service
      const credentialsKey = await this.keyWrapper.unwrapCredentialsKey(
        {
          deviceWrap: sessionData.device,
          originWrap: sessionData.origin
        },
        deviceKey,
        originKeyData.originKey
      );

      // 7. Decrypt credentials using dedicated service
      const credentials = await this.encrypter.decrypt({
        credentialsKey,
        ciphertextB64: sessionData.encryptedCredentials,
        ivB64: sessionData.credentialsIV
      });

      log.info('[SessionManager] Session restoration successful!');
      return credentials;
    } catch (error) {
      log.error('[SessionManager] Session restoration failed:', error);
      this.storage.clear();
      // don't throw an error here, just return undefined to indicate that the session
      // could not be restored.
      return undefined;
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<boolean> {
    try {
      const sessionData = this.storage.load();
      if (!sessionData) {
        return false;
      }

      const nextRefreshCount = sessionData.refreshCount + 1;

      // Check refresh limits
      if (nextRefreshCount > this.config.maxRefreshes) {
        return false;
      }

      const sessionAge = Date.now() - sessionData.createdAt;
      if (sessionAge > this.config.maxSessionAge) {
        this.storage.clear();
        return false;
      }

      // Extend session
      sessionData.expiresAt = Date.now() + this.config.sessionDuration;
      sessionData.refreshCount = nextRefreshCount;

      // Update storage using dedicated service
      this.storage.save(sessionData);

      // Extend origin key if needed
      const originKeyData = await this.originKeyManager.loadOriginKey();
      if (
        originKeyData &&
        this.originKeyManager.isExpired(originKeyData.expiresAt)
      ) {
        // For now, just clear the session if origin key expires
        // A full implementation would re-wrap with new origin key
        this.storage.clear();
      }

      return true;
    } catch (error) {
      log.error('[SessionManager] Session refresh failed:', error);
      return false;
    }
  }

  /**
   * Check if there's a valid session by attempting to restore it
   */
  async hasValidSession(): Promise<boolean> {
    if (!this.hasActiveSession) {
      return false;
    }

    try {
      const credentials = await this.restoreSession();
      return !!credentials;
    } catch (error) {
      log.error('[SessionManager] Failed to check for valid session', error);
      // Session data is corrupted or invalid - clear it
      this.clearSession();
      return false;
    }
  }

  /**
   * Generate a cryptographically secure session ID
   */
  private generateSecureSessionId(): string {
    if (crypto.randomUUID) {
      return crypto.randomUUID();
    }

    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }
}
