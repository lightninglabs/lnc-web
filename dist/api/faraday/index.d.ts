import * as FARADAY from '../../types/generated/faraday_pb';
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
    connect(server: string, phrase: string): Promise<FARADAY.RevenueReportResponse.AsObject>;
    /**
     * Disconnects from the proxy server
     */
    disconnect(): void;
}
export default FaradayApi;
