import { describe, expect, it, vi } from 'vitest';
import { log } from '../util/log';
import { SessionStrategy } from './sessionStrategy';

const createSessionManager = () => ({
  hasActiveSession: true,
  restoreSession: vi.fn().mockResolvedValue({
    localKey: 'local',
    remoteKey: 'remote',
    pairingPhrase: 'pairing',
    serverHost: 'server',
    expiresAt: Date.now()
  }),
  canAutoRestore: true,
  hasValidSession: vi.fn().mockResolvedValue(true),
  clearSession: vi.fn()
});

vi.spyOn(log, 'warn').mockImplementation(() => {});
vi.spyOn(log, 'error').mockImplementation(() => {});

describe('SessionStrategy', () => {
  it('reports support and lock state', () => {
    const manager = createSessionManager();
    const strategy = new SessionStrategy(manager as never);

    expect(strategy.isSupported).toBe(true);
    expect(strategy.isUnlocked).toBe(false);
  });

  it('reports whether session credentials exist', () => {
    const manager = createSessionManager();
    manager.hasActiveSession = false;
    const strategy = new SessionStrategy(manager as never);

    expect(strategy.hasAnyCredentials).toBe(false);
  });

  it('unlocks when session restore succeeds', async () => {
    const manager = createSessionManager();
    const strategy = new SessionStrategy(manager as never);

    const result = await strategy.unlock({ method: 'session' });

    expect(result).toBe(true);
    expect(strategy.isUnlocked).toBe(true);
  });

  it('returns false for non-session unlock attempts', async () => {
    const manager = createSessionManager();
    const strategy = new SessionStrategy(manager as never);

    const result = await strategy.unlock({
      method: 'password',
      password: 'pw'
    });

    expect(result).toBe(false);
  });

  it('handles unlock errors', async () => {
    const manager = createSessionManager();
    manager.restoreSession.mockRejectedValue(new Error('boom'));

    const strategy = new SessionStrategy(manager as never);
    const result = await strategy.unlock({ method: 'session' });

    expect(result).toBe(false);
    expect(log.error).toHaveBeenCalled();
  });

  it('checks auto-restore availability', async () => {
    const manager = createSessionManager();
    const strategy = new SessionStrategy(manager as never);

    await expect(strategy.canAutoRestore()).resolves.toBe(true);

    manager.canAutoRestore = false;
    await expect(strategy.canAutoRestore()).resolves.toBe(false);
  });

  it('returns credentials when unlocked', async () => {
    const manager = createSessionManager();
    const strategy = new SessionStrategy(manager as never);

    await strategy.unlock({ method: 'session' });

    await expect(strategy.getCredential('localKey')).resolves.toBe('local');
  });

  it('returns undefined when credential key is missing', async () => {
    const manager = createSessionManager();
    manager.restoreSession.mockResolvedValue({
      localKey: 'local',
      remoteKey: 'remote',
      pairingPhrase: 'pairing',
      serverHost: 'server',
      expiresAt: Date.now()
    });

    const strategy = new SessionStrategy(manager as never);
    await strategy.unlock({ method: 'session' });

    await expect(strategy.getCredential('missing')).resolves.toBeUndefined();
  });

  it('returns undefined when not unlocked', async () => {
    const manager = createSessionManager();
    manager.hasActiveSession = false;

    const strategy = new SessionStrategy(manager as never);

    await expect(strategy.getCredential('localKey')).resolves.toBeUndefined();
  });

  it('handles credential read errors', async () => {
    const manager = createSessionManager();
    manager.restoreSession
      .mockResolvedValueOnce({
        localKey: 'local',
        remoteKey: 'remote',
        pairingPhrase: 'pairing',
        serverHost: 'server',
        expiresAt: Date.now()
      })
      .mockRejectedValueOnce(new Error('boom'));

    const strategy = new SessionStrategy(manager as never);
    await strategy.unlock({ method: 'session' });

    await expect(strategy.getCredential('localKey')).resolves.toBeUndefined();
    expect(log.error).toHaveBeenCalled();
  });

  it('throws on setCredential', async () => {
    const manager = createSessionManager();
    const strategy = new SessionStrategy(manager as never);

    await expect(strategy.setCredential('localKey', 'value')).rejects.toThrow(
      'SessionStrategy does not support direct credential storage'
    );
  });

  it('returns false for canAutoRestore when hasValidSession is false', async () => {
    const manager = createSessionManager();
    manager.hasValidSession.mockResolvedValue(false);
    const strategy = new SessionStrategy(manager as never);

    await expect(strategy.canAutoRestore()).resolves.toBe(false);
  });

  it('clears session state', () => {
    const manager = createSessionManager();
    const strategy = new SessionStrategy(manager as never);

    strategy.clear();

    expect(manager.clearSession).toHaveBeenCalled();
  });
});
