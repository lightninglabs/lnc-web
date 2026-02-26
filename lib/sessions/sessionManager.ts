import { SessionConfig } from '../types/lnc';
import { log } from '../util/log';
import { CredentialsEncrypter } from './crypto/CredentialsEncrypter';
import { KeyWrapper } from './crypto/KeyWrapper';
import CryptoService from './cryptoService';
import { DeviceBinder } from './device/DeviceBinder';
import { OriginKeyManager } from './origin/OriginKeyManager';
import { SessionStorage } from './storage/sessionStorage';
import { SessionCredentials, SessionData } from './types';

const DEFAULT_CONFIG: Required<SessionConfig> = {
  sessionDurationMs: 24 * 60 * 60 * 1000, // 24 hours
  enableActivityRefresh: true,
  maxRefreshes: 10,
  maxSessionAgeMs: 7 * 24 * 60 * 60 * 1000 // 7 days
};

/**
 * Manages encrypted passwordless sessions backed by device and origin key
 * wrapping. Credentials are encrypted with a one-time DEK, which is wrapped
 * independently by a device-derived key (from browser fingerprint) and an
 * origin-bound key (from IndexedDB), then persisted in sessionStorage.
 */
export default class SessionManager {
  private encrypter: CredentialsEncrypter;
  private keyWrapper: KeyWrapper;
  private deviceBinder: DeviceBinder;
  private originKeyManager: OriginKeyManager;
  private storage: SessionStorage;
  private namespace: string;

  readonly config: Readonly<Required<SessionConfig>>;

