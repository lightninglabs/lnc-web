import { subscriptionMethods } from '@lightninglabs/lnc-core';

/**
 * Structural type for any object that can handle RPC requests and subscriptions.
 * Both LNC and LightningNodeConnect satisfy this contract.
 */
export type RpcClient = {
  request<TRes>(method: string, request?: object): Promise<TRes>;
  subscribe<TRes>(
    method: string,
    request?: object,
    onMessage?: (res: TRes) => void,
    onError?: (res: Error) => void
  ): void;
};

// capitalize the first letter in the string
const capitalize = (s: string) => s && s[0].toUpperCase() + s.slice(1);

/**
 * Creates a typed Proxy object which calls the WASM request or
 * subscribe methods depending on which function is called on the object
 */
export function createRpc<T extends object>(
  packageName: string,
  client: RpcClient
): T {
  const rpc = {};
  return new Proxy(rpc, {
    get(target, key) {
      const methodName = capitalize(key.toString());
      // the full name of the method (ex: lnrpc.Lightning.OpenChannel)
      const method = `${packageName}.${methodName}`;

      if (subscriptionMethods.includes(method)) {
        // call subscribe for streaming methods
        return (
          request: object,
          callback: (msg: object) => void,
          errCallback?: (err: Error) => void
        ): void => {
          client.subscribe(method, request, callback, errCallback);
        };
      } else {
        // call request for unary methods
        return async (request: object): Promise<unknown> => {
          return await client.request(method, request);
        };
      }
    }
  }) as T;
}

export default createRpc;
