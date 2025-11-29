import { useCallback } from 'react';
import LNC from '@lightninglabs/lnc-web';

// create a singleton instance of LNC that will live for the lifetime of the app
// useUnifiedStore enables the new strategy-based authentication
const lnc = new LNC({ useUnifiedStore: true });

/**
 * A hook that exposes a single LNC instance of LNC to all component that need it.
 * It also returns a couple helper functions to simplify the usage of LNC
 */
const useLNC = () => {
  /** Connects to LNC using the provided pairing phrase and password */
  const connect = useCallback(async (pairingPhrase: string, password: string) => {
    lnc.credentials.pairingPhrase = pairingPhrase;
    await lnc.connect();
    // verify we can fetch data
    await lnc.lnd.lightning.listChannels();
    // persist credentials with password encryption after confirming the connection works
    await lnc.persistWithPassword(password);
  }, []);

  /** Connects to LNC using the password to decrypt the stored keys */
  const login = useCallback(async (password: string) => {
    // unlock credentials using password
    const unlocked = await lnc.unlock({ method: 'password', password });
    if (!unlocked) {
      throw new Error('Failed to unlock credentials. Check your password.');
    }
    await lnc.connect();
  }, []);

  return { lnc, connect, login };
};

export default useLNC;
