import {
    FaradayApi,
    LitApi,
    LndApi,
    LoopApi,
    PoolApi,
    snakeKeysToCamel,
    TaprootAssetsApi
} from '@lightninglabs/lnc-core';
import { createRpc } from './api/createRpc';
import { PasskeyEncryptionService } from './encryption/passkeyEncryptionService';
import SessionManager from './sessions/sessionManager';
import UnifiedCredentialStore from './stores/unifiedCredentialStore';
import {
    ClearOptions,
    CredentialStore,
    LncConfig,
    UnlockOptions,
    WasmGlobal
} from './types/lnc';
import LncCredentialStore from './util/credentialStore';
import { wasmLog as log } from './util/log';

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

/** The default values for the LncConfig options */
export const DEFAULT_CONFIG = {
    wasmClientCode: 'https://lightning.engineering/lnc-v0.3.4-alpha.wasm',
    namespace: 'default',
    serverHost: 'mailbox.terminal.lightning.today:443'
} as Required<LncConfig>;

export default class LNC {
    go: GoInstance;
    result?: {
        module: WebAssembly.Module;
        instance: WebAssembly.Instance;
    };

    _wasmClientCode: any;
    _namespace: string;
    credentials: CredentialStore;

    lnd: LndApi;
    loop: LoopApi;
    pool: PoolApi;
    faraday: FaradayApi;
    tapd: TaprootAssetsApi;
    lit: LitApi;

