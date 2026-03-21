/**
 * Shared connection options used by both legacy LNC and modern
 * LightningNodeConnect entrypoints.
 */
export interface BaseConnectionConfig {
  /**
   * Specify a custom Lightning Node Connect proxy server. If not specified we'll
   * default to `mailbox.terminal.lightning.today:443`.
   */
  serverHost?: string;
  /**
   * Custom location for the WASM client code. Can be remote or local. If not
   * specified we'll default to our instance on our CDN.
   */
  wasmClientCode?: string;
  /**
   * JavaScript namespace used for the main WASM calls. You can maintain multiple
   * connections if you use different namespaces. If not specified we'll default
   * to `default`.
   */
  namespace?: string;
  /**
   * The LNC pairing phrase used to initialize the connection to the LNC proxy.
   */
  pairingPhrase?: string;
}