  constructor(namespace: string, config?: SessionConfig) {
    this.namespace = namespace;
    // Build dependencies once so session operations share the same crypto utilities.
    const cryptoService = new CryptoService();
    this.encrypter = new CredentialsEncrypter(cryptoService);
    this.keyWrapper = new KeyWrapper(cryptoService);
    this.deviceBinder = new DeviceBinder();
    this.originKeyManager = new OriginKeyManager(namespace);
    this.storage = new SessionStorage(namespace);
    this.config = this.validateConfig(config);
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
   * Check if there's a valid session by attempting to restore it
   */
  async hasValidSession(): Promise<boolean> {
    if (!this.hasActiveSession) {
      return false;
    }

    // Reuse restore path so validity check also verifies decryptability.
    const credentials = await this.restoreSession();
    return !!credentials;
  }

  /**
   * Create a new password-less session
   */
  async createSession(credentials: SessionCredentials): Promise<void> {
    const sessionId = this.generateSecureSessionId();
    const createdAt = Date.now();
    const expiresAt = createdAt + this.config.sessionDurationMs;
    const deviceFingerprint = await this.deviceBinder.generateFingerprint();

    // Encrypt credentials before touching sessionStorage to avoid cleartext persistence.
    const encrypted = await this.encrypter.encrypt(credentials);

    // Derive a device-bound wrapping key from the browser fingerprint. The
    // fingerprint itself is never stored -- a wrong device will simply produce
    // the wrong key, causing AES-GCM unwrap to fail at restore time.
    const deviceKey = await this.deviceBinder.deriveSessionKey(
      deviceFingerprint,
      sessionId
    );

    // Retrieve/create the origin key that will protect the payload's data key.
    const originKeyData = await this.originKeyManager.getOrCreateOriginKey();
    const wrappedKeys = await this.keyWrapper.wrapCredentialsKey(
      encrypted.credentialsKey,
      deviceKey,
      originKeyData.originKey
    );

    const sessionData: SessionData = {
      sessionId,
      createdAt,
      expiresAt,
      refreshCount: 0,
      encryptedCredentials: encrypted.ciphertextB64,
      credentialsIV: encrypted.ivB64,
      device: wrappedKeys.deviceWrap,
      origin: wrappedKeys.originWrap
    };

    this.storage.save(sessionData);
    log.info('[SessionManager] Session created successfully');
  }

  /**
   * Restore a session without password. Returns undefined when the session
   * cannot be restored (missing, expired, or infrastructure failure). Errors
   * are caught and logged so callers do not need try/catch.
   */
  async restoreSession(): Promise<SessionCredentials | undefined> {
    try {
      return await this.restoreSessionOrThrow();
    } catch (error) {
      log.error('[SessionManager] Session restoration failed:', error);
      this.storage.clear();
      return undefined;
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<boolean> {
    // Check expected preconditions first. These return false without throwing
    // so the caller can distinguish "nothing to do" from infrastructure errors.
    const sessionData = this.storage.load();
    if (!sessionData) {
      log.warn('[SessionManager] No session data available for refresh');
      return false;
    }

    // Enforce the maximum number of refreshes per session.
    if (sessionData.refreshCount >= this.config.maxRefreshes) {
      log.warn('[SessionManager] Maximum refresh count reached');
      return false;
    }

    // Enforce the absolute maximum session age.
    const sessionAge = Date.now() - sessionData.createdAt;
    if (sessionAge >= this.config.maxSessionAgeMs) {
      log.warn('[SessionManager] Maximum session age exceeded');
      return false;
    }

    // Use the throwing variant so crypto and storage errors propagate to the
    // caller, allowing it to count them as infrastructure failures.
    const credentials = await this.restoreSessionOrThrow();
    if (!credentials) {
      log.warn(
        '[SessionManager] Refresh aborted: session could not be restored'
      );
      return false;
    }

    // Re-encrypt and re-wrap with a fresh origin key so the origin key
    // lifetime always covers the full session expiry window.
    const encrypted = await this.encrypter.encrypt(credentials);
    const deviceKey = await this.deviceBinder.deriveSessionKey(
      await this.deviceBinder.generateFingerprint(),
      sessionData.sessionId
    );
    const originKeyData = await this.originKeyManager.getOrCreateOriginKey();
    const wrappedKeys = await this.keyWrapper.wrapCredentialsKey(
      encrypted.credentialsKey,
      deviceKey,
      originKeyData.originKey
    );

    // Build a fresh SessionData object rather than mutating the loaded copy.
    const refreshedData: SessionData = {
      sessionId: sessionData.sessionId,
      createdAt: sessionData.createdAt,
      expiresAt: Date.now() + this.config.sessionDurationMs,
      refreshCount: sessionData.refreshCount + 1,
      encryptedCredentials: encrypted.ciphertextB64,
      credentialsIV: encrypted.ivB64,
      device: wrappedKeys.deviceWrap,
      origin: wrappedKeys.originWrap
    };

    this.storage.save(refreshedData);
    return true;
  }

  /**
   * Internal restore that lets infrastructure errors (crypto, storage, key
   * wrapping) propagate. Used by {@link refreshSession} so the caller can
   * distinguish "nothing to refresh" from real failures.
   */
  private async restoreSessionOrThrow(): Promise<
    SessionCredentials | undefined
  > {
    log.info('[SessionManager] Starting session restoration...');

    const sessionData = this.storage.load();
    if (!sessionData) {
      log.info('[SessionManager] No session data found');
      return undefined;
    }

    if (Date.now() > sessionData.expiresAt) {
      log.info('[SessionManager] Session expired');
      // Do not clear storage here -- let the caller decide. The catching
      // wrapper (restoreSession) clears on error; the throwing path
      // (refreshSession) leaves storage intact for circuit-breaker retries.
      return undefined;
    }

    // Re-derive the device key from the current fingerprint. If the device
    // changed, the derived key will differ and AES-GCM unwrap will fail.
    const deviceFingerprint = await this.deviceBinder.generateFingerprint();
    const deviceKey = await this.deviceBinder.deriveSessionKey(
      deviceFingerprint,
      sessionData.sessionId
    );

    // Restoration requires the original wrapping key from IndexedDB.
    // Do not clear storage here — let the caller decide. The catching wrapper
    // (restoreSession) clears on error; the throwing path (refreshSession)
    // leaves storage intact so the circuit breaker can retry on transient
    // failures.
    const originKeyData = await this.originKeyManager.loadOriginKey();
    if (!originKeyData) {
      throw new Error('Origin key missing');
    }

    if (this.originKeyManager.isExpired(originKeyData.expiresAt)) {
      throw new Error('Origin key expired');
    }

    // Unwrap the data-encryption key and decrypt the credential payload.
    const credentialsKey = await this.keyWrapper.unwrapCredentialsKey(
      {
        deviceWrap: sessionData.device,
        originWrap: sessionData.origin
      },
      deviceKey,
      originKeyData.originKey
    );

    const credentials = await this.encrypter.decrypt({
      credentialsKey,
      ciphertextB64: sessionData.encryptedCredentials,
      ivB64: sessionData.credentialsIV
    });

    log.info('[SessionManager] Session restoration successful!');
    return credentials;
  }

  /**
   * Generate a cryptographically secure session ID
   */
  private generateSecureSessionId(): string {
    if (crypto.randomUUID) {
      // Prefer platform UUID generation when available.
      return crypto.randomUUID();
    }

    // Fallback for runtimes without randomUUID support.
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join(
      ''
    );
  }

  /**
   * Merge caller-supplied config with defaults and validate the result.
   * Undefined values in the input are filtered out so they do not overwrite
   * defaults (e.g. when a caller passes { sessionDurationMs: undefined }).
   */
  private validateConfig(config?: SessionConfig): Required<SessionConfig> {
    const supplied = config
      ? Object.fromEntries(
          Object.entries(config).filter(([, v]) => v !== undefined)
        )
      : {};
    const c = Object.assign(
      {},
      DEFAULT_CONFIG,
      supplied
    ) as Required<SessionConfig>;

    if (!Number.isFinite(c.sessionDurationMs) || c.sessionDurationMs <= 0) {
      throw new Error('sessionDurationMs must be a finite positive number');
    }
    if (!Number.isInteger(c.maxRefreshes) || c.maxRefreshes < 0) {
      throw new Error('maxRefreshes must be a non-negative integer');
    }
    if (typeof c.enableActivityRefresh !== 'boolean') {
      throw new Error('enableActivityRefresh must be a boolean');
    }
    if (!Number.isFinite(c.maxSessionAgeMs) || c.maxSessionAgeMs <= 0) {
      throw new Error('maxSessionAgeMs must be a finite positive number');
    }
    if (c.maxSessionAgeMs < c.sessionDurationMs) {
      throw new Error('maxSessionAgeMs must be >= sessionDurationMs');
    }

    return Object.freeze(c);
  }
}
