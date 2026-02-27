import { describe, expect, it, vi } from 'vitest';
import { log } from '../util/log';
import { SessionCoordinator } from './sessionCoordinator';

// Mock SessionRefreshManager so that tests don't require a browser environment.
vi.mock('../sessions/sessionRefreshManager', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      let active = false;
      return {
        start: vi.fn(() => {
          active = true;
        }),
        stop: vi.fn(() => {
          active = false;
        }),
        isActive: vi.fn(() => active)
      };
    })
  };
});

const createSessionManager = () => ({
  canAutoRestore: true,
  hasValidSession: vi.fn().mockResolvedValue(true),
  restoreSession: vi.fn().mockResolvedValue({
    localKey: 'local',
    remoteKey: 'remote',
    pairingPhrase: 'pairing',
    serverHost: 'server'
  }),
  createSession: vi.fn().mockResolvedValue(undefined),
  refreshSession: vi.fn().mockResolvedValue(true),
  hasActiveSession: true,
  sessionTimeRemaining: 1000,
  clearSession: vi.fn(),
  config: {
    sessionDurationMs: 24 * 60 * 60 * 1000,
    enableActivityRefresh: true,
    maxRefreshes: 10,
    maxSessionAgeMs: 7 * 24 * 60 * 60 * 1000
  }
});

vi.spyOn(log, 'info').mockImplementation(() => {});
vi.spyOn(log, 'warn').mockImplementation(() => {});
vi.spyOn(log, 'error').mockImplementation(() => {});

describe('SessionCoordinator', () => {
  it('returns defaults when no session manager is available', async () => {
    const coordinator = new SessionCoordinator();

    await expect(coordinator.canAutoRestore()).resolves.toBe(false);
    await expect(coordinator.tryAutoRestore()).resolves.toBeUndefined();
    await expect(coordinator.refreshSession()).resolves.toBe(false);
    expect(coordinator.hasActiveSession).toBe(false);
    await expect(coordinator.getTimeRemaining()).resolves.toBe(0);
    expect(coordinator.sessionExpiry).toBeUndefined();
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

  it('attempts auto-restore and returns credentials', async () => {
    const manager = createSessionManager();
    const coordinator = new SessionCoordinator(manager as never);

    const credentials = await coordinator.tryAutoRestore();

    expect(credentials).toEqual({
      localKey: 'local',
      remoteKey: 'remote',
      pairingPhrase: 'pairing',
      serverHost: 'server'
    });
    expect(coordinator.isAutoRefreshActive).toBe(true);
  });

  it('returns null when restoreSession returns undefined', async () => {
    const manager = createSessionManager();
    manager.restoreSession.mockResolvedValue(undefined);
    const coordinator = new SessionCoordinator(manager as never);

    await expect(coordinator.tryAutoRestore()).resolves.toBeUndefined();
    expect(coordinator.isAutoRefreshActive).toBe(false);
  });

  it('handles auto-restore errors gracefully', async () => {
    const manager = createSessionManager();
    manager.restoreSession.mockRejectedValue(new Error('boom'));
    const coordinator = new SessionCoordinator(manager as never);

    await expect(coordinator.tryAutoRestore()).resolves.toBeUndefined();
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

  it('does not start refresh manager when enableActivityRefresh is false', async () => {
    const manager = createSessionManager();
    manager.config.enableActivityRefresh = false;
    const coordinator = new SessionCoordinator(manager as never);

    await coordinator.createSession({
      localKey: 'local',
      remoteKey: 'remote',
      pairingPhrase: 'pairing',
      serverHost: 'server'
    });

    expect(manager.createSession).toHaveBeenCalled();
    expect(coordinator.isAutoRefreshActive).toBe(false);
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

  it('propagates refresh infrastructure errors to caller', async () => {
    const manager = createSessionManager();
    manager.refreshSession.mockRejectedValue(new Error('boom'));
    const coordinator = new SessionCoordinator(manager as never);

    await expect(coordinator.refreshSession()).rejects.toThrow('boom');
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

    expect(coordinator.isAutoRefreshActive).toBe(true);
    coordinator.clearSession();

    expect(manager.clearSession).toHaveBeenCalled();
    expect(coordinator.isAutoRefreshActive).toBe(false);
  });

  it('reports session state', async () => {
    const manager = createSessionManager();
    const coordinator = new SessionCoordinator(manager as never);

    expect(coordinator.hasActiveSession).toBe(true);
    await expect(coordinator.getTimeRemaining()).resolves.toBe(1000);
    expect(coordinator.isSessionAvailable).toBe(true);
  });

  it('reports session expiry', () => {
    const manager = createSessionManager();
    const coordinator = new SessionCoordinator(manager as never);

    expect(coordinator.sessionExpiry).toBeInstanceOf(Date);
    expect(coordinator.getSessionManager()).toBe(manager);
  });

  it('returns undefined expiry when no session time remains', () => {
    const manager = createSessionManager();
    manager.sessionTimeRemaining = 0;
    const coordinator = new SessionCoordinator(manager as never);

    expect(coordinator.sessionExpiry).toBeUndefined();
  });
});
