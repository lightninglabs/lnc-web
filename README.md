# @lightninglabs/lnc-web

## A npm module for Lightning Node Connect

## API Design
#### Set-up and connection

The constructor for the LNC object takes a parameters object with the three following fields:

- `pairingPhrase` (string, required): Your LNC pairing phrase
- `serverHost` (string): Specify a custom Lightning Node Connect proxy server. If not specified we'll default to `mailbox.terminal.lightning.today:443`.
- `wasmClientCode` (string): Custom location for the WASM client code. Can be remote or local. If not specified we’ll default to our instance on our CDN.
- `namespace` (string): JavaScript namespace used for the main WASM calls. You can maintain multiple connections if you use different namespaces. If not specified we'll default to `default`.
- `password` (string): By default, this module will handle storage of your local and remote keys for you in local storage. We highly recommend encrypting that data with a password you set here.
- `localKey` (string): local private key; part of the second handshake authentication process. Only need to specify this if you handle storage of auth data yourself and set `onLocalPrivCreate`.
- `remoteKey` (string): remote public key; part of the second handshake authentication process. Only need to specify this if you handle storage of auth data yourself and set `onRemoteKeyReceive`.
- `onLocalPrivCreate` (Function): override method for the storage of the local private key. This gets called when first load the WASM without an existing local private key.
- `onRemoteKeyReceive` (Function): override method for the storage of the remote public key. This gets called when first connecting without an existing local private key.

```
import LNC from ‘@lightninglabs/lnc-web’;

const pairingPhrase = ‘artefact morning piano photo consider light’;
const password = 'u*E0F?gU\d($N&Ckh8u)tLm';

// default connection using WASM from CDN
// WASM loaded on object creation
// default host: mailbox.terminal.lightning.today:443
// password used for encrypting credentials
const lnc = new LNC({
   pairingPhrase,
   password
});

// using custom Lightning Node Connect proxy server
const lnc = new LNC({
   pairingPhrase,
   serverHost: ‘custom.lnd-server.host:443’
});

// using WASM pulled into app
const lnc = new LNC({
   pairingPhrase,
   wasmClientCode: ‘​​wasm-client.wasm’
});

// using WASM from external link
const lnc = new LNC({
   pairingPhrase,
   wasmClientCode: ‘https://dev.example/wasm-client.wasm’
});

// check ready status
lnc.isReady();

// connect
lnc.connect();

// check connection status
lnc.isConnected();

// disconnect
lnc.disconnect();
```

#### Base functions

All of the services (lnd, loop, pool, faraday) will be objects under the main lnc object. Each services’ sub-services will be underneath each service object, and each sub-service function below that (except in the case of faraday which only has one service - its functions will live directly under it). All service names and function names will be camel-cased.

```
const { lnd, loop, pool, faraday } = lnc;

// all functions on the base object should have proper types
// sub-servers exist as objects on each main service
lnd.lightning.listInvoices();
lnd.lightning.connectPeer(‘03aa49c1e98ff4f216d886c09da9961c516aca22812c108af1b187896ded89807e@m3keajflswtfq3bw4kzvxtbru7r4z4cp5stlreppdllhp5a7vuvjzqyd.onion:9735’);

const signature = lnd.signer.signMessage({...params});

const swaps = await loop.swapClient.listSwaps();
const poolAccount = await pool.trader.initAccount(100000000, 1000);

const insights = await faraday.channelInsights();
```


#### Subscriptions

```
const { lnd } = lnc;

// handle subscriptions
lnd.lightning.subscribeTransactions(
   params,
   transaction => handleNewData(transaction),
   error => handleError(error),
);

lnd.lightning.subscribeChannelEvents(
   params,
   event => handleNewChannelEventData(event),
   error => handleError(error),
);
```

## Updating protos

First, update the service version under the `config` block in `package.json`.

eg.

```
"config": {
    "lnd_release_tag": "v0.14.2-beta",
    "loop_release_tag": "v0.17.0-beta",
    "pool_release_tag": "v0.5.5-alpha",
    "faraday_release_tag": "v0.2.5-alpha",
    "protoc_version": "3.15.8"
},
```

Then run the following commands:

```
# download schemas
npm run update-protos
# format schemas
npm run generate
```
