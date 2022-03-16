require('./wasm_exec');

import { ProtobufMessage } from '@improbable-eng/grpc-web/dist/typings/message';
import {
    MethodDefinition,
    UnaryMethodDefinition
} from '@improbable-eng/grpc-web/dist/typings/service';

import isPlainObject from 'lodash/isPlainObject';
import { wasmLog as log } from './util/log';
import { isObject, snakeKeysToCamel } from './util/objects';
import { LndApi, LoopApi, PoolApi, FaradayApi } from './api';

// polyfill
if (!WebAssembly.instantiateStreaming) {
    WebAssembly.instantiateStreaming = async (resp, importObject) => {
        const source = await (await resp).arrayBuffer();
        return await WebAssembly.instantiate(source, importObject);
    };
}

interface WasmGlobal {
    /**
     * Returns true if the WASM client has been started and is ready to accept
     * connections
     */
    wasmClientIsReady: () => boolean;
    /**
     * Returns true if the WASM client is currently connected to the proxy server
     */
    wasmClientIsConnected: () => boolean;
    /**
     * Attempts to connect to the proxy server
     */
    wasmClientConnectServer: (
        serverHost: string,
        isDevServer: boolean,
        pairingPhrase: string
    ) => void;
    /**
     * disconnects from the proxy server
     */
    wasmClientDisconnect: () => void;
    /**
     * Invokes an RPC command with a request object and executes the provided callback
     * with the response
     */
    wasmClientInvokeRPC: (
        rpcName: string,
        request: any,
        callback: () => any
    ) => void;
}

/**
 * A reference to the `global` object with typings for the WASM functions
 */
const wasmGlobal: WasmGlobal = global as any;

interface LncConstructor {
    serverHost?: string;
    pairingPhrase: string;
    wasmClientCode: any; // URL or WASM client object
}

export default class LNC {
    go: any;
    mod?: WebAssembly.Module;
    inst?: WebAssembly.Instance;

    _serverHost: string;
    _pairingPhrase: string;
    _wasmClientCode: any;
    // TODO: add typings
    lnd: any;
    loop: any;
    pool: any;
    faraday: any;

    constructor(config: LncConstructor) {
        this._serverHost =
            config.serverHost || 'mailbox.terminal.lightning.today:443';
        this._pairingPhrase = config.pairingPhrase;
        // TODO: have CDN instance be fallback
        this._wasmClientCode =
            config.wasmClientCode ||
            'https://dev-website.example/wasm-client.wasm';
        // TODO: pull Go off of the global state
        const g = global || window || self;
        this.go = new g.Go();

        this.lnd = new LndApi(this);
        this.loop = new LoopApi(this);
        this.pool = new PoolApi(this);
        this.faraday = new FaradayApi(this);
    }

    get isReady() {
        return wasmGlobal.wasmClientIsReady && wasmGlobal.wasmClientIsReady();
    }

    get isConnected() {
        return (
            wasmGlobal.wasmClientIsConnected &&
            wasmGlobal.wasmClientIsConnected()
        );
    }

    /**
     * Downloads the WASM client binary and run
     */
    async load() {
        const result = await WebAssembly.instantiateStreaming(
            fetch('wasm-client.wasm'),
            // fetch('https://zeusln.app/wasm-client.wasm'),
            this.go.importObject
        );
        log.info('downloaded WASM file');

        this.go.argv = ['wasm-client', '--debuglevel=trace'];
        await this.go.run(result.instance);
        await WebAssembly.instantiate(result.module, this.go.importObject);
    }

    /**
     * Connects to the proxy server
     * @param server the host:ip of the proxy server
     * @param phrase the pairing phrase
     * @returns a promise that resolves when the connection is established
     */
    async connect(
        server: string = this._serverHost,
        phrase: string = this._pairingPhrase
    ) {
        // do not attempt to connect multiple times
        if (this.isConnected) return;

        // ensure the WASM binary is loaded
        if (!this.isReady) await this.waitTilReady();

        // connect to the server
        // TODO handle IS_DEV
        // wasmGlobal.wasmClientConnectServer(server, IS_DEV, phrase);
        wasmGlobal.wasmClientConnectServer(server, false, phrase);

        // add an event listener to disconnect if the page is unloaded
        global.addEventListener('unload', wasmGlobal.wasmClientDisconnect);

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
        wasmGlobal.wasmClientDisconnect();
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

            (global as any).wasmClientInvokeRPC(
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
     * @param metadata headers to include with the request
     */
    subscribe<TReq extends ProtobufMessage, TRes extends ProtobufMessage>(
        methodDescriptor: MethodDefinition<TReq, TRes>,
        request: TReq,
        onMessage: (res: TRes) => void
    ) {
        const method = `${methodDescriptor.service.serviceName}.${methodDescriptor.methodName}`;
        log.debug(`${method} request`, request.toObject());
        const hackedReq = this.hackRequest(request.toObject());
        log.debug(`${method} hacked request`, hackedReq);
        const reqJSON = JSON.stringify(hackedReq);
        (global as any).wasmClientInvokeRPC(
            method,
            reqJSON,
            (response: string) => {
                let rawRes: any;
                try {
                    rawRes = JSON.parse(response);
                } catch (error) {
                    log.debug(`${method} raw response`, response);
                    return;
                }
                const res = snakeKeysToCamel(rawRes);
                const hackedRes = this.hackListsAndMaps(res);
                log.debug(`${method} response`, res);
                const msg = {
                    toObject: () => hackedRes
                };
                onMessage(msg as TRes);
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
            return updated;
        }, o);
    }
}
