import { describe, expect, it, vi } from 'vitest';
import { log } from '../util/log';
import { AuthenticationCoordinator } from './authenticationCoordinator';
import { AuthStrategy } from './authStrategy';
import { CredentialCache } from './credentialCache';
import { SessionCoordinator } from './sessionCoordinator';
import { StrategyManager } from './strategyManager';

const createStrategy = (method: AuthStrategy['method']) => ({
  method,
  isSupported: true,
  isUnlocked: true,
  hasAnyCredentials: false,
  unlock: vi.fn().mockResolvedValue(true),
  getCredential: vi.fn().mockResolvedValue(undefined),
  setCredential: vi.fn().mockResolvedValue(undefined),
  clear: vi.fn(),
  hasStoredAuthData: vi.fn()
});

const createSessionCoordinator = (overrides?: Partial<SessionCoordinator>) => {
  const base = {
    isSessionAvailable: true,
    createSession: vi.fn().mockResolvedValue(undefined),
    hasActiveSession: false,
    getTimeRemaining: vi.fn().mockResolvedValue(0),
    clearSession: vi.fn(),
    getSessionManager: vi.fn().mockReturnValue({
      restoreSession: vi.fn().mockResolvedValue({
        localKey: 'local',
        remoteKey: 'remote',
        pairingPhrase: 'pairing',
        serverHost: 'server',
        expiresAt: Date.now()
      }),
      config: { sessionDuration: 1000 }
    })
  };

  return Object.assign(base, overrides) as unknown as SessionCoordinator &
    Partial<SessionCoordinator> & {
      createSession: ReturnType<typeof vi.fn>;
      getTimeRemaining: ReturnType<typeof vi.fn>;
      clearSession: ReturnType<typeof vi.fn>;
      getSessionManager: ReturnType<typeof vi.fn>;
    } & Partial<SessionCoordinator>;
};

