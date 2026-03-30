import { snakeKeysToCamel } from '@lightninglabs/lnc-core';
import { WasmGlobal } from './types/lnc';
import { waitFor } from './util/async';
import { wasmLog as log } from './util/log';

/**
 * Plain data object passed to WasmManager.connect() with everything needed
 * to establish a connection.
 */
export interface ConnectionParams {
  pairingPhrase: string;
  serverHost: string;
  localKey?: string;
  remoteKey?: string;
}

/**
 * Callback interface that WasmManager invokes during the WASM handshake.
 * Each entrypoint provides its own callbacks to write keys back to the
 * appropriate store.
 */
export interface ConnectionCallbacks {
  onLocalKeyCreated(keyHex: string): void;
  onRemoteKeyReceived(keyHex: string): void;
}

/**
 * A reference to the global object that is extended with proper typing for the LNC
 * functions that are injected by the WASM client and the Go object. This eliminates the
 * need for casting `globalThis` to `any`.
 */
export const lncGlobal = globalThis as typeof globalThis & {
  Go: new () => GoInstance;
} & {
  [key: string]: unknown;
};

// The default WasmGlobal object to use when the WASM client is not initialized
const DEFAULT_WASM_GLOBAL: WasmGlobal = {
  wasmClientIsReady: () => false,
  wasmClientIsConnected: () => false,
  wasmClientConnectServer: () => {
    throw new Error('WASM client not initialized');
  },
  wasmClientDisconnect: () => {
    throw new Error('WASM client not initialized');
  },
  wasmClientInvokeRPC: () => {
    throw new Error('WASM client not initialized');
  },
  wasmClientHasPerms: () => false,
  wasmClientIsReadOnly: () => false,
  wasmClientStatus: () => 'uninitialized',
  wasmClientGetExpiry: () => 0
};

/**
 * Manages WebAssembly client lifecycle, connection, and RPC communication.
 * Handles all WASM-specific operations and state management.
 */
export class WasmManager {
  private _wasmClientCode: string;
  private _namespace: string;
  private _preloadPromise?: Promise<WebAssembly.WebAssemblyInstantiatedSource>;
  private _callbacks: ConnectionCallbacks;
  private go: GoInstance;
  private result?: {
    module: WebAssembly.Module;
    instance: WebAssembly.Instance;
  };

  constructor(
    namespace: string,
    wasmClientCode: string,
    callbacks: ConnectionCallbacks
  ) {
    this._namespace = namespace;
    this._wasmClientCode = wasmClientCode;
    this._callbacks = callbacks;
    // Pull Go off of the global object. This is injected by the wasm_exec.js file.
    this.go = new lncGlobal.Go();
  }

  /**
   * Get the WASM global object
   */
  private get wasm(): WasmGlobal {
    return lncGlobal[this._namespace] as WasmGlobal;
  }

  /**
   * Set the WASM global object
   */
  private set wasm(value: WasmGlobal) {
    lncGlobal[this._namespace] = value;
  }

  // State getters
  get isReady(): boolean {
    return (
      this.wasm && this.wasm.wasmClientIsReady && this.wasm.wasmClientIsReady()
    );
  }

  get isConnected(): boolean {
    return (
      this.wasm &&
      this.wasm.wasmClientIsConnected &&
      this.wasm.wasmClientIsConnected()
    );
  }

  get status(): string {
    return (
      this.wasm && this.wasm.wasmClientStatus && this.wasm.wasmClientStatus()
    );
  }

  get expiry(): Date {
    return (
      this.wasm &&
      this.wasm.wasmClientGetExpiry &&
      new Date(this.wasm.wasmClientGetExpiry() * 1000)
    );
  }

  get isReadOnly(): boolean {
    return (
      this.wasm &&
      this.wasm.wasmClientIsReadOnly &&
      this.wasm.wasmClientIsReadOnly()
    );
  }

  hasPerms(permission: string): boolean {
    return (
      this.wasm &&
      this.wasm.wasmClientHasPerms &&
      this.wasm.wasmClientHasPerms(permission)
    );
  }

  /**
   * Downloads the WASM client binary
   */
  async preload(): Promise<void> {
    // If the WASM client binary is already being downloaded, wait for it to complete
    if (this._preloadPromise) {
      await this._preloadPromise;
      return;
    }

    // Download the WASM client binary and store the promise
    this._preloadPromise = WebAssembly.instantiateStreaming(
      fetch(this._wasmClientCode),
      this.go.importObject
    );
    // Store the result of the promise
    this.result = await this._preloadPromise;

    log.info('downloaded WASM file');
  }

