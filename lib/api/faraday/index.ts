import * as FARADAY from '../../types/generated/faraday_pb';

import { FaradayServer } from '../../types/generated/faraday_pb_service';

import WasmClient from './../../index';
import BaseApi from './../base';

import createRpc from './../createRpc';

/** the names and argument types for the subscription events */
interface FaradayEvents {}

/**
 * An API wrapper to communicate with the Faraday node via GRPC
 */
class FaradayApi extends BaseApi<FaradayEvents> {
    _wasm: WasmClient;
    // sub-services
    faradayServer: any;

    constructor(wasm: WasmClient) {
        super();
        this._wasm = wasm;
        this.faradayServer = createRpc(wasm, FaradayServer);
    }

    /**
     * Downloads the WASM binary and initializes the executable
     */
    async load() {
        if (!this._wasm.isReady) {
            await this._wasm.load();
        }
    }

    /**
     * Uses the WasmClient to connect to the backend LND node via a Terminal
     * Connect proxy server
     * @param server the proxy server to connect to
     * @param phrase the secret pairing phrase to use
     */
    async connect(
        server: string,
        phrase: string
    ): Promise<FARADAY.RevenueReportResponse.AsObject> {
        let connecting = true;

        // terminate the connection after a 15sec timeout
        setTimeout(() => {
            if (connecting) this.disconnect();
        }, 15 * 1000);

        await this._wasm.connect(server, phrase);

        try {
            // attempt to fetch data from the proxy to confirm it's functioning. if the
            // phrase is not valid, the getInfo request will hang until the timeout above
            // is reached. then an error will be thrown
            return await this.faradayServer.revenueReport();
        } catch {
            throw new Error(
                'Try reloading the page or obtaining a new pairing phrase.'
            );
        } finally {
            connecting = false;
        }
    }

    /**
     * Disconnects from the proxy server
     */
    disconnect() {
        this._wasm.disconnect();
    }
}

export default FaradayApi;
