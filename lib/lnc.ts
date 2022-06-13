import { ProtobufMessage } from '@improbable-eng/grpc-web/dist/typings/message';
import {
  MethodDefinition,
  UnaryMethodDefinition,
} from '@improbable-eng/grpc-web/dist/typings/service';
import isPlainObject from 'lodash/isPlainObject';
import { FaradayApi, LndApi, LoopApi, PoolApi } from './api';
import { CredentialStore, LncConfig, WasmGlobal } from './types/lnc';
import LncCredentialStore from './util/credentialStore';
import { wasmLog as log } from './util/log';
import { camelKeysToSnake, isObject, snakeKeysToCamel } from './util/objects';

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

    constructor(config: LncConfig) {
        this._wasmClientCode =
            config.wasmClientCode ||
            'https://lightning.engineering/lnc-v0.1.10-alpha.wasm';
        this._namespace = config.namespace || 'default';

        if (config.credentialStore) {
            this.credentials = config.credentialStore;
        } else {
            this.credentials = new LncCredentialStore(
                config.namespace,
                config.password
            );
            this.credentials.serverHost =
                config.serverHost || 'mailbox.terminal.lightning.today:443';
            if (config.pairingPhrase)
                this.credentials.pairingPhrase = config.pairingPhrase;
        }

        // TODO: pull Go off of the global state
        const g = global || window || self;
        this.go = new g.Go();

        this.lnd = new LndApi(this);
        this.loop = new LoopApi(this);
        this.pool = new PoolApi(this);
        this.faraday = new FaradayApi(this);
    }

    get wasmNamespace() {
        return window[this._namespace] as WasmGlobal;
    }

    get isReady() {
        return (
            this.wasmNamespace &&
            this.wasmNamespace.wasmClientIsReady &&
            this.wasmNamespace.wasmClientIsReady()
        );
    }

    get isConnected() {
        return (
            this.wasmNamespace &&
            this.wasmNamespace.wasmClientIsConnected &&
            this.wasmNamespace.wasmClientIsConnected()
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

        await this.run();

        // ensure the WASM binary is loaded
        if (!this.isReady) await this.waitTilReady();

        const { pairingPhrase, localKey, remoteKey, serverHost } =
            this.credentials;

        // connect to the server
        this.wasmNamespace.wasmClientConnectServer(
            serverHost,
            false,
            pairingPhrase,
            localKey,
            remoteKey
        );

        // add an event listener to disconnect if the page is unloaded
        window.addEventListener(
            'unload',
            this.wasmNamespace.wasmClientDisconnect
        );

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
                        'Failed to connect the WASM client to the proxy server'
                    );
                }
            }, 500);
        });
    }

    /**
     * Disconnects from the proxy server
     */
    disconnect() {
        this.wasmNamespace.wasmClientDisconnect();
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
                    reject('Failed to load the WASM client');
                }
            }, 500);
        });
    }

    /**
     * Emulates a GRPC request but uses the WASM client instead to communicate with the LND node
     * @param methodDescriptor the GRPC method to call on the service
     * @param request The GRPC request message to send
     */
    request<TReq extends ProtobufMessage, TRes extends ProtobufMessage>(
        methodDescriptor: UnaryMethodDefinition<TReq, TRes>,
        request: any
    ): Promise<TRes> {
        return new Promise((resolve, reject) => {
            const method = `${methodDescriptor.service.serviceName}.${methodDescriptor.methodName}`;

            const hackedReq = request ? this.hackRequest(request) : {};
            const reqJSON = JSON.stringify(hackedReq);

            this.wasmNamespace.wasmClientInvokeRPC(
                method,
                reqJSON,
                (response: string) => {
                    let rawRes: any;
                    try {
                        rawRes = JSON.parse(response);
                    } catch (error) {
                        log.debug(`${method} raw response`, response);
                        reject(new Error(response));
                        return;
                    }
                    const res = snakeKeysToCamel(rawRes);
                    const hackedRes = this.hackListsAndMaps(res);
                    log.debug(`${method} response`, res);
                    const msg = {
                        toObject: () => hackedRes
                    };
                    resolve(msg as TRes);
                }
            );
        });
    }

    /**
     * Subscribes to a GRPC server-streaming endpoint and executes the `onMessage` handler
     * when a new message is received from the server
     * @param methodDescriptor the GRPC method to call on the service
     * @param request the GRPC request message to send
     * @param onMessage the callback function to execute when a new message is received
     * @param onError the callback function to execute when an error is received
     */
    subscribe<TReq extends ProtobufMessage, TRes extends ProtobufMessage>(
        methodDescriptor: MethodDefinition<TReq, TRes>,
        request: TReq,
        onMessage: (res: TRes) => void,
        onError?: (res: Error) => void
    ) {
        const method = `${methodDescriptor.service.serviceName}.${methodDescriptor.methodName}`;
        log.debug(`${method} request`, request);
        const hackedReq = this.hackRequest(request);
        log.debug(`${method} hacked request`, hackedReq);
        const reqJSON = JSON.stringify(hackedReq);
        this.wasmNamespace.wasmClientInvokeRPC(
            method,
            reqJSON,
            (response: string) => {
                log.debug(`${method} raw response`, response);
                let rawRes: any;
                try {
                    rawRes = JSON.parse(response);
                    const res = snakeKeysToCamel(rawRes);
                    const hackedRes = this.hackListsAndMaps(res);
                    log.debug(`${method} response`, res);
                    const msg = {
                        toObject: () => hackedRes
                    };
                    onMessage(msg as TRes);
                } catch (error) {
                    log.debug(`${method} error`, error);
                    const err = new Error(response);
                    if (onError) onError(err);
                }
            }
        );
    }

    /** the names of keys in RPC responses that should have the 'Map' suffix */
    mapKeys: string[] = [
        'leaseDurationBuckets', // poolrpc.Trader.LeaseDurations
        'leaseDurations', // poolrpc.Trader.LeaseDurations
        'matchedMarkets', // poolrpc.Trader.BatchSnapshot
        'matchedOrders', // poolrpc.Trader.BatchSnapshot
        'routes' // lnrpc.Lightning.QueryRoutes
    ];

    /**
     * HACK: fixes an mismatch between GRPC types and the responses returned from the WASM client.
     * Specifically, the List and Map values
     * @param response the RPC response from the WASM client
     */
    hackListsAndMaps(response: any) {
        const o: Record<string, any> = {};
        return Object.entries<any>(response).reduce((updated, [key, value]) => {
            if (Array.isArray(value)) {
                updated[`${key}List`] = value;
            } else if (this.mapKeys.includes(key)) {
                // convert Maps from an object to an array of arrays
                // leaseDurationBuckets: { 2016: "MARKET_OPEN", 4032: "MARKET_OPEN" }
                // leaseDurationBucketsMap: [ [2016, 3], [4032, 3] ]
                updated[`${key}Map`] = Object.entries<any>(value).reduce(
                    (all, [k, v]) => {
                        all.push([
                            k,
                            isObject(v) ? this.hackListsAndMaps(v) : v
                        ]);
                        return all;
                    },
                    [] as any[]
                );
            } else if (isObject(value)) {
                // recurse into nested objects
                updated[key] = this.hackListsAndMaps(value);
            } else {
                updated[key] = value;
            }
            return updated;
        }, o);
    }

    /**
     * HACK: Modifies a GRPC request object to be compatible with the WASM client.
     * This will need to be fixed in the TC proto compilation
     */
    hackRequest(request: any) {
        const o: Record<string, any> = {};
        return Object.entries(request).reduce((updated, [key, value]) => {
            if (Array.isArray(value) && value.length === 0) {
                // omit empty arrays before checking for Lists & Maps
            } else if (key.endsWith('List')) {
                const newKey = key.substring(0, key.length - 'List'.length);
                updated[newKey] = value;
            } else if (key.endsWith('Map')) {
                const newKey = key.substring(0, key.length - 'Map'.length);
                updated[newKey] = value;
            } else if (key.startsWith('pb_')) {
                // fields that are JS keywords are generated with the 'pb_' prefix by protoc
                // ex: pb_private
                const newKey = key.substring('pb_'.length);
                updated[newKey] = value;
            } else if (typeof value === 'number' && value === 0) {
                // omit numeric fields who's value is zero
            } else if (
                typeof value === 'string' &&
                (value === '' || value === '0')
            ) {
                // omit string fields who's value is empty or zero
            } else if (isPlainObject(value)) {
                // also hack nested objects
                updated[key] = this.hackRequest(value);
            } else {
                updated[key] = value;
            }
            return camelKeysToSnake(updated);
        }, o);
    }
}
