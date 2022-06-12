export interface WasmGlobal {
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

export interface LncConfig {
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
