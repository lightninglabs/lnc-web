import './App.css';
import LNC from '@lightninglabs/lnc-web';

function App() {
  const lnc = new LNC({
      pairingPhrase: 'domain panther column trade crater health evil report ill service',
      password: 'Dm9lfaWmo92Q#m9f'
  });

  // Main

  const isConnected = () => console.log(lnc.isConnected);
  const isReady = () => console.log(lnc.isReady);
  const load = () => lnc.preload();
  const run = () => lnc.run();
  const connect = () => lnc.connect();
  const disconnect = () => lnc.disconnect();

  const { lightning } = lnc.lnd;
  const { swapClient } = lnc.loop;
  const { trader } = lnc.pool;
  const { faradayServer } = lnc.faraday;

  // LND

  const getInfo = async() => {
      const info = await lightning.getInfo();
      console.log(info);
  };
  const listChannels = async() => {
      const channels = await lightning.listChannels();
      console.log(channels);
  };
  const listPeers = async() => {
      const peers = await lightning.listPeers();
      console.log(peers);
  };
  const disconnectPeer = async() => {
      const channels = await lightning.disconnectPeer({ pubKey: '031b301307574bbe9b9ac7b79cbe1700e31e544513eae0b5d7497483083f99e581' });
      console.log(channels);
  };
  const newAddress = async() => {
      const address = await lightning.newAddress({ type: 'WITNESS_PUBKEY_HASH' });
      console.log(address);
  };
  const lookupInvoice = async() => {
      const invoice = await lightning.lookupInvoice({ rHashStr: 'f21981515ef639a86642f64cbe9f844c5286aad18b57441627f37103b7fa32ea' });
      console.log(invoice);
  };

  // Streaming

  const logger = (data) => {
      console.log('logger', data);
  };

  const subscribePeerEvents = () => {
      lightning.subscribePeerEvents({}, logger);
  };

  // Loop

  const loopInTerms = async() => {
      const terms = await swapClient.getLoopInTerms();
      console.log(terms);
  };

  // Pool

  const auctionFee = async() => {
      const fee = await trader.auctionFee();
      console.log(fee);
  };

  // Faraday

  const channelInsights = async() => {
      const insights = await faradayServer.channelInsights();
      console.log(insights);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Main</h1>
        <button onClick={() => isReady()}>isReady</button>
        <button onClick={() => isConnected()}>isConnected</button>
        <button onClick={() => load()}>Load</button>
        <button onClick={() => run()}>Run</button>
        <button onClick={() => connect()}>Connect</button>
        <button onClick={() => disconnect()}>Disconnect</button>
        <h1>LND</h1>
        <button onClick={() => getInfo()}>getInfo</button>
        <button onClick={() => newAddress()}>newAddress</button>
        <button onClick={() => lookupInvoice()}>lookupInvoice</button>
        <button onClick={() => listChannels()}>listChannels</button>
        <button onClick={() => listPeers()}>listPeers</button>
        <button onClick={() => disconnectPeer()}>disconnectPeer</button>
        <button onClick={() => subscribePeerEvents()}>subscribePeerEvents</button>
        <h1>Loop</h1>
        <button onClick={() => loopInTerms()}>loopInTerms</button>
        <h1>Pool</h1>
        <button onClick={() => auctionFee()}>auctionFee</button>
        <h1>Faraday</h1>
        <button onClick={() => channelInsights()}>channelInsights</button>
      </header>
    </div>
  );
}

export default App;
