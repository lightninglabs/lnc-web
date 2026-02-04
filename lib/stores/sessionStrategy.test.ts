import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { log } from '../util/log';
import { SessionStrategy } from './sessionStrategy';

// Mock SessionManager
const mockSessionManager = {
  restoreSession: vi.fn(),
  _hasActiveSession: false,
  get hasActiveSession() {
    return mockSessionManager._hasActiveSession;
  },
  _canAutoRestore: false,
  get canAutoRestore() {
    return mockSessionManager._canAutoRestore;
  },
  hasValidSession: vi.fn(),
  clearSession: vi.fn()
};

vi.mock('../sessions/sessionManager', () => ({
  default: vi.fn().mockImplementation(() => mockSessionManager)
}));

describe('SessionStrategy', () => {
  let strategy: SessionStrategy;
  let mockSession: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = {
      localKey: 'session-local-key',
      remoteKey: 'session-remote-key',
      pairingPhrase: 'session-pairing-phrase',
      serverHost: 'session-host:443'
    };

    // Reset mock defaults
    mockSessionManager.restoreSession.mockResolvedValue(null);
    mockSessionManager._hasActiveSession = false;
    mockSessionManager._canAutoRestore = false;
    mockSessionManager.hasValidSession.mockResolvedValue(false);

    strategy = new SessionStrategy(mockSessionManager as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with session manager', () => {
      expect(strategy).toBeInstanceOf(SessionStrategy);
      expect(strategy.method).toBe('session');
    });
  });

  describe('isSupported', () => {
    it('should always return true', () => {
      expect(strategy.isSupported).toBe(true);
    });
  });

  describe('isUnlocked', () => {
    it('should return true when session is validated and has active session', () => {
      (strategy as any).sessionValidated = true;
      mockSessionManager._hasActiveSession = true;

      expect(strategy.isUnlocked).toBe(true);
    });

    it('should return false when session is not validated', () => {
      (strategy as any).sessionValidated = false;
      mockSessionManager._hasActiveSession = true;
      expect(strategy.isUnlocked).toBe(false);
    });

    it('should return false when no active session', () => {
      (strategy as any).sessionValidated = true;
      mockSessionManager._hasActiveSession = false;

      expect(strategy.isUnlocked).toBe(false);
    });

    it('should return false when neither validated nor active session', () => {
      (strategy as any).sessionValidated = false;
      mockSessionManager._hasActiveSession = false;

      expect(strategy.isUnlocked).toBe(false);
    });
  });

  describe('unlock()', () => {
    it('should unlock with session method and return true when session restored', async () => {
      mockSessionManager.restoreSession.mockResolvedValue(mockSession);

      const result = await strategy.unlock({ method: 'session' });

      expect(result).toBe(true);
      expect(mockSessionManager.restoreSession).toHaveBeenCalled();
      expect((strategy as any).sessionValidated).toBe(true);
    });

    it('should return false for non-session method', async () => {
      const result = await strategy.unlock({ method: 'password' } as any);

      expect(result).toBe(false);
      expect(mockSessionManager.restoreSession).not.toHaveBeenCalled();
    });

    it('should return false when session restore fails', async () => {
      const error = new Error('Session restore failed');
      mockSessionManager.restoreSession.mockRejectedValue(error);

      const result = await strategy.unlock({ method: 'session' });

      expect(result).toBe(false);
      expect(mockSessionManager.restoreSession).toHaveBeenCalled();
      expect((strategy as any).sessionValidated).toBe(false);
    });

    it('should return false when no session is restored', async () => {
      mockSessionManager.restoreSession.mockResolvedValue(null);

      const result = await strategy.unlock({ method: 'session' });

      expect(result).toBe(false);
      expect((strategy as any).sessionValidated).toBe(false);
    });

    it('should log error when session restore fails', async () => {
      const error = new Error('Session restore failed');
      mockSessionManager.restoreSession.mockRejectedValue(error);
      const spy = vi.spyOn(log, 'error');

      await strategy.unlock({ method: 'session' });

      expect(spy).toHaveBeenCalledWith(
        '[SessionStrategy] Session restore failed:',
        error
      );
    });
  });

  describe('getCredential()', () => {
    it('should return credential value when unlocked and session has key', async () => {
      (strategy as any).sessionValidated = true;
      mockSessionManager._hasActiveSession = true;
      mockSessionManager.restoreSession.mockResolvedValue(mockSession);

      const result = await strategy.getCredential('localKey');

      expect(result).toBe('session-local-key');
      expect(mockSessionManager.restoreSession).toHaveBeenCalled();
    });

    it('should return undefined when not unlocked', async () => {
      (strategy as any).sessionValidated = false;
      mockSessionManager._hasActiveSession = false;
      const spy = vi.spyOn(log, 'warn');

      const result = await strategy.getCredential('localKey');

      expect(result).toBeUndefined();
      expect(mockSessionManager.restoreSession).not.toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(
        '[SessionStrategy] Cannot get credential - no active session'
      );
    });

    it('should return undefined when session does not have the key', async () => {
      (strategy as any).sessionValidated = true;
      mockSessionManager._hasActiveSession = true;
      mockSessionManager.restoreSession.mockResolvedValue(mockSession);

      const result = await strategy.getCredential('non-existent-key');

      expect(result).toBeUndefined();
    });

    it('should return undefined when session restore fails', async () => {
      (strategy as any).sessionValidated = true;
      mockSessionManager._hasActiveSession = true;
      const error = new Error('Session restore failed');
      mockSessionManager.restoreSession.mockRejectedValue(error);
      const spy = vi.spyOn(log, 'error');

      const result = await strategy.getCredential('localKey');

      expect(result).toBeUndefined();
      expect(spy).toHaveBeenCalledWith(
        '[SessionStrategy] Failed to get credential localKey:',
        error
      );
    });

    it('should return undefined when no session is restored', async () => {
      (strategy as any).sessionValidated = true;
      mockSessionManager._hasActiveSession = true;
      mockSessionManager.restoreSession.mockResolvedValue(null);

      const result = await strategy.getCredential('localKey');

      expect(result).toBeUndefined();
    });
  });

  describe('hasAnyCredentials()', () => {
    it('should return true when session is validated and has active session', () => {
      (strategy as any).sessionValidated = true;
      mockSessionManager._hasActiveSession = true;

      expect(strategy.hasAnyCredentials).toBe(true);
    });

    it('should return false when session is not validated', () => {
      (strategy as any).sessionValidated = false;
      mockSessionManager._hasActiveSession = true;

      expect(strategy.hasAnyCredentials).toBe(false);
    });

    it('should return false when no active session', () => {
      (strategy as any).sessionValidated = true;
      mockSessionManager._hasActiveSession = false;

      expect(strategy.hasAnyCredentials).toBe(false);
    });
  });

  describe('canAutoRestore()', () => {
    it('should return false when session manager cannot auto restore', async () => {
      mockSessionManager._canAutoRestore = false;

      const result = await strategy.canAutoRestore();

      expect(result).toBe(false);
      expect(mockSessionManager.hasValidSession).not.toHaveBeenCalled();
    });

    it('should return true when session manager can auto restore and has valid session', async () => {
      mockSessionManager._canAutoRestore = true;
      mockSessionManager.hasValidSession.mockResolvedValue(true);

      const result = await strategy.canAutoRestore();

      expect(result).toBe(true);
      expect(mockSessionManager.hasValidSession).toHaveBeenCalled();
    });

    it('should return false when session manager can auto restore but no valid session', async () => {
      mockSessionManager._canAutoRestore = true;
      mockSessionManager.hasValidSession.mockResolvedValue(false);

      const result = await strategy.canAutoRestore();

      expect(result).toBe(false);
      expect(mockSessionManager.hasValidSession).toHaveBeenCalled();
    });

    it('should propagate hasValidSession errors', async () => {
      const error = new Error('Validation failed');
      mockSessionManager._canAutoRestore = true;
      mockSessionManager.hasValidSession.mockRejectedValue(error);

      await expect(strategy.canAutoRestore()).rejects.toThrow(
        'Validation failed'
      );
    });
  });

  describe('setCredential()', () => {
    it('should throw error indicating setCredential is not supported', async () => {
      const spy = vi.spyOn(log, 'warn');

      await expect(
        strategy.setCredential('test-key', 'test-value')
      ).rejects.toThrow(
        'SessionStrategy does not support direct credential storage'
      );

      expect(spy).toHaveBeenCalledWith(
        '[SessionStrategy] setCredential(test-key) not supported - use createSession() instead'
      );
    });
  });

  describe('clear()', () => {
    it('should clear session validation and call session manager clear', () => {
      (strategy as any).sessionValidated = true;

      strategy.clear();

      expect((strategy as any).sessionValidated).toBe(false);
      expect(mockSessionManager.clearSession).toHaveBeenCalled();
    });
  });

  describe('Integration tests', () => {
    it('should support full session workflow', async () => {
      // Initially not unlocked
      expect(strategy.isUnlocked).toBe(false);

      // Unlock with session
      mockSessionManager.restoreSession.mockResolvedValue(mockSession);
      mockSessionManager._hasActiveSession = true;
      const unlockResult = await strategy.unlock({ method: 'session' });
      expect(unlockResult).toBe(true);
      expect(strategy.isUnlocked).toBe(true);
      expect(strategy.hasAnyCredentials).toBe(true);

      // Get credentials
      const localKey = await strategy.getCredential('localKey');
      const remoteKey = await strategy.getCredential('remoteKey');
      const pairingPhrase = await strategy.getCredential('pairingPhrase');

      expect(localKey).toBe('session-local-key');
      expect(remoteKey).toBe('session-remote-key');
      expect(pairingPhrase).toBe('session-pairing-phrase');

      // Test setCredential throws
      await expect(
        strategy.setCredential('test-key', 'test-value')
      ).rejects.toThrow();

      // Clear
      strategy.clear();
      expect((strategy as any).sessionValidated).toBe(false);
      expect(mockSessionManager.clearSession).toHaveBeenCalled();
    });

    it('should handle auto-restore correctly', async () => {
      mockSessionManager._canAutoRestore = true;
      mockSessionManager.hasValidSession.mockResolvedValue(true);

      const canAutoRestore = await strategy.canAutoRestore();

      expect(canAutoRestore).toBe(true);

      // Test when cannot auto restore
      mockSessionManager._canAutoRestore = false;

      const cannotAutoRestore = await strategy.canAutoRestore();

      expect(cannotAutoRestore).toBe(false);
    });

    it('should work with different session managers', () => {
      const manager1 = {} as any;
      const manager2 = {} as any;

      const strategy1 = new SessionStrategy(manager1);
      const strategy2 = new SessionStrategy(manager2);

      expect(strategy1).not.toBe(strategy2);
    });
  });
});
