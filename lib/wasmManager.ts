import { snakeKeysToCamel } from '@lightninglabs/lnc-core';
import { WasmGlobal } from './types/lnc';
import { wasmLog as log } from './util/log';

export interface CredentialProvider {
    pairingPhrase: string;
    localKey: string;
    remoteKey: string;
    serverHost: string;
    password?: string;
    clear(memoryOnly?: boolean): void;
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

/**
 * Manages WebAssembly client lifecycle, connection, and RPC communication.
 * Handles all WASM-specific operations and state management.
 */
export class WasmManager {
    private _wasmClientCode: string;
    private _namespace: string;
    private go: GoInstance;
    private result?: {
        module: WebAssembly.Module;
        instance: WebAssembly.Instance;
    };
    private credentialProvider?: CredentialProvider;

    constructor(namespace: string, wasmClientCode: string) {
        this._namespace = namespace;
        this._wasmClientCode = wasmClientCode;
        // Pull Go off of the global object. This is injected by the wasm_exec.js file.
        this.go = new lncGlobal.Go();
    }

    /**
     * Set the credential provider for connection operations
     */
    setCredentialProvider(provider: CredentialProvider): void {
        this.credentialProvider = provider;
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

    /**
     * Downloads the WASM client binary
     */
    async preload(): Promise<void> {
        this.result = await WebAssembly.instantiateStreaming(
            fetch(this._wasmClientCode),
            this.go.importObject
        );
        log.info('downloaded WASM file');
    }

    /**
     * Loads keys from storage and runs the WASM client binary
     */
    async run(): Promise<void> {
        // Make sure the WASM client binary is downloaded first
        if (!this.isReady) {
            await this.preload();
        }

        // Create the namespace object in the global scope if it doesn't exist
        if (typeof this.wasm !== 'object') {
            this.wasm = {} as WasmGlobal;
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
            await WebAssembly.instantiate(
                this.result.module,
                this.go.importObject
            );
        } else {
            throw new Error("Can't find WASM instance.");
        }
    }

    /**
     * Set up WASM callback functions
     */
    private setupWasmCallbacks(): void {
        if (!this.wasm.onLocalPrivCreate) {
            this.wasm.onLocalPrivCreate = (keyHex: string) => {
                log.debug('local private key created: ' + keyHex);
                if (this.credentialProvider) {
                    this.credentialProvider.localKey = keyHex;
                }
            };
        }
        if (!this.wasm.onRemoteKeyReceive) {
            this.wasm.onRemoteKeyReceive = (keyHex: string) => {
                log.debug('remote key received: ' + keyHex);
                if (this.credentialProvider) {
                    this.credentialProvider.remoteKey = keyHex;
                }
            };
        }
        if (!this.wasm.onAuthData) {
            this.wasm.onAuthData = (keyHex: string) => {
                log.debug('auth data received: ' + keyHex);
            };
        }
    }

    /**
     * Waits until the WASM client is ready
     */
    async waitTilReady(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let counter = 0;
            const interval = setInterval(() => {
                counter++;
                if (this.isReady) {
                    clearInterval(interval);
                    resolve();
                    log.info('The WASM client is ready');
                } else if (counter > 20) {
                    clearInterval(interval);
                    reject(new Error('Failed to load the WASM client'));
                }
            }, 500);
        });
    }

    /**
     * Connects to the LNC proxy server
     */
    async connect(credentialProvider?: CredentialProvider): Promise<void> {
        // Use provided credential provider or stored one
        const credentials = credentialProvider || this.credentialProvider;
        if (!credentials) {
            throw new Error('No credential provider available');
        }

        // Do not attempt to connect multiple times
        if (this.isConnected) {
            return;
        }

        // Ensure the WASM binary is loaded
        if (!this.isReady) {
            await this.run();
            await this.waitTilReady();
        }

        const { pairingPhrase, localKey, remoteKey, serverHost } = credentials;

        // Connect to the server
        this.wasm.wasmClientConnectServer(
            serverHost,
            false,
            pairingPhrase,
            localKey,
            remoteKey
        );

        // Add an event listener to disconnect if the page is unloaded
        if (typeof window !== 'undefined') {
            window.addEventListener('unload', this.wasm.wasmClientDisconnect);
        } else {
            log.info('No unload event listener added. window is not available');
        }

        // Wait for connection to be established
        await this.waitForConnection(credentials);
    }

    /**
     * Initiate the initial pairing process with the LNC proxy server
     */
    async pair(
        pairingPhrase: string,
        credentialProvider?: CredentialProvider
    ): Promise<void> {
        const credentials = credentialProvider || this.credentialProvider;
        if (!credentials) {
            throw new Error('No credential provider available');
        }

        credentials.pairingPhrase = pairingPhrase;
        await this.connect(credentials);
    }

    /**
     * Disconnects from the proxy server
     */
    disconnect(): void {
        this.wasm.wasmClientDisconnect();
    }

    /**
     * Wait for connection to be established
     */
    private async waitForConnection(
        credentials: CredentialProvider
    ): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            let counter = 0;
            const interval = setInterval(() => {
                counter++;
                if (this.isConnected) {
                    clearInterval(interval);
                    resolve();
                    log.info('The WASM client is connected to the server');

                    // Clear the in-memory credentials after connecting if the
                    // credentials are persisted in local storage
                    if (credentials.password) {
                        credentials.clear(true);
                    }
                } else if (counter > 20) {
                    clearInterval(interval);
                    reject(
                        new Error(
                            'Failed to connect the WASM client to the proxy server'
                        )
                    );
                }
            }, 500);
        });
    }

    /**
     * Emulates a GRPC request but uses the WASM client instead
     */
    request<TRes>(method: string, request?: object): Promise<TRes> {
        return new Promise((resolve, reject) => {
            log.debug(`${method} request`, request);
            const reqJSON = JSON.stringify(request || {});
            this.wasm.wasmClientInvokeRPC(
                method,
                reqJSON,
                (response: string) => {
                    try {
                        const rawRes = JSON.parse(response);
                        const res = snakeKeysToCamel(rawRes);
                        log.debug(`${method} response`, res);
                        resolve(res as TRes);
                    } catch (error) {
                        log.debug(`${method} raw response`, response);
                        reject(new Error(response));
                        return;
                    }
                }
            );
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

    // State getters
    get isReady(): boolean {
        return (
            this.wasm &&
            this.wasm.wasmClientIsReady &&
            this.wasm.wasmClientIsReady()
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
            this.wasm &&
            this.wasm.wasmClientStatus &&
            this.wasm.wasmClientStatus()
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
}
