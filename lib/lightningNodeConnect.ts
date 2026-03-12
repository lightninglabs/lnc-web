import {
  FaradayApi,
  LitApi,
  LndApi,
  LoopApi,
  PoolApi,
  TaprootAssetsApi
} from '@lightninglabs/lnc-core';
import { createRpc } from './api/createRpc';
import { PasskeyEncryptionService } from './encryption/passkeyEncryptionService';
import SessionManager from './sessions/sessionManager';
import { AuthenticationCoordinator } from './stores/authenticationCoordinator';
import { CredentialCache } from './stores/credentialCache';
import { SessionCoordinator } from './stores/sessionCoordinator';
import { StrategyManager } from './stores/strategyManager';
import {
  ClearOptions,
  LightningNodeConnectConfig,
  UnlockOptions
} from './types/lightningNodeConnect';
import { createLogger } from './util/log';
import { ConnectionParams, WasmManager } from './wasmManager';

const log = createLogger('LightningNodeConnect');

/** The default values for the LightningNodeConnectConfig options. */
export const DEFAULT_CONFIG: LightningNodeConnectConfig = {
  wasmClientCode: 'https://lightning.engineering/lnc-v0.3.5-alpha.wasm',
  namespace: 'default',
  serverHost: 'mailbox.terminal.lightning.today:443',
  allowPasskeys: true,
  passkeyDisplayName: 'LNC User (default)',
  enableSessions: true
};

/**
 * Modern entrypoint supporting password, passkey, and session-based
 * authentication. Does not expose a public CredentialStore — credential
 * lifecycle is managed internally through the auth stack.
 */
export class LightningNodeConnect {
  lnd: LndApi;
  loop: LoopApi;
  pool: PoolApi;
  faraday: FaradayApi;
  tapd: TaprootAssetsApi;
  lit: LitApi;

  private _wasmManager: WasmManager;
  private _credentialCache: CredentialCache;
  private _authCoordinator: AuthenticationCoordinator;
  private _strategyManager: StrategyManager;
  private _sessionCoordinator: SessionCoordinator;
  private _config: Required<LightningNodeConnectConfig>;

  constructor(lncConfig?: LightningNodeConnectConfig) {
    const config = Object.assign(
      {},
      DEFAULT_CONFIG,
      lncConfig
    ) as Required<LightningNodeConnectConfig>;
    this._config = config;

    // In-memory credential cache — the single source of truth for connection state.
    this._credentialCache = new CredentialCache();

    // Session infrastructure (only when enabled).
    let sessionManager: SessionManager | undefined;
    if (config.enableSessions !== false) {
      sessionManager = new SessionManager(config.namespace, config.session);
    }

    // Auth stack.
    this._strategyManager = new StrategyManager(
      {
        namespace: config.namespace,
        allowPasskeys: config.allowPasskeys,
        passkeyDisplayName: config.passkeyDisplayName
      },
      sessionManager
    );
    this._sessionCoordinator = new SessionCoordinator(sessionManager);
    this._authCoordinator = new AuthenticationCoordinator(
      this._strategyManager,
      this._credentialCache,
      this._sessionCoordinator
    );

    // WASM manager.
    this._wasmManager = new WasmManager(
      config.namespace,
      config.wasmClientCode,
      {
        onLocalKeyCreated: (keyHex: string) => {
          this._credentialCache.set('localKey', keyHex);
        },
        onRemoteKeyReceived: (keyHex: string) => {
          this._credentialCache.set('remoteKey', keyHex);
        }
      }
    );

    // Wire RPC services.
    this.lnd = new LndApi(createRpc, this);
    this.loop = new LoopApi(createRpc, this);
    this.pool = new PoolApi(createRpc, this);
    this.faraday = new FaradayApi(createRpc, this);
    this.tapd = new TaprootAssetsApi(createRpc, this);
    this.lit = new LitApi(createRpc, this);
  }

  //
  // Status getters
  //

  get isReady() {
    return this._wasmManager.isReady;
  }

  get isConnected() {
    return this._wasmManager.isConnected;
  }

  get status() {
    return this._wasmManager.status;
  }

  get expiry(): Date {
    return this._wasmManager.expiry;
  }

  get isReadOnly() {
    return this._wasmManager.isReadOnly;
  }

  hasPerms(permission: string) {
    return this._wasmManager.hasPerms(permission);
  }

  //
  // Lifecycle methods
  //

  /**
   * Downloads the WASM client binary.
   */
  async preload() {
    await this._wasmManager.preload();
  }

