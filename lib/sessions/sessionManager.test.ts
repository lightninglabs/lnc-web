import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '../util/log';
import SessionManager from './sessionManager';
import { SessionCredentials } from './types';

vi.spyOn(log, 'info').mockImplementation(() => {});
vi.spyOn(log, 'error').mockImplementation(() => {});

describe('SessionManager', () => {
  const namespace = 'test-session';
  const baseCredentials: SessionCredentials = {
    localKey: 'local',
    remoteKey: 'remote',
    pairingPhrase: 'pair',
    serverHost: 'server'
  };

  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager(namespace);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates and restores sessions', async () => {
    await manager.createSession(baseCredentials);

    const restored = await manager.restoreSession();

    expect(restored).toBeDefined();
    expect(restored?.localKey).toBe(baseCredentials.localKey);
    expect(restored?.remoteKey).toBe(baseCredentials.remoteKey);
    expect(restored?.pairingPhrase).toBe(baseCredentials.pairingPhrase);
    expect(restored?.serverHost).toBe(baseCredentials.serverHost);
  });

  it('throws when session creation fails', async () => {
    const storage = (manager as unknown as { storage: { save: () => void } })
      .storage;
    vi.spyOn(storage, 'save').mockImplementation(() => {
      throw new Error('save failed');
    });

    await expect(manager.createSession(baseCredentials)).rejects.toThrow(
      'save failed'
    );
  });

  it('returns undefined when no session is stored', async () => {
    await expect(manager.restoreSession()).resolves.toBeUndefined();
  });

  it('uses crypto.randomUUID when available', async () => {
    const uuidSpy = vi.fn(() => 'uuid-123');
    const originalRandomUUID = crypto.randomUUID;

    Object.assign(crypto, { randomUUID: uuidSpy });

    await manager.createSession(baseCredentials);

    const stored = sessionStorage.getItem(`lnc-session:${namespace}`);
    expect(stored).toContain('uuid-123');
    expect(uuidSpy).toHaveBeenCalled();

    Object.assign(crypto, { randomUUID: originalRandomUUID });
  });

  it('returns undefined for expired sessions', async () => {
    await manager.createSession(baseCredentials);

    vi.advanceTimersByTime(25 * 60 * 60 * 1000);

    const restored = await manager.restoreSession();

    expect(restored).toBeUndefined();
    expect(manager.hasActiveSession).toBe(false);
  });

  it('refreshes sessions and extends expiry', async () => {
    await manager.createSession(baseCredentials);

    const success = await manager.refreshSession();
    const remaining = manager.sessionTimeRemaining;

    expect(success).toBe(true);
    expect(remaining).toBeGreaterThan(0);
  });

  it('returns false when refreshing without a session', async () => {
    await expect(manager.refreshSession()).resolves.toBe(false);
  });

  it('tracks active session status', async () => {
    expect(manager.hasActiveSession).toBe(false);

    await manager.createSession(baseCredentials);

    expect(manager.hasActiveSession).toBe(true);
  });

  it('reports session time remaining', async () => {
    expect(manager.sessionTimeRemaining).toBe(0);

    await manager.createSession(baseCredentials);

    const remaining = manager.sessionTimeRemaining;
    expect(remaining).toBeGreaterThan(0);
  });

  it('clears sessions', async () => {
    await manager.createSession(baseCredentials);

    manager.clearSession();

    expect(manager.hasActiveSession).toBe(false);
  });

  it('checks auto-restore availability', async () => {
    expect(manager.canAutoRestore).toBe(false);

    await manager.createSession(baseCredentials);

    expect(manager.canAutoRestore).toBe(true);
  });

  it('validates session availability', async () => {
    await manager.createSession(baseCredentials);

    await expect(manager.hasValidSession()).resolves.toBe(true);

    vi.advanceTimersByTime(25 * 60 * 60 * 1000);

    await expect(manager.hasValidSession()).resolves.toBe(false);
  });

  it('clears invalid sessions when restore fails', async () => {
    await manager.createSession(baseCredentials);

    vi.spyOn(manager, 'restoreSession').mockRejectedValue(
      new Error('restore failed')
    );

    await expect(manager.hasValidSession()).resolves.toBe(false);
    expect(manager.hasActiveSession).toBe(false);
  });

  it('handles restore errors gracefully', async () => {
    const storage = (manager as unknown as { storage: { load: () => void } })
      .storage;
    vi.spyOn(storage, 'load').mockImplementation(() => {
      throw new Error('load failed');
    });

    const restored = await manager.restoreSession();

    expect(restored).toBeUndefined();
    expect(log.error).toHaveBeenCalled();
  });

  it('handles refresh errors gracefully', async () => {
    const storage = (manager as unknown as { storage: { load: () => void } })
      .storage;
    vi.spyOn(storage, 'load').mockImplementation(() => {
      throw new Error('load failed');
    });

    await expect(manager.refreshSession()).resolves.toBe(false);
    expect(log.error).toHaveBeenCalled();
  });

  it('exposes the session namespace', () => {
    expect(manager.getNamespace()).toBe(namespace);
  });
});
