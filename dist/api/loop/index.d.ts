import * as LOOP from '../../types/generated/client_pb';
import WasmClient from './../../index';
import BaseApi from './../base';
/** the names and argument types for the subscription events */
interface LoopEvents {
    status: LOOP.SwapStatus.AsObject;
}
/**
 * An API wrapper to communicate with the Loop node via GRPC
 */
declare class LoopApi extends BaseApi<LoopEvents> {
    _wasm: WasmClient;
    swapClient: any;
    debug: any;
    constructor(wasm: WasmClient);
    /**
     * Downloads the WASM binary and initializes the executable
     */
    load(): Promise<void>;
    /**
     * Uses the WasmClient to connect to the backend LND node via a Terminal
     * Connect proxy server
     * @param server the proxy server to connect to
     * @param phrase the secret pairing phrase to use
     */
    connect(server: string, phrase: string): Promise<LOOP.SwapResponse.AsObject>;
    /**
     * Disconnects from the proxy server
     */
    disconnect(): void;
    subscribe(call: any, request: any, callback?: Function): void;
}
export default LoopApi;