  /**
   * Connects to the LNC proxy server. Builds ConnectionParams from the
   * CredentialCache. The underlying WasmManager will bootstrap the WASM
   * binary automatically if it has not been started yet.
   */
  async connect() {
    const pairingPhrase = this._credentialCache.get('pairingPhrase') || '';
    const localKey = this._credentialCache.get('localKey') || '';

    if (!pairingPhrase && !localKey) {
      throw new Error(
        'No pairing phrase or local key available. Call pair() or unlock() first.'
      );
    }

    const params: ConnectionParams = {
      pairingPhrase,
      serverHost:
        this._credentialCache.get('serverHost') || this._config.serverHost,
      localKey,
      remoteKey: this._credentialCache.get('remoteKey') || ''
    };

    await this._wasmManager.connect(params);

    // Session creation is best-effort — a failure should not cause connect()
    // to reject when the WASM connection itself succeeded.
    if (this._config.enableSessions !== false) {
      try {
        await this._authCoordinator.createSessionAfterConnection();
      } catch (error) {
        log.error(
          'Session creation failed after successful connection; ' +
            'session-based refresh will be unavailable:',
          error
        );
      }
    }
  }

  /**
   * Disconnects from the proxy server.
   */
  disconnect() {
    this._wasmManager.disconnect();
  }

  //
  // RPC methods
  //

  /**
   * Emulates a GRPC request but uses the WASM client instead.
   */
  request<TRes>(method: string, request?: object): Promise<TRes> {
    return this._wasmManager.request<TRes>(method, request);
  }

  /**
   * Subscribes to a GRPC server-streaming endpoint.
   */
  subscribe<TRes>(
    method: string,
    request?: object,
    onMessage?: (res: TRes) => void,
    onError?: (res: Error) => void
  ) {
    this._wasmManager.subscribe(method, request, onMessage, onError);
  }

  //
  // Auth methods
  //

  /**
   * Set a pairing phrase, run the WASM client, and connect.
   */
  async pair(pairingPhrase: string): Promise<void> {
    this._credentialCache.set('pairingPhrase', pairingPhrase);

    // Ensure serverHost is set from config defaults if not already populated.
    if (!this._credentialCache.get('serverHost')) {
      this._credentialCache.set('serverHost', this._config.serverHost);
    }

    await this.run();
    await this.connect();
  }

  /**
   * Unlock the auth stack. Only authenticates and hydrates in-memory auth
   * state — does not persist credentials or create sessions.
   */
  async unlock(options: UnlockOptions): Promise<boolean> {
    return this._authCoordinator.unlock(options);
  }

  /**
   * Persist credentials using a password. Must be called after connect()
   * so that the credential cache contains the connection keys.
   */
  async persistWithPassword(password: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Must be connected before persisting credentials');
    }

    const strategy = this._strategyManager.getStrategy('password');
    if (!strategy) {
      throw new Error('Password strategy not available');
    }

    const unlocked = await strategy.unlock({ method: 'password', password });
    if (!unlocked) {
      throw new Error('Failed to unlock password strategy');
    }
    await this._authCoordinator.persistCachedCredentials(strategy);
  }

  /**
   * Persist credentials using a passkey. Must be called after connect()
   * so that the credential cache contains the connection keys.
   */
  async persistWithPasskey(): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Must be connected before persisting credentials');
    }

    const strategy = this._strategyManager.getStrategy('passkey');
    if (!strategy) {
      throw new Error('Passkey strategy not available');
    }

    const unlocked = await strategy.unlock({
      method: 'passkey',
      createIfMissing: true
    });
    if (!unlocked) {
      throw new Error('Failed to unlock passkey strategy');
    }
    await this._authCoordinator.persistCachedCredentials(strategy);
  }

  /**
   * Try to automatically restore auth state from a session without
   * invoking WasmManager.connect().
   */
  async tryAutoRestore(): Promise<boolean> {
    return this._authCoordinator.tryAutoRestore();
  }

  /**
   * Get authentication information about the current state.
   */
  async getAuthenticationInfo() {
    return this._authCoordinator.getAuthenticationInfo();
  }

  /**
   * Returns true when passkeys are enabled in config AND the browser supports them.
   */
  supportsPasskeys(): boolean {
    if (this._config.allowPasskeys === false) {
      return false;
    }

    const strategy = this._strategyManager.getStrategy('passkey');
    return !!strategy && strategy.isSupported;
  }

  /**
   * Pure capability check — returns true if the browser supports passkeys,
   * regardless of config.
   */
  static async isPasskeySupported(): Promise<boolean> {
    return PasskeyEncryptionService.isSupported();
  }

  /**
   * Clear credentials. By default clears session data only.
   * Pass `{ persisted: true }` to also clear long-term stored credentials.
   */
  clear(options?: ClearOptions): void {
    const clearSession = options?.session !== false;
    const clearPersisted = options?.persisted === true;

    if (clearSession) {
      this._authCoordinator.clearSession();
    }

    if (clearPersisted) {
      this._strategyManager.clearAll();
    }
  }

  //
  // Private helpers
  //

  /**
   * Runs the WASM client binary and waits until it is ready.
   */
  private async run() {
    await this._wasmManager.run();
    await this._wasmManager.waitTilReady();
  }
}
