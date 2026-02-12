import { useEffect, useState } from 'react';
import useLNC from './useLNC';

export const useAutoConnect = () => {
  const { lnc, login, auth } = useLNC();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (auth.hasActiveSession && !lnc.isConnected) {
      const autoConnect = async () => {
        try {
          setLoading(true);
          setError('');
          await login({ method: 'session' });
        } catch (err) {
          console.error('[useAutoConnect] Session auto-connect failed:', err);
          setError(`Session auto-connect failed: ${(err as Error).message}`);
        } finally {
          setLoading(false);
        }
      };

      autoConnect();
    }
  }, [auth.hasActiveSession, lnc.isConnected, login]);

  return { loading, error };
};
