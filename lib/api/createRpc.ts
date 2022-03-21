import WasmClient from './../index';
import { capitalize } from '../util/strings';

/**
 * An API wrapper to communicate with the LND node via GRPC
 */
function createRpc<T extends unknown>(wasm: WasmClient, service: any): any {
    return new Proxy(service, {
        get(target, key, c) {
            // make sure funcs are camelcased
            const requestName = capitalize(key.toString());

            const call = service[requestName];

            return async function (request: any): Promise<any> {
                const res = await wasm.request(call, request);
                return res.toObject();
            };
        }
    });
}

export default createRpc;
