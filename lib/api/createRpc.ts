import WasmClient from './../index';
import { capitalize } from '../util/strings';

import * as LND from '../types/generated/lightning_pb';
import { Lightning } from '../types/generated/lightning_pb_service';

/**
 * An API wrapper to communicate with the LND node via GRPC
 */
function createRpc<T extends unknown>(
    wasm: WasmClient,
    service: any,
    subscriptions?: any
): any {
    return new Proxy(service, {
        get(target, key, c) {
            // make sure funcs are camelcased
            const requestName = capitalize(key.toString());

            const call = service[requestName];
            if (call.responseStream) {
                if (subscriptions && subscriptions[key])
                    return subscriptions[key];
                return null;
            } else {
                return async function (request: any): Promise<any> {
                    const res = await wasm.request(call, request);
                    return res.toObject();
                };
            }
        }
    });
}

export default createRpc;
