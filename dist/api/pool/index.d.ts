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
    subscribe(call: any, request: any, callback?: Function): void;
}
export default PoolApi;
