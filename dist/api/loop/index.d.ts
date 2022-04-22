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
    subscribe(call: any, request: any, callback?: Function): void;
}
export default LoopApi;
