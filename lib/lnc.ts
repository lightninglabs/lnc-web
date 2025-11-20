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
import { WasmManager } from './wasmManager';

/** The default values for the LncConfig options */
export const DEFAULT_CONFIG = {
  wasmClientCode: 'https://lightning.engineering/lnc-v0.3.4-alpha.wasm',
  namespace: 'default',
  serverHost: 'mailbox.terminal.lightning.today:443'
} as Required<LncConfig>;

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
    // merge the passed in config with the defaults
    const config = Object.assign({}, DEFAULT_CONFIG, lncConfig);

    if (config.credentialStore) {
      this.credentials = config.credentialStore;
    } else {
      this.credentials = new LncCredentialStore(
        config.namespace,
        config.password
      );
      // don't overwrite an existing serverHost if we're already paired
      if (!this.credentials.isPaired)
        this.credentials.serverHost = config.serverHost;
      if (config.pairingPhrase)
        this.credentials.pairingPhrase = config.pairingPhrase;
    }

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
}
