# @lightninglabs/lnc

## A npm module for Lightning Node Connect

### API Design
#### Set-up and connection

The constructor for the LNC object takes a parameters object with the three following fields:

- `pairingPhrase` (string, required): Your LNC pairing phrase
- `serverHost` (string): Specify a custom Lightning Node Connect proxy server. If not specified we'll default to `mailbox.terminal.lightning.today:443`
- `wasmClientCode` (string): Custom location for the WASM client code. Can be remote or local. If not specified we’ll default to our instance on our CDN.

```
import LNC from ‘@lightninglabs/lnc’;

const pairingPhrase = ‘artefact morning piano photo consider light’;

// default connection using WASM from CDN
// WASM loaded on object creation
// default host: mailbox.terminal.lightning.today:443
const lnc = new LNC({
   pairingPhrase
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
);

lnd.lightning.subscribeChannelEvents(
   params,
   event => handleNewChannelEventData(event),
);
```
