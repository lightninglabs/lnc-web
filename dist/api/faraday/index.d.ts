import WasmClient from './../../index';
import BaseApi from './../base';
/** the names and argument types for the subscription events */
interface FaradayEvents {
}
/**
 * An API wrapper to communicate with the Faraday node via GRPC
 */
declare class FaradayApi extends BaseApi<FaradayEvents> {
    _wasm: WasmClient;
    faradayServer: any;
    constructor(wasm: WasmClient);
}
export default FaradayApi;
