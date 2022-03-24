import { ProtobufMessage } from '@improbable-eng/grpc-web/dist/typings/message';
import { MethodDefinition, UnaryMethodDefinition } from '@improbable-eng/grpc-web/dist/typings/service';
interface LncConstructor {
    serverHost?: string;
    pairingPhrase: string;
    wasmClientCode: any;
}
export default class LNC {
    go: any;
    mod?: WebAssembly.Module;
    inst?: WebAssembly.Instance;
    _serverHost: string;
    _pairingPhrase: string;
    _wasmClientCode: any;
    lnd: any;
    loop: any;
    pool: any;
    faraday: any;
    constructor(config: LncConstructor);
    get isReady(): boolean;
    get isConnected(): boolean;
    /**
     * Downloads the WASM client binary and run
     */
    load(): Promise<void>;
    /**
     * Connects to the proxy server
     * @param server the host:ip of the proxy server
     * @param phrase the pairing phrase
     * @returns a promise that resolves when the connection is established
     */
    connect(server?: string, phrase?: string): Promise<void>;
    /**
     * Disconnects from the proxy server
     */
    disconnect(): void;
    /**
     * Waits until the WASM client is executed and ready to accept connection info
     */
    waitTilReady(): Promise<void>;
    /**
     * Emulates a GRPC request but uses the WASM client instead to communicate with the LND node
     * @param methodDescriptor the GRPC method to call on the service
     * @param request The GRPC request message to send
     */
    request<TReq extends ProtobufMessage, TRes extends ProtobufMessage>(methodDescriptor: UnaryMethodDefinition<TReq, TRes>, request: any): Promise<TRes>;
    /**
     * Subscribes to a GRPC server-streaming endpoint and executes the `onMessage` handler
     * when a new message is received from the server
     * @param methodDescriptor the GRPC method to call on the service
     * @param request the GRPC request message to send
     * @param onMessage the callback function to execute when a new message is received
     * @param metadata headers to include with the request
     */
    subscribe<TReq extends ProtobufMessage, TRes extends ProtobufMessage>(methodDescriptor: MethodDefinition<TReq, TRes>, request: TReq, onMessage: (res: TRes) => void): void;
    /** the names of keys in RPC responses that should have the 'Map' suffix */
    mapKeys: string[];
    /**
     * HACK: fixes an mismatch between GRPC types and the responses returned from the WASM client.
     * Specifically, the List and Map values
     * @param response the RPC response from the WASM client
     */
    hackListsAndMaps(response: any): Record<string, any>;
    /**
     * HACK: Modifies a GRPC request object to be compatible with the WASM client.
     * This will need to be fixed in the TC proto compilation
     */
    hackRequest(request: any): Record<string, any>;
}
export {};