describe('AuthenticationCoordinator', () => {
  vi.spyOn(log, 'error').mockImplementation(() => {});

  it('returns false when strategy is missing', async () => {
    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(undefined)
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    const result = await coordinator.unlock({
      method: 'password',
      password: 'pw'
    });

    expect(result).toBe(false);
  });

  it('returns false when unlock fails', async () => {
    const strategy = createStrategy('password');
    strategy.unlock.mockResolvedValue(false);

    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy)
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    const result = await coordinator.unlock({
      method: 'password',
      password: 'pw'
    });

    expect(result).toBe(false);
  });

  it('returns false when unlock throws', async () => {
    const strategy = createStrategy('password');
    strategy.unlock.mockRejectedValue(new Error('boom'));

    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy)
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    const result = await coordinator.unlock({
      method: 'password',
      password: 'pw'
    });

    expect(result).toBe(false);
    expect(log.error).toHaveBeenCalled();
  });

  it('loads credentials, persists, and creates session', async () => {
    const strategy = createStrategy('password');
    strategy.getCredential.mockImplementation(async (key: string) => {
      return `value-${key}`;
    });

    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy),
      hasAnyCredentials: true,
      preferredMethod: 'password'
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    const result = await coordinator.unlock({
      method: 'password',
      password: 'pw'
    });

    expect(result).toBe(true);
    expect(strategy.setCredential).toHaveBeenCalled();
    expect(sessionCoordinator.createSession).toHaveBeenCalled();
    expect(cache.get('pairingPhrase')).toBe('value-pairingPhrase');
  });

  it('returns the active strategy after unlock', async () => {
    const strategy = createStrategy('password');
    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy),
      hasAnyCredentials: false,
      preferredMethod: 'password'
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await coordinator.unlock({ method: 'password', password: 'pw' });

    expect(coordinator.getActiveStrategy()).toBe(strategy);
  });

  it('logs when loading credentials fails', async () => {
    const strategy = createStrategy('password');
    strategy.getCredential.mockRejectedValue(new Error('boom'));

    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy),
      hasAnyCredentials: false,
      preferredMethod: 'password'
    } as unknown as StrategyManager;

    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await coordinator.unlock({ method: 'password', password: 'pw' });

    expect(log.error).toHaveBeenCalled();
  });

  it('logs when persisting cached credentials fails', async () => {
    const strategy = createStrategy('password');
    strategy.setCredential.mockRejectedValue(new Error('boom'));

    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy),
      hasAnyCredentials: false,
      preferredMethod: 'password'
    } as unknown as StrategyManager;

    const cache = new CredentialCache();
    cache.set('localKey', 'local');
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await coordinator.unlock({ method: 'password', password: 'pw' });

    expect(log.error).toHaveBeenCalled();
  });

  it('skips persistence for session strategy', async () => {
    const strategy = createStrategy('session');
    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy),
      hasAnyCredentials: false,
      preferredMethod: 'session'
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    const result = await coordinator.unlock({ method: 'session' });

    expect(result).toBe(true);
    expect(strategy.setCredential).not.toHaveBeenCalled();
  });

  it('returns authentication info with session state', async () => {
    const passkeyStrategy = createStrategy('passkey');
    passkeyStrategy.hasStoredAuthData.mockReturnValue(true);

    const strategyManager = {
      getStrategy: vi.fn((method: string) => {
        if (method === 'passkey') return passkeyStrategy;
        return undefined;
      }),
      hasAnyCredentials: true,
      preferredMethod: 'password'
    } as unknown as StrategyManager;

    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator({
      hasActiveSession: true,
      getTimeRemaining: vi.fn().mockResolvedValue(1234)
    });

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    const info = await coordinator.getAuthenticationInfo();

    expect(info.hasActiveSession).toBe(true);
    expect(info.sessionTimeRemaining).toBe(1234);
    expect(info.supportsPasskeys).toBe(true);
    expect(info.hasPasskey).toBe(true);
  });

  it('skips session restoration when sessions are unavailable', async () => {
    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(undefined),
      hasAnyCredentials: false,
      preferredMethod: 'password'
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator({
      isSessionAvailable: false
    });

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await expect(coordinator.getAuthenticationInfo()).resolves.toMatchObject({
      hasStoredCredentials: false
    });
  });

  it('falls back to manual auto-restore when cache init is missing', async () => {
    const sessionStrategy = createStrategy('session');
    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(sessionStrategy),
      hasAnyCredentials: false,
      preferredMethod: 'session'
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    const tryRestoreSpy = vi.spyOn(coordinator, 'tryAutoRestore');
    (
      coordinator as unknown as { initializeCachePromise?: Promise<void> }
    ).initializeCachePromise = undefined;

    await coordinator.getAuthenticationInfo();

    expect(tryRestoreSpy).toHaveBeenCalled();
  });

  it('initializes cache from active strategy when no session is restored', async () => {
    const strategy = createStrategy('password');
    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy),
      hasAnyCredentials: false,
      preferredMethod: 'password'
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    (
      coordinator as unknown as { activeStrategy?: AuthStrategy }
    ).activeStrategy = strategy;
    (coordinator as unknown as { sessionRestored: boolean }).sessionRestored =
      false;
    (
      coordinator as unknown as { tryAutoRestore: () => Promise<boolean> }
    ).tryAutoRestore = vi.fn().mockResolvedValue(false);

    const loadSpy = vi.spyOn(
      coordinator as unknown as {
        loadCredentialsFromStrategy: () => Promise<void>;
      },
      'loadCredentialsFromStrategy'
    );

    await (
      coordinator as unknown as { initializeCache: () => Promise<void> }
    ).initializeCache();

    expect(loadSpy).toHaveBeenCalled();
  });

  it('restores session credentials during auto-restore', async () => {
    const sessionStrategy = createStrategy('session');

    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(sessionStrategy)
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    const restored = await coordinator.tryAutoRestore();

    expect(restored).toBe(true);
    expect(cache.get('localKey')).toBe('local');
  });

  it('handles auto-restore failures gracefully', async () => {
    const sessionStrategy = createStrategy('session');
    sessionStrategy.unlock.mockRejectedValue(new Error('boom'));

    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(sessionStrategy)
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await expect(coordinator.tryAutoRestore()).resolves.toBe(false);
    expect(log.error).toHaveBeenCalled();
  });

  it('creates session after connection', async () => {
    const strategy = createStrategy('password');
    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy)
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    cache.set('localKey', 'local');
    cache.set('remoteKey', 'remote');
    cache.set('pairingPhrase', 'pairing');
    cache.set('serverHost', 'server');

    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await coordinator.createSessionAfterConnection();

    expect(strategy.setCredential).toHaveBeenCalled();
    expect(sessionCoordinator.createSession).toHaveBeenCalled();
  });

  it('creates a session during unlock when available', async () => {
    const strategy = createStrategy('password');
    strategy.getCredential.mockResolvedValue(undefined);
    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy),
      hasAnyCredentials: false,
      preferredMethod: 'password'
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await coordinator.unlock({ method: 'password', password: 'pw' });

    expect(sessionCoordinator.createSession).toHaveBeenCalled();
  });

  it('skips session creation when sessions are disabled', async () => {
    const strategy = createStrategy('password');
    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy),
      hasAnyCredentials: false,
      preferredMethod: 'password'
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator({
      isSessionAvailable: false
    });

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await coordinator.unlock({ method: 'password', password: 'pw' });

    expect(sessionCoordinator.createSession).not.toHaveBeenCalled();
  });

  it('skips session creation when credentials are not unlocked', async () => {
    const strategy = createStrategy('password');
    strategy.isUnlocked = false;

    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy),
      hasAnyCredentials: false,
      preferredMethod: 'password'
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await coordinator.unlock({ method: 'password', password: 'pw' });

    expect(sessionCoordinator.createSession).not.toHaveBeenCalled();
  });

  it('passes cached credentials into session creation on unlock', async () => {
    const strategy = createStrategy('password');
    strategy.getCredential.mockResolvedValue(undefined);

    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy),
      hasAnyCredentials: false,
      preferredMethod: 'password'
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    cache.set('localKey', 'local');
    cache.set('remoteKey', 'remote');
    cache.set('pairingPhrase', 'pairing');
    cache.set('serverHost', 'server');
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await coordinator.unlock({ method: 'password', password: 'pw' });

    expect(sessionCoordinator.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        localKey: 'local',
        remoteKey: 'remote',
        pairingPhrase: 'pairing',
        serverHost: 'server'
      })
    );
  });

  it('creates a session after connection with empty cache values', async () => {
    const strategy = createStrategy('password');
    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy)
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await coordinator.createSessionAfterConnection();

    expect(sessionCoordinator.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        localKey: '',
        remoteKey: '',
        pairingPhrase: '',
        serverHost: ''
      })
    );
  });

  it('creates a session after connection with cached values', async () => {
    const strategy = createStrategy('password');
    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy)
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    cache.set('localKey', 'local');
    cache.set('remoteKey', 'remote');
    cache.set('pairingPhrase', 'pairing');
    cache.set('serverHost', 'server');
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await coordinator.createSessionAfterConnection();

    expect(sessionCoordinator.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        localKey: 'local',
        remoteKey: 'remote',
        pairingPhrase: 'pairing',
        serverHost: 'server'
      })
    );
  });

  it('throws an error when saving credentials fails', async () => {
    const strategy = createStrategy('password');
    strategy.setCredential.mockRejectedValue(new Error('boom'));

    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(strategy)
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    cache.set('localKey', 'local');
    cache.set('remoteKey', 'remote');

    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    await coordinator.unlock({ method: 'password', password: 'pw' });
    await expect(coordinator.createSessionAfterConnection()).rejects.toThrow(
      'boom'
    );

    expect(log.error).toHaveBeenCalled();
  });

  it('clears session state', () => {
    const strategyManager = {
      getStrategy: vi.fn().mockReturnValue(undefined)
    } as unknown as StrategyManager;
    const cache = new CredentialCache();
    const sessionCoordinator = createSessionCoordinator();

    const coordinator = new AuthenticationCoordinator(
      strategyManager,
      cache,
      sessionCoordinator
    );

    coordinator.clearSession();

    expect(sessionCoordinator.clearSession).toHaveBeenCalled();
  });
});
