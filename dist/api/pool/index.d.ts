import * as POOL from '../../types/generated/trader_pb';
import * as HASHMAIL from '../../types/generated/auctioneerrpc/hashmail_pb';
import WasmClient from './../../index';
import BaseApi from './../base';
/** the names and argument types for the subscription events */
interface PoolEvents {
    cipherBox: HASHMAIL.CipherBox.AsObject;
}
/**
 * An API wrapper to communicate with the Pool node via GRPC
 */
declare class PoolApi extends BaseApi<PoolEvents> {
    _wasm: WasmClient;
    trader: any;
    channelAuctioneer: any;
    hashmail: any;
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
    connect(server: string, phrase: string): Promise<POOL.GetInfoResponse.AsObject>;
    /**
     * Disconnects from the proxy server
     */
    disconnect(): void;
    subscribe(call: any, request: any, callback?: Function): void;
}
export default PoolApi;
