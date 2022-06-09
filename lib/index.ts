// tslint:disable-next-line
require('./wasm_exec');

import { ProtobufMessage } from '@improbable-eng/grpc-web/dist/typings/message';
import {
    MethodDefinition,
    UnaryMethodDefinition
} from '@improbable-eng/grpc-web/dist/typings/service';

import isPlainObject from 'lodash/isPlainObject';
import { wasmLog as log } from './util/log';
import { isObject, camelKeysToSnake, snakeKeysToCamel } from './util/objects';
import { LndApi, LoopApi, PoolApi, FaradayApi } from './api';
import {
    createTestCipher,
    decrypt,
    encrypt,
    generateSalt,
    verifyTestCipher
} from './encryption';

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
        pairingPhrase: string,
        localKey?: string,
        remoteKey?: string
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
        callback: (response: string) => any
    ) => void;
}

export interface LncConstructor {
    /** Specify a custom Lightning Node Connect proxy server. If not specified we'll default to `mailbox.terminal.lightning.today:443`. */
    serverHost?: string;
    /** Your LNC pairing phrase */
    pairingPhrase?: string;
    /** local private key; part of the second handshake authentication process. Only need to specify this if you handle storage of auth data yourself and set `onLocalPrivCreate`. */
    localKey?: string;
    /** remote public key; part of the second handshake authentication process. Only need to specify this if you handle storage of auth data yourself and set `onRemoteKeyReceive`. */
    remoteKey?: string;
    /** Custom location for the WASM client code. Can be remote or local. If not specified we’ll default to our instance on our CDN. */
    wasmClientCode?: any; // URL or WASM client object
    /** JavaScript namespace used for the main WASM calls. You can maintain multiple connections if you use different namespaces. If not specified we'll default to `default`. */
    namespace?: string;
    /** By default, this module will handle storage of your local and remote keys for you in local storage. We highly recommend encrypting that data with a password you set here. */
    password?: string;
    /** override method for the storage of the local private key. This gets called when first load the WASM without an existing local private key. */
    onLocalPrivCreate?: (keyHex: string) => void;
    /** override method for the storage of the remote public key. This gets called when first connecting without an existing local private key. */
    onRemoteKeyReceive?: (keyHex: string) => void;
}

export default class LNC {
    go: any;
    result?: {
        module: WebAssembly.Module;
        instance: WebAssembly.Instance;
    };

    _serverHost: string;
    _pairingPhrase?: string;
    _localKey?: string;
    _remoteKey?: string;
    _wasmClientCode: any;
    _namespace: string;
    _password: string;
    _onLocalPrivCreate?: (keyHex: string) => void;
    _onRemoteKeyReceive?: (keyHex: string) => void;
    salt: string;
    testCipher: string;

    lnd: LndApi;
    loop: LoopApi;
    pool: PoolApi;
    faraday: FaradayApi;

    constructor(config: LncConstructor) {
        this._serverHost =
            config.serverHost || 'mailbox.terminal.lightning.today:443';
        this._pairingPhrase = config.pairingPhrase;
        this._localKey = config.localKey;
        this._remoteKey = config.remoteKey;
        this._wasmClientCode =
            config.wasmClientCode ||
            'https://lightning.engineering/lnc-v0.1.10-alpha.wasm';
        this._namespace = config.namespace || 'default';
        this._password = config.password || '';
        this._onLocalPrivCreate = config.onLocalPrivCreate;
        this._onRemoteKeyReceive = config.onRemoteKeyReceive;
        this.salt = '';
        this.testCipher = '';

        // load salt and testCipher from localStorage or generate new ones
        if (localStorage.getItem(`lnc-web:${this._namespace}:salt`)) {
            this.salt =
                localStorage.getItem(`lnc-web:${this._namespace}:salt`) || '';
        } else if (!this._onLocalPrivCreate && !this._onRemoteKeyReceive) {
            this.salt = generateSalt();
            localStorage.setItem(`lnc-web:${this._namespace}:salt`, this.salt);
        }

        if (localStorage.getItem(`lnc-web:${this._namespace}:testCipher`)) {
            this.testCipher =
                localStorage.getItem(`lnc-web:${this._namespace}:testCipher`) ||
                '';
        } else if (!this._onLocalPrivCreate && !this._onRemoteKeyReceive) {
            this.testCipher = createTestCipher(this._password, this.salt);
            localStorage.setItem(
                `lnc-web:${this._namespace}:testCipher`,
                this.testCipher
            );
        }

        // save pairingPhrase to localStorage for backwards compatibility
        if (this._pairingPhrase) {
            localStorage.setItem(
                `lnc-web:${this._namespace}:pairingPhrase`,
                this._password
                    ? encrypt(this._pairingPhrase, this._password, this.salt)
                    : this._pairingPhrase
            );
        }

        // TODO: pull Go off of the global state
        const g = global || window || self;
        this.go = new g.Go();

        this.lnd = new LndApi(this);
        this.loop = new LoopApi(this);
        this.pool = new PoolApi(this);
        this.faraday = new FaradayApi(this);
    }

