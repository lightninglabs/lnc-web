import { describe, expect, it, vi } from 'vitest';
import { log } from '../util/log';
import { SessionCoordinator } from './sessionCoordinator';

const createSessionManager = () => ({
  canAutoRestore: true,
  hasValidSession: vi.fn().mockResolvedValue(true),
  restoreSession: vi.fn().mockResolvedValue({
    localKey: 'local',
    remoteKey: 'remote',
    pairingPhrase: 'pairing',
    serverHost: 'server',
    expiresAt: Date.now()
  }),
  createSession: vi.fn().mockResolvedValue(undefined),
  refreshSession: vi.fn().mockResolvedValue(true),
  hasActiveSession: true,
  sessionTimeRemaining: 1000,
  clearSession: vi.fn()
});

vi.spyOn(log, 'info').mockImplementation(() => {});
vi.spyOn(log, 'warn').mockImplementation(() => {});
vi.spyOn(log, 'error').mockImplementation(() => {});

describe('SessionCoordinator', () => {
  it('returns false when no session manager is available', async () => {
    const coordinator = new SessionCoordinator();

    await expect(coordinator.canAutoRestore()).resolves.toBe(false);
    await expect(coordinator.tryAutoRestore()).resolves.toBe(false);
    await expect(coordinator.refreshSession()).resolves.toBe(false);
    expect(coordinator.hasActiveSession).toBe(false);
    await expect(coordinator.getTimeRemaining()).resolves.toBe(0);
    expect(coordinator.sessionExpiry).toBeUndefined();
    expect(coordinator.getRefreshManager()).toBeUndefined();
    expect(coordinator.isAutoRefreshActive).toBe(false);
  });

  it('checks auto-restore availability', async () => {
    const manager = createSessionManager();
    const coordinator = new SessionCoordinator(manager as never);

    await expect(coordinator.canAutoRestore()).resolves.toBe(true);

    manager.canAutoRestore = false;
    await expect(coordinator.canAutoRestore()).resolves.toBe(false);
  });

  it('returns false when session is invalid', async () => {
    const manager = createSessionManager();
    manager.hasValidSession.mockResolvedValue(false);
    const coordinator = new SessionCoordinator(manager as never);

    await expect(coordinator.canAutoRestore()).resolves.toBe(false);
  });

  it('attempts auto-restore and starts refresh manager', async () => {
    const manager = createSessionManager();
    const coordinator = new SessionCoordinator(manager as never);

    const restored = await coordinator.tryAutoRestore();

    expect(restored).toBe(true);
    expect(coordinator.isAutoRefreshActive).toBe(true);
  });

  it('handles auto-restore errors', async () => {
    const manager = createSessionManager();
    manager.restoreSession.mockRejectedValue(new Error('boom'));
    const coordinator = new SessionCoordinator(manager as never);

    await expect(coordinator.tryAutoRestore()).resolves.toBe(false);
    expect(log.error).toHaveBeenCalled();
  });

  it('creates sessions and starts refresh manager', async () => {
    const manager = createSessionManager();
    const coordinator = new SessionCoordinator(manager as never);

    await coordinator.createSession({
      localKey: 'local',
      remoteKey: 'remote',
      pairingPhrase: 'pairing',
      serverHost: 'server'
    });

    expect(manager.createSession).toHaveBeenCalled();
    expect(coordinator.isAutoRefreshActive).toBe(true);
  });

  it('logs when session manager is missing on create', async () => {
    const coordinator = new SessionCoordinator();

    await coordinator.createSession({
      localKey: 'local',
      remoteKey: 'remote',
      pairingPhrase: 'pairing',
      serverHost: 'server'
    });

    expect(log.warn).toHaveBeenCalled();
  });

  it('throws when session creation fails', async () => {
    const manager = createSessionManager();
    manager.createSession.mockRejectedValue(new Error('boom'));
    const coordinator = new SessionCoordinator(manager as never);

    await expect(
      coordinator.createSession({
        localKey: 'local',
        remoteKey: 'remote',
        pairingPhrase: 'pairing',
        serverHost: 'server'
      })
    ).rejects.toThrow('boom');
  });

  it('handles refresh errors', async () => {
    const manager = createSessionManager();
    manager.refreshSession.mockRejectedValue(new Error('boom'));
    const coordinator = new SessionCoordinator(manager as never);

    await expect(coordinator.refreshSession()).resolves.toBe(false);
  });

  it('clears session and stops refresh manager', async () => {
    const manager = createSessionManager();
    const coordinator = new SessionCoordinator(manager as never);

    await coordinator.createSession({
      localKey: 'local',
      remoteKey: 'remote',
      pairingPhrase: 'pairing',
      serverHost: 'server'
    });

    coordinator.clearSession();

    expect(manager.clearSession).toHaveBeenCalled();
  });

  it('reports session state', async () => {
    const manager = createSessionManager();
    const coordinator = new SessionCoordinator(manager as never);

    expect(coordinator.hasActiveSession).toBe(true);
    await expect(coordinator.getTimeRemaining()).resolves.toBe(1000);
    expect(coordinator.isSessionAvailable).toBe(true);
  });

  it('reports session expiry and refresh manager', () => {
    const manager = createSessionManager();
    const coordinator = new SessionCoordinator(manager as never);

    expect(coordinator.sessionExpiry).toBeInstanceOf(Date);
    expect(coordinator.getRefreshManager()).toBeDefined();
    expect(coordinator.getSessionManager()).toBe(manager);
  });

  it('returns undefined expiry when no session time remains', () => {
    const manager = createSessionManager();
    manager.sessionTimeRemaining = 0;
    const coordinator = new SessionCoordinator(manager as never);

    expect(coordinator.sessionExpiry).toBeUndefined();
  });
});
