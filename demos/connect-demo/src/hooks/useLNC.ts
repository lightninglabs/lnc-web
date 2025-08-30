import { useCallback, useEffect, useState } from 'react';
import LNC, { AuthenticationInfo, UnlockOptions } from '@lightninglabs/lnc-web';

// create a singleton instance of LNC that will live for the lifetime of the app
const lnc = new LNC({
  namespace: 'demo',
  serverHost: 'localhost:11110',
  allowPasskeys: true,
  enableSessions: true,
  sessionTTL: 30 * 60 * 1000, // 30 minutes for testing
});

(globalThis as any).lnc = lnc;

/**
 * A hook that exposes a single LNC instance of LNC to all component that need it.
 * It also returns a couple helper functions to simplify the usage of LNC
 */
const useLNC = () => {
  const [auth, setAuth] = useState<AuthenticationInfo>({
    isUnlocked: false,
    hasStoredCredentials: false,
    hasActiveSession: false,
    supportsPasskeys: false,
    hasPasskey: false,
    preferredUnlockMethod: 'password',
  });

  useEffect(() => {
    const initializeAuthInfo = async () => {
      try {
        // Clean API: getAuthenticationInfo directly on lnc object
        const authInfo = await lnc.getAuthenticationInfo();
        if (authInfo) {
          setAuth(authInfo);
          console.log('[useLNC] setAuthInfo', authInfo);
        }
      } catch (error) {
        console.error('[useLNC] Failed to initialize auth info:', error);
      }
    };

    console.log('[useLNC] initializing auth info');
    initializeAuthInfo();
  }, []);

  const pair = useCallback(async (pairingPhrase: string, options: UnlockOptions) => {
    // pair with the node
    await lnc.pair(pairingPhrase);
    // verify we can fetch data
    await lnc.lnd.lightning.listChannels();

    if (options.method === 'password') {
      await lnc.persistWithPassword(options.password);
    } else if (options.method === 'passkey') {
      await lnc.persistWithPasskey();
    }

  }, []);

  const login = useCallback(async (options: UnlockOptions) => {
    if (options.method === 'password' || options.method === 'passkey') {
      const unlocked = await lnc.unlock(options);
      if (!unlocked) {
        throw new Error(`Failed to unlock with ${options.method}`);
      }
    }

    if (options.method === 'session' && !auth.isUnlocked) {
      console.log('[login] Cannot login with session if not unlocked');
      return;
    }

    await lnc.connect();
  }, [auth.isUnlocked]);

  const logout = useCallback(async () => {
    console.log('[logout] clearing session');
    await lnc.clear();
  }, []);

  return {
    lnc,
    pair,
    login,
    auth,
    logout,
  };
};

export default useLNC;
