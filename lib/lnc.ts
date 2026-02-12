import {
  FaradayApi,
  LitApi,
  LndApi,
  LoopApi,
  PoolApi,
  TaprootAssetsApi
} from '@lightninglabs/lnc-core';
import { createRpc } from './api/createRpc';
import { CredentialOrchestrator } from './credentialOrchestrator';
import { PasskeyEncryptionService } from './encryption/passkeyEncryptionService';
import {
  AuthenticationInfo,
  ClearOptions,
  CredentialStore,
  LncConfig,
  UnlockOptions
} from './types/lnc';
import { WasmManager } from './wasmManager';

/** The default values for the LncConfig options */
export const DEFAULT_CONFIG = {
  wasmClientCode: 'https://lightning.engineering/lnc-v0.3.5-alpha.wasm',
  namespace: 'default',
  serverHost: 'mailbox.terminal.lightning.today:443'
} as Required<LncConfig>;

export default class LNC {
  private orchestrator: CredentialOrchestrator;

  lnd: LndApi;
  loop: LoopApi;
  pool: PoolApi;
  faraday: FaradayApi;
  tapd: TaprootAssetsApi;
  lit: LitApi;

  private wasmManager: WasmManager;

  constructor(lncConfig?: LncConfig) {
    // merge the passed in config with the defaults
    const config = Object.assign({}, DEFAULT_CONFIG, lncConfig);

    // Create orchestrator which handles store creation
    this.orchestrator = new CredentialOrchestrator(config);

    // Initialize WASM manager with namespace and client code
    this.wasmManager = new WasmManager(
      config.namespace || DEFAULT_CONFIG.namespace,
      config.wasmClientCode || DEFAULT_CONFIG.wasmClientCode
    );
    this.wasmManager.setCredentialProvider(this.credentials);

    this.lnd = new LndApi(createRpc, this);
    this.loop = new LoopApi(createRpc, this);
    this.pool = new PoolApi(createRpc, this);
    this.faraday = new FaradayApi(createRpc, this);
    this.tapd = new TaprootAssetsApi(createRpc, this);
    this.lit = new LitApi(createRpc, this);
  }

  /**
   * Gets the credential store for accessing credential properties
   */
  get credentials(): CredentialStore {
    return this.orchestrator.credentialStore;
  }

  get isReady() {
    return this.wasmManager.isReady;
  }

  get isConnected() {
    return this.wasmManager.isConnected;
  }

  get status() {
    return this.wasmManager.status;
  }

  get expiry(): Date {
    return this.wasmManager.expiry;
  }

  get isReadOnly() {
    return this.wasmManager.isReadOnly;
  }

  hasPerms(permission: string) {
    return this.wasmManager.hasPerms(permission);
  }

  /**
   * Downloads the WASM client binary
   */
  async preload() {
    await this.wasmManager.preload();
  }

  /**
   * Loads keys from storage and runs the Wasm client binary
   */
  async run() {
    await this.wasmManager.run();
  }

  /**
   * Connects to the LNC proxy server
   * @returns a promise that resolves when the connection is established
   */
  async connect() {
    await this.wasmManager.connect(this.credentials);
  }

  /**
   * Disconnects from the proxy server
   */
  disconnect() {
    this.wasmManager.disconnect();
  }

  /**
   * Waits until the WASM client is executed and ready to accept connection info
   */
  async waitTilReady() {
    await this.wasmManager.waitTilReady();
  }

  /**
   * Emulates a GRPC request but uses the WASM client instead to communicate with the LND node
   * @param method the GRPC method to call on the service
   * @param request The GRPC request message to send
   */
  request<TRes>(method: string, request?: object): Promise<TRes> {
    return this.wasmManager.request<TRes>(method, request);
  }

  /**
   * Subscribes to a GRPC server-streaming endpoint and executes the `onMessage` handler
   * when a new message is received from the server
   * @param method the GRPC method to call on the service
   * @param request the GRPC request message to send
   * @param onMessage the callback function to execute when a new message is received
   * @param onError the callback function to execute when an error is received
   */
  subscribe<TRes>(
    method: string,
    request?: object,
    onMessage?: (res: TRes) => void,
    onError?: (res: Error) => void
  ) {
    this.wasmManager.subscribe(method, request, onMessage, onError);
  }

  //
  // Authentication methods (via CredentialOrchestrator)
  //

  /**
   * Check if credentials are currently unlocked
   */
  get isUnlocked(): boolean {
    return this.orchestrator.isUnlocked;
  }

  /**
   * Check if credentials are paired (have been persisted previously)
   */
  get isPaired(): boolean {
    return this.orchestrator.isPaired;
  }

  /**
   * Clear stored credentials
   * @param options Optional clear options or legacy memoryOnly flag
   */
  clear(options?: boolean | ClearOptions): void {
    if (typeof options === 'boolean') {
      this.credentials.clear(options);
      return;
    }

    this.orchestrator.clear(options);
  }

  /**
   * Clear stored credentials (alias for clear)
   * @param options Optional clear options or legacy memoryOnly flag
   * @deprecated Use clear() instead
   */
  clearCredentials(options?: boolean | ClearOptions): void {
    this.clear(options);
  }

  /**
   * Check if the current configuration supports passkeys
   */
  async supportsPasskeys(): Promise<boolean> {
    return this.orchestrator.supportsPasskeys();
  }

  /**
   * Unlock the credential store using the specified method
   * @param options The unlock options (method and credentials)
   * @returns Promise resolving to true if unlock was successful
   */
  async unlock(options: UnlockOptions): Promise<boolean> {
    return this.orchestrator.unlock(options);
  }

  /**
   * Pair with an LNC node using a pairing phrase and set up authentication.
   * After pairing, credentials need to be persisted using persistWithPassword or persistWithPasskey.
   * @param pairingPhrase The pairing phrase from litd
   */
  async pair(pairingPhrase: string): Promise<void> {
    // Set the pairing phrase
    this.credentials.pairingPhrase = pairingPhrase;

    // Run and connect
    await this.run();
    await this.connect();
  }

  /**
   * Persist credentials with password encryption.
   * Call this after a successful connection to save credentials for future use.
   * @param password The password to use for encryption
   */
  async persistWithPassword(password: string): Promise<void> {
    return this.orchestrator.persistWithPassword(password);
  }

  /**
   * Persist credentials with passkey authentication.
   * Call this after a successful connection to save credentials for future use using a passkey.
   */
  async persistWithPasskey(): Promise<void> {
    return this.orchestrator.persistWithPasskey();
  }

  /**
   * Get authentication information including unlock state and stored credentials
   */
  async getAuthenticationInfo(): Promise<AuthenticationInfo> {
    return this.orchestrator.getAuthenticationInfo();
  }

  /**
   * Perform automatic login using the preferred method
   */
  async performAutoLogin(): Promise<boolean> {
    return this.orchestrator.performAutoLogin();
  }

  //
  // Static methods
  //

  /**
   * Check if passkeys are supported in the current environment
   */
  static async isPasskeySupported(): Promise<boolean> {
    return await PasskeyEncryptionService.isSupported();
  }
}
