import {
    FaradayApi,
    LndApi,
    LoopApi,
    PoolApi,
    snakeKeysToCamel
} from '@lightninglabs/lnc-core';
import { createRpc } from './api/createRpc';
import { CredentialStore, LncConfig, WasmGlobal } from './types/lnc';
import LncCredentialStore from './util/credentialStore';
import { wasmLog as log } from './util/log';

/** The default values for the LncConfig options */
const DEFAULT_CONFIG = {
    wasmClientCode: 'https://lightning.engineering/lnc-v0.2.2-alpha.wasm',
    namespace: 'default',
    serverHost: 'mailbox.terminal.lightning.today:443'
} as Required<LncConfig>;

export default class LNC {
    go: any;
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

    constructor(lncConfig?: LncConfig) {
        // merge the passed in config with the defaults
        const config = Object.assign({}, DEFAULT_CONFIG, lncConfig);

        this._wasmClientCode = config.wasmClientCode;
        this._namespace = config.namespace;

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

        // TODO: pull Go off of the global state
        const g = global || window || self;
        this.go = new g.Go();

        this.lnd = new LndApi(createRpc, this);
        this.loop = new LoopApi(createRpc, this);
        this.pool = new PoolApi(createRpc, this);
        this.faraday = new FaradayApi(createRpc, this);
    }

    private get wasm() {
        return globalThis[this._namespace] as WasmGlobal;
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

        global.onLocalPrivCreate = (keyHex: string) => {
            log.debug('local private key created: ' + keyHex);
            this.credentials.localKey = keyHex;
        };

        global.onRemoteKeyReceive = (keyHex: string) => {
            log.debug('remote key received: ' + keyHex);
            this.credentials.remoteKey = keyHex;
        };

        global.onAuthData = (keyHex: string) => {
            log.debug('auth data received: ' + keyHex);
        };

        this.go.argv = [
            'wasm-client',
            '--debuglevel=trace',
            '--namespace=' + this._namespace,
            '--onlocalprivcreate=onLocalPrivCreate',
            '--onremotekeyreceive=onRemoteKeyReceive',
            '--onauthdata=onAuthData'
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
     * Disconnects from the proxy server
     */
    disconnect() {
        this.wasm.wasmClientDisconnect();
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
