import { useEffect, useState } from 'react';
import useLNC from './useLNC';

export const useAutoConnect = () => {
  const { lnc, login, auth } = useLNC();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Automatic session login when session is available and restoration is complete
  useEffect(() => {
    if (
        auth.hasActiveSession &&
        auth.isUnlocked &&
        !lnc.isConnected) {
      console.log('🚀 [Home] Auto-connecting with restored session...');
      const autoConnect = async () => {
        try {
          setLoading(true);
          setError('');
          await login({ method: 'session' });
          console.log('✅ [Home] Session auto-connect successful!');
        } catch (err) {
          console.error('❌ [Home] Session auto-connect failed:', err);
          setError(`Session auto-connect failed: ${(err as Error).message}`);
        } finally {
          setLoading(false);
        }
      };
      autoConnect();
    }
  }, [auth.hasActiveSession, auth.isUnlocked, lnc.isConnected, login]);

  return { loading, error };
};