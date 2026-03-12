import {
  FaradayApi,
  LitApi,
  LndApi,
  LoopApi,
  PoolApi,
  TaprootAssetsApi
} from '@lightninglabs/lnc-core';
import { createRpc } from './api/createRpc';
import { CredentialStore, LncConfig } from './types/lnc';
import LncCredentialStore from './util/credentialStore';
import { ConnectionParams, WasmManager } from './wasmManager';

/** The default values for the LncConfig options. */
export const DEFAULT_CONFIG = {
  wasmClientCode: 'https://lightning.engineering/lnc-v0.3.5-alpha.wasm',
  namespace: 'default',
  serverHost: 'mailbox.terminal.lightning.today:443'
} as Required<LncConfig>;

/**
 * Legacy LNC facade: password-only, exposes public `credentials` object,
 * and does not include passkey/session/auth-orchestration API.
 */
export default class LNC {
  credentials: CredentialStore;

  lnd: LndApi;
  loop: LoopApi;
  pool: PoolApi;
  faraday: FaradayApi;
  tapd: TaprootAssetsApi;
  lit: LitApi;

  private wasmManager: WasmManager;

  constructor(lncConfig?: LncConfig) {
    // Merge the passed in config with the defaults.
    const config = Object.assign({}, DEFAULT_CONFIG, lncConfig);

    // Create credential store: use custom store if provided, otherwise
    // instantiate the default LncCredentialStore.
    if (config.credentialStore) {
      this.credentials = config.credentialStore;
    } else {
      this.credentials = new LncCredentialStore(
        config.namespace,
        config.password
      );
    }

    // Set serverHost from config if not already paired.
    if (!this.credentials.isPaired && config.serverHost) {
      this.credentials.serverHost = config.serverHost;
    }

    // Set pairingPhrase from config if provided.
    if (config.pairingPhrase) {
      this.credentials.pairingPhrase = config.pairingPhrase;
    }

    // Initialize WASM manager with namespace and client code.
    this.wasmManager = new WasmManager(
      config.namespace,
      config.wasmClientCode,
      {
        onLocalKeyCreated: (keyHex: string) => {
          this.credentials.localKey = keyHex;
        },
        onRemoteKeyReceived: (keyHex: string) => {
          this.credentials.remoteKey = keyHex;
        }
      }
    );

    // Wire all 6 RPC services via createRpc.
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

  //
  // Lifecycle methods
  //

  /**
   * Downloads the WASM client binary.
   */
  async preload() {
    await this.wasmManager.preload();
  }

  /**
   * Loads keys from storage and runs the WASM client binary.
   */
  async run() {
    await this.wasmManager.run();
  }

  /**
   * Connects to the LNC proxy server.
   * @returns a promise that resolves when the connection is established
   */
  async connect() {
    // Build ConnectionParams from the credential store.
    const params: ConnectionParams = {
      pairingPhrase: this.credentials.pairingPhrase,
      serverHost: this.credentials.serverHost,
      localKey: this.credentials.localKey || '',
      remoteKey: this.credentials.remoteKey || ''
    };

    await this.wasmManager.connect(params);

    // Legacy post-connect cleanup: if the credentials are persisted in
    // local storage (password is set), clear the in-memory keys.
    if (this.credentials.password) {
      this.credentials.clear(true);
    }
  }

  /**
   * Disconnects from the proxy server.
   */
  disconnect() {
    this.wasmManager.disconnect();
  }

  /**
   * Waits until the WASM client is executed and ready to accept connection info.
   */
  async waitTilReady() {
    await this.wasmManager.waitTilReady();
  }

  //
  // RPC methods
  //

  /**
   * Emulates a GRPC request but uses the WASM client instead to communicate
   * with the LND node.
   */
  request<TRes>(method: string, request?: object): Promise<TRes> {
    return this.wasmManager.request<TRes>(method, request);
  }

  /**
   * Subscribes to a GRPC server-streaming endpoint and executes the
   * `onMessage` handler when a new message is received from the server.
   */
  subscribe<TRes>(
    method: string,
    request?: object,
    onMessage?: (res: TRes) => void,
    onError?: (res: Error) => void
  ) {
    this.wasmManager.subscribe(method, request, onMessage, onError);
  }
}
