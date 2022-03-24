import WasmClient from './../index';
/**
 * An API wrapper to communicate with the LND node via GRPC
 */
declare function createRpc<T extends unknown>(wasm: WasmClient, service: any, subscriptions?: any): any;
export default createRpc;