    onLocalPrivCreate = (keyHex: string) => {
        log.debug('local private key created: ' + keyHex);
        localStorage.setItem(
            `lnc-web:${this._namespace}:localKey`,
            this._password ? encrypt(keyHex, this._password, this.salt) : keyHex
        );
    };

    onRemoteKeyReceive = (keyHex: string) => {
        log.debug('remote key received: ' + keyHex);
        localStorage.setItem(
            `lnc-web:${this._namespace}:remoteKey`,
            this._password ? encrypt(keyHex, this._password, this.salt) : keyHex
        );
    };

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

    setPairingPhrase(pairingPhrase: string) {
        this._pairingPhrase = pairingPhrase;
    }

    setLocalKey(localKey: string) {
        this._localKey = localKey;
    }

    setRemoteKey(remoteKey: string) {
        this._remoteKey = remoteKey;
    }

    setServerHost(serverHost: string) {
        this._serverHost = serverHost;
    }

    clearStorage = () =>
        Object.entries(localStorage)
            .map((x) => x[0])
            .filter((x) => x.substring(0, 8) === 'lnc-web:')
            .map((x) => localStorage.removeItem(x));

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

        global.onLocalPrivCreate =
            this._onLocalPrivCreate || this.onLocalPrivCreate;

        global.onRemoteKeyReceive =
            this._onRemoteKeyReceive || this.onRemoteKeyReceive;

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
     * Loads the local and remote keys
     * @returns an object containing the localKey and remoteKey
     */
    loadKeys() {
        let pairingPhrase = '';
        let localKey = '';
        let remoteKey = '';

        if (this._pairingPhrase) {
            pairingPhrase = this._pairingPhrase;
        } else if (
            localStorage.getItem(`lnc-web:${this._namespace}:pairingPhrase`)
        ) {
            const data = localStorage.getItem(
                `lnc-web:${this._namespace}:pairingPhrase`
            );
            if (!verifyTestCipher(this.testCipher, this._password, this.salt)) {
                throw new Error('Invalid Password');
            }
            pairingPhrase = this._password
                ? decrypt(data, this._password, this.salt)
                : data;
        }

        if (this._localKey) {
            localKey = this._localKey;
        } else if (
            localStorage.getItem(`lnc-web:${this._namespace}:localKey`)
        ) {
            const data = localStorage.getItem(
                `lnc-web:${this._namespace}:localKey`
            );
            if (!verifyTestCipher(this.testCipher, this._password, this.salt)) {
                throw new Error('Invalid Password');
            }
            localKey = this._password
                ? decrypt(data, this._password, this.salt)
                : data;
        }

        if (this._remoteKey) {
            remoteKey = this._remoteKey;
        } else if (
            localStorage.getItem(`lnc-web:${this._namespace}:remoteKey`)
        ) {
            const data = localStorage.getItem(
                `lnc-web:${this._namespace}:remoteKey`
            );
            if (!verifyTestCipher(this.testCipher, this._password, this.salt)) {
                throw new Error('Invalid password');
            }
            remoteKey = this._password
                ? decrypt(data, this._password, this.salt)
                : data;
        }

        log.debug('pairingPhrase', pairingPhrase);
        log.debug('localKey', localKey);
        log.debug('remoteKey', remoteKey);

        return { pairingPhrase, localKey, remoteKey };
    }

    /**
     * Connects to the proxy server
     * @param server the host:ip of the proxy server
     * @param phrase the pairing phrase
     * @returns a promise that resolves when the connection is established
     */
    async connect(server: string = this._serverHost) {
        // do not attempt to connect multiple times
        if (this.isConnected) return;

        await this.run();

        // ensure the WASM binary is loaded
        if (!this.isReady) await this.waitTilReady();

        const { pairingPhrase, localKey, remoteKey } = this.loadKeys();

        // connect to the server
        this.wasmNamespace.wasmClientConnectServer(
            server,
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
