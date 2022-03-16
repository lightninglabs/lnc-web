import WasmClient from './../index';

const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

/**
 * An API wrapper to communicate with the LND node via GRPC
 */
function createRpc<T extends unknown>(wasm: WasmClient, service: any): any {
    return new Proxy(service, {
        get(target, key, c) {
            // make sure funcs are camelcased
            const requestName = capitalize(key.toString());

            const targetFunc = async function (request: any): Promise<any> {
                const res = await wasm.request(service[requestName], request);
                return res.toObject();
            };
            return targetFunc;
        }
    });
}

export default createRpc;