  /**
   * Initializes the WASM namespace, registers callbacks, and starts the
   * WASM client binary.
   */
  async run(): Promise<void> {
    // Make sure the WASM client binary is downloaded first
    if (!this.isReady) {
      await this.preload();
    }

    // Create a fresh namespace object in the global scope if it doesn't exist.
    // Shallow-clone via spread so each WasmManager instance gets its own
    // object — assigning DEFAULT_WASM_GLOBAL directly would let one instance's
    // callback writes contaminate every other instance sharing the reference.
    if (typeof this.wasm !== 'object') {
      this.wasm = { ...DEFAULT_WASM_GLOBAL };
    }

    // Set up WASM callbacks
    this.setupWasmCallbacks();

    this.go.argv = [
      'wasm-client',
      '--debuglevel=debug,GOBN=info,GRPC=info',
      '--namespace=' + this._namespace,
      `--onlocalprivcreate=${this._namespace}.onLocalPrivCreate`,
      `--onremotekeyreceive=${this._namespace}.onRemoteKeyReceive`,
      `--onauthdata=${this._namespace}.onAuthData`
    ];

    if (this.result) {
      this.go.run(this.result.instance);
      await WebAssembly.instantiate(this.result.module, this.go.importObject);
    } else {
      throw new Error("Can't find WASM instance.");
    }
  }

  /**
   * Waits until the WASM client is ready
   */
  async waitTilReady(): Promise<void> {
    await waitFor(() => this.isReady, 'Failed to load the WASM client');
    log.info('The WASM client is ready');
  }

  /**
   * Connects to the LNC proxy server using plain connection parameters.
   */
  async connect(params: ConnectionParams): Promise<void> {
    // Do not attempt to connect multiple times
    if (this.isConnected) {
      return;
    }

    // Ensure the WASM binary is loaded.
    if (!this.isReady) {
      await this.run();
      await this.waitTilReady();
    }

    const { pairingPhrase, localKey, remoteKey, serverHost } = params;

    // Connect to the server
    this.wasm.wasmClientConnectServer(
      serverHost,
      false,
      pairingPhrase,
      localKey ?? '',
      remoteKey ?? ''
    );

    // Add an event listener to disconnect if the page is unloaded
    if (typeof window !== 'undefined') {
      window.addEventListener('unload', this.wasm.wasmClientDisconnect);
    } else {
      log.info('No unload event listener added. window is not available');
    }

    // Wait for connection to be established
    await this.waitForConnection();
  }

  /**
   * Disconnects from the proxy server
   */
  disconnect(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('unload', this.wasm.wasmClientDisconnect);
    }
    this.wasm.wasmClientDisconnect();
  }

  /**
   * Emulates a GRPC request but uses the WASM client instead
   */
  request<TRes>(method: string, request?: object): Promise<TRes> {
    return new Promise((resolve, reject) => {
      log.debug(`${method} request`, request);
      const reqJSON = JSON.stringify(request || {});
      this.wasm.wasmClientInvokeRPC(method, reqJSON, (response: string) => {
        try {
          const rawRes = JSON.parse(response);
          const res = snakeKeysToCamel(rawRes);
          log.debug(`${method} response`, res);
          resolve(res as TRes);
        } catch (error) {
          log.debug(`${method} parser error`, { response, error });
          reject(new Error(response));
        }
      });
    });
  }

  /**
   * Subscribes to a GRPC server-streaming endpoint
   */
  subscribe<TRes>(
    method: string,
    request?: object,
    onMessage?: (res: TRes) => void,
    onError?: (res: Error) => void
  ): void {
    log.debug(`${method} request`, request);
    const reqJSON = JSON.stringify(request || {});
    this.wasm.wasmClientInvokeRPC(method, reqJSON, (response: string) => {
      try {
        const rawRes = JSON.parse(response);
        const res = snakeKeysToCamel(rawRes);
        log.debug(`${method} response`, res);
        if (onMessage) onMessage(res as TRes);
      } catch (error) {
        log.debug(`${method} error`, error);
        const err = new Error(response);
        if (onError) onError(err);
      }
    });
  }

  //
  // Private helper methods
  //

  /**
   * Set up WASM callback functions using the stored ConnectionCallbacks.
   * Guarded so that a re-entrant run() via connect() does not overwrite
   * callbacks that are already wired up.
   */
  private setupWasmCallbacks(): void {
    if (!this.wasm.onLocalPrivCreate) {
      this.wasm.onLocalPrivCreate = (keyHex: string) => {
        this._callbacks.onLocalKeyCreated(keyHex);
      };
    }
    if (!this.wasm.onRemoteKeyReceive) {
      this.wasm.onRemoteKeyReceive = (keyHex: string) => {
        this._callbacks.onRemoteKeyReceived(keyHex);
      };
    }
    if (!this.wasm.onAuthData) {
      this.wasm.onAuthData = (keyHex: string) => {
        log.debug('auth data received: ' + keyHex);
      };
    }
  }

  /**
   * Wait for connection to be established. No post-connect cleanup — each
   * entrypoint handles its own credential lifecycle.
   */
  private async waitForConnection(): Promise<void> {
    await waitFor(
      () => this.isConnected,
      'Failed to connect the WASM client to the proxy server'
    );
    log.info('The WASM client is connected to the server');
  }
}