    constructor(lncConfig?: LncConfig) {
        // merge the passed in config with the defaults
        const config = Object.assign({}, DEFAULT_CONFIG, lncConfig);

        this._wasmClientCode = config.wasmClientCode;
        this._namespace = config.namespace;

        if (config.credentialStore) {
            this.credentials = config.credentialStore;
        } else if (config.enableSessions || config.allowPasskeys) {
            this.credentials = this.createUnifiedStore(config);
        } else {
            // Use original LncCredentialStore for basic functionality
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

        // Pull Go off of the global object. This is injected by the wasm_exec.js file.
        this.go = new lncGlobal.Go();

        this.lnd = new LndApi(createRpc, this);
        this.loop = new LoopApi(createRpc, this);
        this.pool = new PoolApi(createRpc, this);
        this.faraday = new FaradayApi(createRpc, this);
        this.tapd = new TaprootAssetsApi(createRpc, this);
        this.lit = new LitApi(createRpc, this);
    }

    private createUnifiedStore(config: LncConfig): UnifiedCredentialStore {
        // Use UnifiedCredentialStore with strategy pattern
        // Create session manager if sessions are enabled
        let sessionManager: SessionManager | undefined;
        if (config.enableSessions) {
            const namespace = config.namespace || 'default';
            const ttl = config.sessionTTL || 24 * 60 * 60 * 1000; // 24 hours default

            // Create SessionManager with session configuration
            const sessionConfig = {
                sessionDuration: ttl,
                requireUserGesture: false,
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

        const credentials = new UnifiedCredentialStore(config, sessionManager);

        // Set initial values from config
        if (!credentials.isPaired && config.serverHost) {
            credentials.serverHost = config.serverHost;
        }
        if (config.pairingPhrase) {
            credentials.pairingPhrase = config.pairingPhrase;
        }

        return credentials;
    }

    async performAutoLogin(): Promise<boolean> {
        if (this.unifiedStore) {
            return (
                (await this.unifiedStore.canAutoRestore()) &&
                (await this.unifiedStore.tryAutoRestore())
            );
        }
        return false;
    }

    /**
     * Clear the stored credentials from session and local storage
     * @param options.session - clear the session credentials (default: true)
     * @param options.persisted - clear the persisted credentials (default: false)
     */
    async clear(options?: ClearOptions) {
        const { session = true, persisted = false } = options || {};

        if (session) {
            console.log('[LNC] clearing session credentials');
            this.unifiedStore?.clearSession();
        }

        if (persisted) {
            console.log('[LNC] clearing persisted credentials');
            this.unifiedStore?.clear();
        }
    }

    /**
     * Get authentication information including unlock status and available methods
     */
    async getAuthenticationInfo() {
        if (this.unifiedStore) {
            return await this.unifiedStore.getAuthenticationInfo();
        }
        // Fallback for legacy credential store
        return {
            isUnlocked: !!this.credentials.password,
            hasStoredCredentials: this.credentials.isPaired,
            hasActiveSession: false,
            supportsPasskeys: false,
            hasPasskey: false,
            preferredUnlockMethod: 'password' as const
        };
    }

    /**
     * Unlock the credential store using the specified method
     */
    async unlock(options: UnlockOptions) {
        if (this.unifiedStore) {
            return await this.unifiedStore.unlock(options);
        }
        // Fallback for legacy credential store
        if (options.method === 'password' && options.password) {
            try {
                this.credentials.password = options.password;
                return true;
            } catch (error) {
                console.error('Legacy unlock failed:', error);
                return false;
            }
        }
        return false;
    }

    get isUnlocked(): boolean {
        // Check if credentials have an isUnlocked property (UnifiedCredentialStore)
        if (this.unifiedStore) {
            return this.unifiedStore.isUnlocked();
        }
        // Fallback: check if password is set (legacy credential store)
        return !!this.credentials.password;
    }

    get isPaired(): boolean {
        return this.credentials.isPaired;
    }

    /**
     * Get the unified credential store if available, null otherwise
     */
    private get unifiedStore(): UnifiedCredentialStore | undefined {
        return this.credentials instanceof UnifiedCredentialStore
            ? (this.credentials as UnifiedCredentialStore)
            : undefined;
    }

    /**
     * Check if passkeys are supported in the current environment
     */
    static async isPasskeySupported(): Promise<boolean> {
        return await PasskeyEncryptionService.isSupported();
    }

    /**
     * Check if the current configuration supports passkeys
     */
    async supportsPasskeys(): Promise<boolean> {
        if (this.unifiedStore) {
            const authInfo = await this.unifiedStore.getAuthenticationInfo();
            return authInfo.supportsPasskeys;
        }
        return false;
    }

    private get wasm() {
        // This cast is needed to avoid type errors when accessing the WASM client that
        // is set when running the WASM client binary.
        return (globalThis as any)[this._namespace] as WasmGlobal;
    }

    private set wasm(value: WasmGlobal) {
        (globalThis as any)[this._namespace] = value;
    }

    get isReady() {
        return (
            this.wasm &&
            this.wasm.wasmClientIsReady &&
            this.wasm.wasmClientIsReady()
        );
    }

    get isConnected() {
        return (
            this.wasm &&
            this.wasm.wasmClientIsConnected &&
            this.wasm.wasmClientIsConnected()
        );
    }

    get status() {
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

    get isReadOnly() {
        return (
            this.wasm &&
            this.wasm.wasmClientIsReadOnly &&
            this.wasm.wasmClientIsReadOnly()
        );
    }

    hasPerms(permission: string) {
        return (
            this.wasm &&
            this.wasm.wasmClientHasPerms &&
            this.wasm.wasmClientHasPerms(permission)
        );
    }

    /**
     * Downloads the WASM client binary
     */
    async preload() {
        this.result = await WebAssembly.instantiateStreaming(
            fetch(this._wasmClientCode),
            this.go.importObject
        );
        log.info('downloaded WASM file');
    }

    /**
     * Loads keys from storage and runs the Wasm client binary
     */
    async run() {
        // make sure the WASM client binary is downloaded first
        if (!this.isReady) await this.preload();

        // create the namespace object in the global scope if it doesn't exist
        // so that we can assign the WASM callbacks to it
        if (typeof this.wasm !== 'object') {
            this.wasm = {} as WasmGlobal;
        }

        // assign the WASM callbacks to the namespace object if they haven't
        // already been assigned by the consuming app
        if (!this.wasm.onLocalPrivCreate) {
            this.wasm.onLocalPrivCreate = (keyHex: string) => {
                log.debug('local private key created: ' + keyHex);
                this.credentials.localKey = keyHex;
            };
        }
        if (!this.wasm.onRemoteKeyReceive) {
            this.wasm.onRemoteKeyReceive = (keyHex: string) => {
                log.debug('remote key received: ' + keyHex);
                this.credentials.remoteKey = keyHex;
            };
        }
        if (!this.wasm.onAuthData) {
            this.wasm.onAuthData = (keyHex: string) => {
                log.debug('auth data received: ' + keyHex);
            };
        }

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
     * Connects to the LNC proxy server
     * @returns a promise that resolves when the connection is established
     */
    async connect() {
        // do not attempt to connect multiple times
        if (this.isConnected) return;

        // ensure the WASM binary is loaded
        if (!this.isReady) {
            await this.run();
            await this.waitTilReady();
        }

        const { pairingPhrase, localKey, remoteKey, serverHost } =
            this.credentials;

        // connect to the server
        this.wasm.wasmClientConnectServer(
            serverHost,
            false,
            pairingPhrase,
            localKey,
            remoteKey
        );

        // add an event listener to disconnect if the page is unloaded
        if (typeof window !== 'undefined') {
            window.addEventListener('unload', this.wasm.wasmClientDisconnect);
        } else {
            log.info('No unload event listener added. window is not available');
        }

        // repeatedly check if the connection was successful
        return new Promise<void>((resolve, reject) => {
            let counter = 0;
            const interval = setInterval(() => {
                counter++;
                if (this.isConnected) {
                    clearInterval(interval);
                    resolve();
                    log.info('The WASM client is connected to the server');

                    // clear the in-memory credentials after connecting if the
                    // credentials are persisted in local storage
                    if (this.credentials.password) {
                        this.credentials.clear(true);
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
     * Initiate the initial pairing process with the LNC proxy server using the
     * provided pairing phrase.
     */
    async pair(pairingPhrase: string) {
        this.credentials.pairingPhrase = pairingPhrase;
        await this.connect();
    }

    /**
     * Disconnects from the proxy server
     */
    disconnect() {
        this.wasm.wasmClientDisconnect();
    }

    /**
     * Persists the current connection credentials using password encryption.
     * This automatically saves encrypted credentials to localStorage and creates
     * a session if sessions are enabled.
     */
    async persistWithPassword(password: string): Promise<void> {
        if (!this.credentials) {
            throw new Error('No credentials store available');
        }

        // Check if we're using the new UnifiedCredentialStore or legacy store
        if (
            'unlock' in this.credentials &&
            typeof this.credentials.unlock === 'function'
        ) {
            // New UnifiedCredentialStore - use repository pattern
            const unlocked = await this.credentials.unlock({
                method: 'password',
                password: password
            });

            if (!unlocked) {
                throw new Error('Failed to unlock credentials with password');
            }

            // Save credentials and create session
            await this.credentials.createSessionAfterConnection?.();
        } else {
            // Legacy LncCredentialStore - just set password (it auto-persists)
            (this.credentials as any).password = password;
        }
    }

    /**
     * Persists the current connection credentials using passkey encryption.
     * This prompts the user to create/use a passkey, saves encrypted credentials
     * to localStorage, and creates a session if sessions are enabled.
     */
    async persistWithPasskey(): Promise<void> {
        if (!this.credentials) {
            throw new Error('No credentials store available');
        }

        // Check if we're using the new UnifiedCredentialStore or legacy store
        if (
            'unlock' in this.credentials &&
            typeof this.credentials.unlock === 'function'
        ) {
            // New UnifiedCredentialStore - use repository pattern
            const unlocked = await this.credentials.unlock({
                method: 'passkey',
                createIfMissing: true
            });

            if (!unlocked) {
                throw new Error('Failed to create/use passkey for credentials');
            }

            // Save credentials and create session
            await this.credentials.createSessionAfterConnection?.();
        } else {
            throw new Error(
                'Passkey authentication requires the new credential store (enable sessions or passkeys)'
            );
        }
    }

    /**
     * Waits until the WASM client is executed and ready to accept connection info
     */
    async waitTilReady() {
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
     * Emulates a GRPC request but uses the WASM client instead to communicate with the LND node
     * @param method the GRPC method to call on the service
     * @param request The GRPC request message to send
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
                        // log.debug(`${method} raw response`, rawRes);
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
}
